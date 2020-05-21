// "use strict";
const baseURL = "https://disease.sh/v2/";
let cachedData = {};
let watchList = {};
let masterWatchList = {};
let countryList = "";
let chartCount = 0;
let timeFrame = "0";

const chartOptions = {
  legend: { labels: { fontColor: "white" } },
  title: {
    text: "Corona Virus Cases",
    display: true,
    fontColor: "white",
  },
};

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
    for (let i = 1; i < chartCount; ++i) {
      const graphData = prepareGraphData(timeFrame, i);
      drawGraph(i, graphData[0], graphData[1]);
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
        console.log("Server may be downed. Data not found");
      } else {
        return result.text();
      }
    })
    .then(function (result) {
      let interList = [];
      interList = JSON.parse(result);
      for (let i = 0; i < interList.length; ++i) {
        resultHTML += `<option class="countryListOption">${interList[i].country}</option>`;
      }
      $("#countriesList").html(resultHTML);
      countryList = `${resultHTML}`;
      console.log("list of countries is gotten");
    });
}

function checkCachedData() {
  for (const property in cachedData) {
    console.log("cachedData key/value: ", property, cachedData[property]);
  }
}

function getData(countryName) {
  console.log("getData called");
  return fetch(decodeURI(baseURL + `historical/${countryName}?lastdays=1000`))
    .then(function (result) {
      if (!result.ok) {
        console.log("Server may be down or country data not found.");
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
  return await Promise.all(
    countriesNotCached.map((country) => {
      return getData(country).catch((error) => {
        console.log("Error: ", error);
      });
    })
  );
}

function updateCache(data) {
  for (let i = 0; i < data.length; ++i) {
    const currentElement = data[i];
    if (currentElement)
      cachedData[currentElement.country] = currentElement.timeline.cases;
  }
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
        dataArray[j] +=
          cachedData[thisCountry][Object.keys(cachedData[thisCountry])[j]];
      }
    } else {
      let data = Object.keys(cachedData[thisCountry]).slice(-timeFrame);
      console.log("data: ", data);
      for (let j = 0; j < timeFrame; ++j) {
        dataArray[j] += cachedData[thisCountry][data[j]];
      }
    }
  }
  datasetArray = [
    {
      label: `Graph${chartNum}`,
      backgroundColor: `rgb(${255}, ${0}, ${0})`,
      borderColor: "rgb(0, 0, 0)",
      data: dataArray,
    },
  ];
  return [labelsArray, datasetArray];
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
    },

    // Configuration options go here
    options: chartOptions,
  });
}

function updateWatchLists(cardNum, selectValue) {
  if (!(watchList[cardNum] instanceof Object)) {
    watchList[cardNum] = new Object({});
  }
  watchList[cardNum][`${selectValue}`] = 1;
  masterWatchList[selectValue] = 1;
  console.log("selectValue: ", selectValue);
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
    }
    getAllData()
      .then((data) => {
        updateCache(data);
        const graphData = prepareGraphData(checkTimeFrame(), cardNum);
        drawGraph(cardNum, graphData[0], graphData[1]);
      })
      .catch((error) => console.log("Error: ", error));
  });
}

/* <input type="text" list="countriesList" class="countryList" id="countryList${chartCount}"/>
<datalist id="countriesList">
  ${countryList}
</datalist> */

function addGroup() {
  if (chartCount < 6) {
    $("#groupContainer").append(`
    <div class="group">
    <h2>graphDiv</h2>
    <form id="countryOptions${chartCount}">
      <select id="js-target${chartCount}" class="countryList">${countryList}</select>
      <button id="addCountryButton${chartCount}" class="addCountryButton">Add Country</button>
    </form>
    <canvas id="chart${chartCount}" class="graph"></canvas>
    </div>
    `);
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
  addGroup();
  console.log("everything handled");
}

$(handleEverything());
