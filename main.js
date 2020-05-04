// "use strict";
const baseURL = "https://disease.sh/v2/";
let cachedData = {};
let watchList = {};
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
        label: "Historical Graph of Corona Virus Cases: United States",
        backgroundColor: "rgb(255, 99, 132)",
        borderColor: "rgb(255, 99, 132)",
        data: initDataArray,
      },
    ],
  },

  // Configuration options go here
  options: {},
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
  console.log("list of countries added");
}

function handleAddCountry() {
  // called by handleEverything
  $("#optionsDiv").on("click", "#addCountry", function (event) {
    event.preventDefault();
    let readInput = $("#countriesList").val();
    watchList[readInput] = 1;
    console.log("country to add: ", readInput);
    console.log("watchList: ", watchList);
  });
}

function checkCachedData() {
  for (const property in cachedData) {
    console.log("cachedData key/value: ", property, cachedData[property]);
  }
}

function updateGraph() {
  let dataArray = [];
  let labelsArray = [];
  checkCachedData();
  let firstCache = Object.keys(cachedData)[0];
  console.log("firstCache: ", firstCache);
  console.log("cachedData[afg]: ", cachedData[firstCache]);

  for (const property in cachedData[firstCache]) {
    console.log("property: ", property);
    labelsArray.push(property);
    dataArray.push(firstCache[property]);
  }

  console.log("dataArray: ", dataArray);
  console.log("labelsArray: ", labelsArray);

  chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      labels: labelsArray,
      datasets: [
        {
          label: "Historical Graph of Corona Virus Cases: United States",
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          data: dataArray,
        },
      ],
    },

    // Configuration options go here
    options: {},
  });
}

function getData(countryName) {
  fetch(decodeURI(baseURL + `historical/${countryName}`))
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
    });
}

function updateCache() {
  for (const property in watchList) {
    if (!(property in cachedData)) {
      getData(`${property}`);
    }
  }

  return new Promise(function (resolve, reject) {
    resolve("test");
    console.log("cache updated");
  });
}

function handleUpdateGraph() {
  // called by handleEverything
  $("#graphDiv").on("click", "#updateGraph", function (event) {
    event.preventDefault();
    updateCache().then(function (result) {
      updateGraph();
    });
    // updateGraph();
    console.log("update graph handled");
  });
}

function handleEverything() {
  handleAddCountry();
  drawCountryList();
  handleUpdateGraph();
  console.log("everything handled");
}

$(handleEverything());
