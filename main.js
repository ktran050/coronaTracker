// "use strict";
const baseURL = "https://disease.sh/";
let cachedData = {};
let watchList = {};

function drawCountryList() {
  // called at the start of the script
  let interList = [];
  let resultHTML = [];
  fetch(baseURL + "v2/countries")
    .then(function (result) {
      return result.text();
    })
    .then(function (result) {
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

function updateGraph() {
  console.log("graph updated");
}

function getData(countryName) {
  cachedData[`${countryName}`] = 1;
  console.log("data grabbed for:", countryName);
}
function updateCache() {
  for (const property in watchList) {
    if (!(property in cachedData)) {
      getData(`${property}`);
    }
  }
  console.log("cache updated");
}

function handleUpdateGraph() {
  // called by handleEverything
  $("#graphDiv").on("click", "#updateGraph", function (event) {
    event.preventDefault();
    updateCache();
    updateGraph();
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
