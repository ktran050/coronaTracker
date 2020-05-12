// "use strict";
const baseURL = "https://disease.sh/v2/";
let cachedData = {};
let watchList = {};

const chartOptions = {
  legend: { labels: { fontColor: "black" } },
  title: {
    text: "Corona Virus Cases",
    display: true,
    fontColor: "black",
  },
};

let initLabelsArray = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
];
let initDataArray = [0, 10, 5, 2, 20, 30, 45];

var ctx = document.getElementById("chart").getContext("2d");
var chart = new Chart(ctx, {
  // The type of chart we want to create
  type: "line",

  // The data for our dataset
  data: {
    labels: initLabelsArray,
    datasets: [
      {
        label: "US Cases",
        backgroundColor: "rgb(255, 0, 0)",
        borderColor: "rgb(0, 0, 0)",
        data: initDataArray,
      },
    ],
  },

  // Configuration options go here
  options: chartOptions,
});

function drawCountryList() {
  // called at the start of the script
  let resultHTML = [];
  fetch(baseURL + "countries")
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
        resultHTML += `<option>${interList[i].country}</option>`;
      }
      $("#countriesList").html(resultHTML);
    });
  console.log("list of countries is drawn");
}

function handleAddCountry() {
  // called by handleEverything
  $("#optionsDiv").on("click", "#addCountry", function (event) {
    event.preventDefault();
    let readInput = $("#countriesList").val();
    watchList[readInput] = 1;
    console.log("added country to watchlist");
  });
  console.log("handling add country button");
}

function checkCachedData() {
  for (const property in cachedData) {
    console.log("cachedData key/value: ", property, cachedData[property]);
  }
}

function handleTimeFrame() {
  return $("#timeFrame").val();
}

function updateGraph(timeFrame) {
  let labelsArray = [];
  let datasetsArray = [];
  let firstCacheItem = Object.keys(cachedData)[0];
  if (timeFrame === "-1") {
    for (const property in cachedData[firstCacheItem]) {
      labelsArray.push(property);
    }
  } else {
    labelsArray = Object.keys(cachedData[firstCacheItem]).slice(-timeFrame); // gives the last [timeFrame] number of entries of the dates of cases
  }

  for (let j = 0; j < Object.keys(cachedData).length; ++j) {
    let dataArray = [];
    let currentCacheItem = Object.keys(cachedData)[j];

    if (timeFrame === "-1") {
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
  // let dataArray = [];
  // let labelsArray = [];
  // checkCachedData();
  // let firstCache = Object.keys(cachedData)[0];

  // if (timeFrame === "-1") {
  //   for (const property in cachedData[firstCache]) {
  //     labelsArray.push(property);
  //     dataArray.push(cachedData[firstCache][`${property}`]);
  //   }
  // } else {
  //   labelsArray = Object.keys(cachedData[firstCache]).slice(-timeFrame); // gives the last [timeFrame] number of entries of the dates of cases
  //   labelsArray.forEach(function (element) {
  //     dataArray.push(cachedData[firstCache][`${element}`]);
  //   }); // gives the last [timeFrame] number of entries of # of cases for the corresponding days
  // }

  chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      labels: labelsArray,
      datasets: datasetsArray,
      // datasets: [
      //   {
      //     label: `${firstCache}`,
      //     backgroundColor: "rgb(255, 0, 0)",
      //     borderColor: "rgb(0, 0, 0)",
      //     data: dataArray,
      //   },
      // ],
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
      console.log("got data using fetch");
    });
}

async function updateCache() {
  for (const property in watchList) {
    if (!(property in cachedData)) {
      console.log("calling getData from updateCache function");
      await getData(`${property}`);
    }
  }
  console.log("cache updated");
  return new Promise(function (resolve, reject) {
    resolve("Yes");
  });
}

function handleUpdateGraph() {
  // called by handleEverything
  $("#graphDiv").on("click", "#updateGraph", async function (event) {
    event.preventDefault();
    let timeFrame = handleTimeFrame();
    await updateCache();
    updateGraph(timeFrame);
  });
}

function handleEverything() {
  drawCountryList();
  handleAddCountry();
  handleUpdateGraph();
  console.log("everything handled");
}

$(handleEverything());
