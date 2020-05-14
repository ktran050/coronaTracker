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

async function getData(countryName) {
  await fetch(decodeURI(baseURL + `historical/${countryName}`))
    .then(function (result) {
      if (!result.ok) {
        console.log("Server may be downed or country data not found.");
      } else {
        return result.text();
      }
    })
    .then(function (result) {
      let interList = JSON.parse(result);
      cachedData[`${interList.country}`] = interList.timeline.cases;
      checkCachedData();
      console.log("got data using fetch");
    });
}

async function updateCache() {
  let countriesNotCached = findMissingKeys(masterWatchList, cachedData);
  for (let i = 0; i < countriesNotCached.length; ++i) {
    await getData(countriesNotCached[i]);
  }
  // countriesNotCached.forEach(async function (country) {
  //   await getData(country);
  //   console.log("cache updated");
  // }
  // );
}

function handleTimeFrame() {
  $("main").on("click", "#timeFrame", function (event) {
    event.preventDefault();
    let selectValue = $(this).val();
    // since we only have <= 6 graphs the last char for each element in the card is the id of the overall card, all elements have ids ending with this number
    if (selectValue === "-1") {
      // the first option in the select has value "-1" and is a non-option
      return;
    }
    timeFrame = selectValue;
    console.log("timeFrame set: ", timeFrame);
  });
}

function checkTimeFrame() {
  return timeFrame;
}

function updateGraph(timeFrame, chartNum) {
  let labelsArray = [];
  let datasetsArray = [];
  let firstCacheItem = Object.keys(cachedData)[0];
  if (timeFrame === "0") {
    console.log("here");
    checkCachedData();
    console.log("here");
    for (const property in cachedData[firstCacheItem]) {
      labelsArray.push(property);
      console.log("here");
    }
  } else {
    console.log("timeFrame: ", timeFrame);
    labelsArray = Object.keys(cachedData[firstCacheItem]).slice(-timeFrame); // gives the last [timeFrame] number of entries of the dates of cases
  }

  for (let j = 0; j < Object.keys(cachedData).length; ++j) {
    let dataArray = [];
    let currentCacheItem = Object.keys(cachedData)[j];

    if (timeFrame === "0") {
      for (const property in cachedData[currentCacheItem]) {
        dataArray.push(cachedData[currentCacheItem][`${property}`]);
      }
    } else {
      labelsArray.forEach(function (element) {
        dataArray.push(cachedData[currentCacheItem][`${element}`]);
      }); // gives the last [timeFrame] number of entries of # of cases for the corresponding days
    }
    console.log("pushing to datasetsArray");
    datasetsArray.push({
      label: `${currentCacheItem}`,
      backgroundColor: `rgb(${255 - j * 70}, ${0 + j * 70}, ${0 + j * 70})`,
      borderColor: "rgb(0, 0, 0)",
      data: dataArray,
    });
  }

  let ctx = document.getElementById(`chart${chartNum}`).getContext("2d");

  let chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      labels: labelsArray,
      datasets: datasetsArray,
    },

    // Configuration options go here
    options: chartOptions,
  });
  console.log("labels array: ", labelsArray);
  datasetsArray.forEach(function (item) {
    console.log("datasetsArrayItem: ", item);
  });
  console.log("graph updated");
}
async function handleUpdateGraph(chartNum) {
  // called by handleEverything
  let timeFrame = checkTimeFrame();
  await updateCache();
  updateGraph(timeFrame, chartNum);
}

function handleAddCountry() {
  // called by handleEverything
  $("main").on("click", ".countryList", function (event) {
    event.preventDefault();
    let selectValue = $(this).val();
    let idOfThis = $(this).attr("id");
    let cardNum = idOfThis[idOfThis.length - 1];
    // since we only have <= 6 graphs the last char for each element in the card is the id of the overall card, all elements have ids ending with this number
    if (selectValue === "-1") {
      // the first option in the select has value "-1" and is a non-option
      return;
    }
    if (!(watchList[idOfThis] instanceof Object)) {
      // if the watchlist for the current card doesn't exist create it
      watchList[idOfThis] = new Object({});
    }
    watchList[idOfThis][`${selectValue}`] = 1;
    masterWatchList[selectValue] = 1;
    handleUpdateGraph(cardNum);
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
    <div id="countryOptions${chartCount}">
      <select id="countryList${chartCount}" class="countryList">${countryList}</select>
    </div>
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
  $("main").on("click", "#addGroup", function (event) {
    event.preventDefault();
    addGroup();
  });
}

async function handleEverything() {
  handleTimeFrame();
  await getCountryList();
  handleAddCountry();
  handleAddGroup();
  addGroup();
  console.log("everything handled");
}

$(handleEverything());
