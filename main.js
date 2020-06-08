// "use strict";
const baseURL = "https://disease.sh/v2/";
let cachedData = {};
let watchList = {};
let masterWatchList = {};
let countryList = "";
let chartCount = 0;
let timeFrame = "0";

Chart.defaults.global.responsive = true;
Chart.defaults.global.maintainAspectRatio = false;

const cardColors = [
  `rgb(78,26,34)`,
  `rgb(236,221,123)`,
  `rgb(206, 129, 71)`,
  `rgb(205,231,190)`,
  `rgb(65,98,116)`,
  `rgb(86,29,37)`,
];

const chartOptions = {
  legend: { labels: { fontColor: "black" } },
  // chart: { responsive: true },
  title: {
    text: "Total number of cases",
    display: false,
    fontColor: "black",
  },
  scales: {
    ticks: [{ autoSkip: true }],
  },
};

function fillCanvas(color, canvasId) {
  const canvas = document.getElementById(`${canvasId}`);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `${color}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function blankCanvas(chartNum, canvasId) {
  const canvas = document.getElementById(`${canvasId}`);
  const ctx = canvas.getContext("2d");

  const chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      labels: [],
      datasets: [
        {
          label: `Total cases for this group`,
          backgroundColor: cardColors[`${chartNum}`],
          borderColor: "rgb(0, 0, 0)",
          data: [],
        },
      ],
      backgroundColor: ["white"],
    },

    // Configuration options go here
    options: chartOptions,
  });
}

function findMissingKeys(objectA, objectB) {
  // returns an array of keys that A HAS and B DOES NOT
  let keyArray = [];
  for (const property in objectA) {
    if (!(property in objectB)) {
      keyArray.push(property);
    }
  }
  return keyArray;
}

function handleTimeFrame() {
  $("main").on("click", "#timeFrame", function (event) {
    event.preventDefault();
    const selectValue = $(this).val();
    // since we only have <= 6 graphs the last char for each element in the card is the id of the overall card, all elements have ids ending with this number
    if (selectValue === "-1") {
      // the first option in the select has value "-1" and is a non-option
      return;
    }
    timeFrame = selectValue;
    console.log("timeFrame set");
    if (Object.keys(cachedData).length) {
      for (let i = 0; i < chartCount; ++i) {
        const graphData = prepareGraphData(timeFrame, i);
        drawGraph(i, graphData[0], graphData[1]);
      }
    }
  });
}

async function getCountryList() {
  // called at the start of the script
  let resultHTML =
    "<option value='-1' selected>Choose a country to add</option>";
  await fetch(baseURL + "countries")
    .then(function (result) {
      if (!result.ok) {
        console.log("Server may be down. Data not found");
      } else {
        return result.text();
      }
    })
    .then(function (result) {
      let interList = [];
      interList = JSON.parse(result);
      for (const element of interList) {
        resultHTML += `<option class="countryListOption">${element.country}</option>`;
      }
      $("#countriesList").html(resultHTML);
      countryList = `${resultHTML}`;
      console.log("list of countries is gotten");
    });
}

function checkCachedData() {
  console.log("cachedData", cachedData);
  // for (const property in cachedData) {
  //   console.log("cachedData key/value: ", property, cachedData[property]);
  // }
}

function getData(countryName) {
  console.log("getData called");
  return fetch(decodeURI(baseURL + `historical/${countryName}?lastdays=1000`))
    .then(function (result) {
      if (!result.ok) {
        console.log("Server may be down or country data not found.");
        updateInvalidWatchList(countryName);
        updateInvalidCache([countryName]);
        window.alert(`Data not found for country: ${countryName}`);
      } else {
        return result.json();
      }
    })
    .catch((error) => {
      console.log("Error: ", error);
    });
}

async function getAllData() {
  const countriesNotCached = findMissingKeys(masterWatchList, cachedData);
  let results = await Promise.all(
    countriesNotCached.map((country) => {
      return getData(country).catch((error) => {
        console.log("Error: ", error);
      });
    })
  );
  return results.filter((result) => !(result instanceof Error));
}

function updateCache(data) {
  for (const element of data) {
    if (element) {
      cachedData[element.country] = element.timeline.cases;
    }
  }
}

function updateInvalidCache(countryName) {
  cachedData[countryName] = 0;
}

function checkTimeFrame() {
  return timeFrame;
}

function prepareGraphData(timeFrame, chartNum) {
  let labelsArray = [];
  let dataArray = [];
  let datasetArray = [];

  const firstCacheItem = Object.keys(cachedData)[0];
  if (timeFrame === "0") {
    for (const property in cachedData[firstCacheItem]) {
      labelsArray.push(property);
    }
  } else {
    labelsArray = Object.keys(cachedData[firstCacheItem]).slice(-timeFrame); // gives the last [timeFrame] number of entries of the dates of cases
  }
  dataArray = new Array(labelsArray.length).fill(0);
  for (let i = 0; i < Object.keys(watchList[chartNum]).length; ++i) {
    let thisCountry = Object.keys(watchList[chartNum])[i];
    if (timeFrame === "0") {
      for (let j = 0; j < labelsArray.length; ++j) {
        if (cachedData[thisCountry]) {
          dataArray[j] +=
            cachedData[thisCountry][Object.keys(cachedData[thisCountry])[j]];
        }
      }
    } else {
      if (cachedData[thisCountry]) {
        let data = Object.keys(cachedData[thisCountry]).slice(-timeFrame);
        console.log("data: ", data);
        for (let j = 0; j < timeFrame; ++j) {
          dataArray[j] += cachedData[thisCountry][data[j]];
        }
      }
    }
  }
  // for (const country in watchList[chartNum]) {
  //   if (timeFrame === "0") {
  //     dataArray = dataArray.map(
  //       (entry, index) => entry + Object.keys(cachedData[country])[index]
  //     );
  //   } else {
  //     let data = Object.keys(cachedData[thisCountry]).slice(-timeFrame);
  //     console.log("data: ", data);
  //     for (let j = 0; j < timeFrame; ++j) {
  //       dataArray[j] += cachedData[thisCountry][data[j]];
  //     }
  //   }
  // }
  datasetArray = [
    {
      label: "Total cases",
      backgroundColor: cardColors[`${chartNum}`],
      borderColor: "rgb(0, 0, 0)",
      data: dataArray,
    },
  ];
  console.log(
    `chartNum: ${chartNum}`,
    "chartColor: ",
    cardColors[`${chartNum}`]
  );
  return [labelsArray, datasetArray];
}

function drawWatchList(cardNum) {
  let watchListHtml = "";
  console.log("HEREREREREEEEE");
  checkCachedData();
  for (const country in watchList[cardNum]) {
    if (cachedData[country] !== 0) {
      watchListHtml += `<div><li">${country}<button id="${cardNum}${country}" class="removeButton">Remove Country</button></li></div>`;
    } else {
      watchListHtml += `<div class="noDataCountry"><li">${country}<button id="${cardNum}${country}" class="removeButton">Remove Country</button></li></div>`;
    }
  }
  $(`#watchList${cardNum}`).html(watchListHtml);
}

function drawGraph(chartNum, labelsArray, datasetArray) {
  const ctx = document.getElementById(`chart${chartNum}`).getContext("2d");

  const chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      labels: labelsArray,
      datasets: datasetArray,
      backgroundColor: ["white"],
    },

    // Configuration options go here
    options: chartOptions,
  });
}

function updateInvalidWatchList(country) {
  masterWatchList[country] = 1;
}

function updateWatchLists(cardNum, selectValue) {
  if (!(watchList[cardNum] instanceof Object)) {
    watchList[cardNum] = new Object({});
  }
  watchList[cardNum][`${selectValue}`] = 1;
  masterWatchList[selectValue] = 1;
  console.log("selectValue: ", selectValue);
}

function handleRemoveCountry() {
  $("main").on("click", ".removeButton", function (event) {
    event.preventDefault();
    const thisId = $(this).attr("id");
    const cardNum = thisId[0];
    const country = thisId.substr(1);
    const color = cardColors[cardNum];
    delete watchList[cardNum][country];
    delete masterWatchList[country];
    drawWatchList(cardNum);
    const graphData = prepareGraphData(checkTimeFrame(), cardNum);
    if ($.isEmptyObject(watchList[cardNum])) {
      // fillCanvas(color, `chart${cardNum}`);
      blankCanvas(cardNum, `chart${cardNum}`);
    } else {
      console.log("here");
      drawGraph(cardNum, graphData[0], graphData[1]);
      console.log(watchList[cardNum]);
    }
    console.log("handleRemoveCountry cardNum: ", cardNum);
  });
}

function handleAddCountry() {
  // called by handleEverything
  $("main").on("click", ".addCountryButton", async function (event) {
    event.preventDefault();
    const idOfThis = $(this).attr("id");
    console.log("idOfThis", idOfThis);
    const cardNum = idOfThis[idOfThis.length - 1];
    const targetId = $(`#js-target${cardNum}`);
    const selectValue = targetId.val();
    // since we only have <= 6 graphs the last char for each element in the card is the id of the overall card, all elements have ids ending with this number
    if (selectValue === "-1") {
      // the first option in the select has value "-1" and is a non-option
      return;
    } else {
      updateWatchLists(cardNum, selectValue);
      getAllData()
        .then((data) => {
          drawWatchList(cardNum);
          updateCache(data);
          const graphData = prepareGraphData(checkTimeFrame(), cardNum);
          drawGraph(cardNum, graphData[0], graphData[1]);
        })
        .catch((error) => console.log("Error: ", error));
    }
  });
}

/* <input type="text" list="countriesList" class="countryList" id="countryList${chartCount}"/>
<datalist id="countriesList">
  ${countryList}
</datalist> */

function addGroup() {
  const color = cardColors[chartCount];
  console.log("color: ", color);
  if (chartCount < 6) {
    $("#groupContainer").append(`
    <div class="group round-corners shadow" style="border-left: ${color} 10px solid;">
    <form id="countryOptions${chartCount}" class="groupChild countryOption">
      <select id="js-target${chartCount}" class="countryList selectStyle shadow">${countryList}</select>
      <button id="addCountryButton${chartCount}" class="addCountryButton shadow">Add Country</button>
    </form>
    <div class="graph-wrapper">
      <canvas id="chart${chartCount}" class="graph groupChild shadow"></canvas>
    </div>
    <ul id="watchList${chartCount}" class="watchList groupChild">
      <li>List of tracked countries for this graph</li>
    </ul>
    </div>
    `);
    // fillCanvas(color, `chart${chartCount}`);
    blankCanvas(chartCount, `chart${chartCount}`);
    chartCount += 1;
    console.log("card appended");
  } else {
    console.log("card limit reached, no card appended");
  }
}

function handleAddGroup() {
  $("main").on("click", "#addGroup", (event) => {
    event.preventDefault();
    addGroup();
  });
}

async function handleEverything() {
  await getCountryList();
  handleTimeFrame();
  handleAddCountry();
  handleAddGroup();
  handleRemoveCountry();
  addGroup();
  console.log("everything handled");
}

$(handleEverything());
