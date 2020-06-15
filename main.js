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

// reads the value of #timeFrame, calls drawGraph if the view is a valid option
// called by handleEverything
function handleTimeFrame() {
  $("header").on("click", "#timeFrame", function (event) {
    event.preventDefault();
    const selectValue = $(this).val();
    if (selectValue === "-1") {
      return;
    }
    timeFrame = selectValue;
    if (Object.keys(cachedData).length) {
      for (let i = 0; i < chartCount; ++i) {
        const graphData = prepareGraphData(timeFrame, i);
        drawGraph(i, graphData[0], graphData[1]);
      }
    }
  });
}

// populates a list of all countries tracked by the source through a fetch call
// called by handleEverything
async function getCountryList() {
  let resultHTML = "<option value='-1' selected>Select country</option>";
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
    });
}

// Makes a fetch call for the passed country. If the fetch fails it calls functions to update our watchList and cachedData
// Accepts string countryName
// Returns a JSON promise
// Called by getAllData
function getData(countryName) {
  return fetch(decodeURI(baseURL + `historical/${countryName}?lastdays=1000`))
    .then(function (result) {
      if (!result.ok) {
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

// Calls getData for any countries we don't have cached data for
// Returns an array of getData calls that are successful
// Called by handleAddCountry
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

// Updates cachedData
// Accepts data to be cached
// Called by handleAddCountry
function updateCache(data) {
  for (const element of data) {
    if (element) {
      cachedData[element.country] = element.timeline.cases;
    }
  }
}

// Updates cachedData for a country with no associated data
// Accepts string for the name of the country
function updateInvalidCache(countryName) {
  cachedData[countryName] = 0;
}

// Accessor for our global timeFrame
function checkTimeFrame() {
  return timeFrame;
}

// Loads labelsArray and datasetArray for a graph
// Accepts int timeFrame (in days), chartNum (to target chart id)
// Returns labelsArray and datasetArray
// Called by handleAddCountry
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
        for (let j = 0; j < timeFrame; ++j) {
          dataArray[j] += cachedData[thisCountry][data[j]];
        }
      }
    }
  }
  datasetArray = [
    {
      label: "Total cases",
      backgroundColor: cardColors[`${chartNum}`],
      borderColor: "rgb(0, 0, 0)",
      data: dataArray,
    },
  ];
  return [labelsArray, datasetArray];
}

// Draws our watchlist for this specific card
// Accepts a cardNum (acts as an id for the card)
// Called by handleAddCountry
function drawWatchList(cardNum) {
  let watchListHtml = "";
  for (const country in watchList[cardNum]) {
    if (cachedData[country] !== 0) {
      watchListHtml += `<li>${country}<button id="${cardNum}${country}" class="removeButton">Remove</button></li>`;
    } else {
      watchListHtml += `<li><span title="No data was found for this country"><i class="alert material-icons" alt="Red exclamation mark within a red circle.">error_outline</i>  ${country}</span>
      <button id="${cardNum}${country}" class="removeButton">Remove</button></li>`;
    }
  }
  $(`#watchList${cardNum}`).html(watchListHtml);
}

// Draws a graph
// Accepts chartNum (acts as an id for the graph), labelsArray (every point on our line graph), datasetArray (value for each point)
// Called by handleAddCountry
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

// Updates our watchList for a country with no associated data
// called by getData
function updateInvalidWatchList(country) {
  masterWatchList[country] = 1;
}

function updateWatchLists(cardNum, selectValue) {
  if (!(watchList[cardNum] instanceof Object)) {
    watchList[cardNum] = new Object({});
  }
  watchList[cardNum][`${selectValue}`] = 1;
  masterWatchList[selectValue] = 1;
}

// Removes a country from a card
// Called by handleEverything
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
      blankCanvas(cardNum, `chart${cardNum}`);
    } else {
      drawGraph(cardNum, graphData[0], graphData[1]);
    }
  });
}

// Listens for the user clicking a .addCountryButton, reads the country chosen in the select, and calls helpers to add the country to our system
// Called by handleEverything
function handleAddCountry() {
  $("main").on("click", ".addCountryButton", async function (event) {
    event.preventDefault();
    const idOfThis = $(this).attr("id");
    const cardNum = idOfThis[idOfThis.length - 1];
    const targetId = $(`#js-target${cardNum}`);
    const selectValue = targetId.val();
    if (selectValue === "-1") {
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

// Adds a card to the DOM
// Called by handleAddGroup
function addGroup() {
  const color = cardColors[chartCount];
  if (chartCount < 6) {
    $("#groupContainer").append(`
    <div class="group round-corners shadow" style="border-left: ${color} 10px solid;">
    <form id="countryOptions${chartCount}" class="countryOption">
      <select id="js-target${chartCount}" class="countryList shadow">${countryList}</select>
      <button id="addCountryButton${chartCount}" class="addCountryButton shadow">Add Country</button>
    </form>
    <div class="graph-wrapper">
      <canvas id="chart${chartCount}" class="graph shadow"></canvas>
    </div>
    <ul id="watchList${chartCount}" class="watchList">
      <li>List of tracked countries for this graph</li>
    </ul>
    </div>
    `);
    blankCanvas(chartCount, `chart${chartCount}`);
    document.querySelector(`#js-target${chartCount}`).scrollIntoView({
      behavior: "smooth",
    });
    chartCount += 1;
  }
}

// Listens for users to add a group
// Called by handleAddGroup
function handleAddGroup() {
  $("footer").on("click", "#addGroup", (event) => {
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
}

$(handleEverything());
