// "use strict";
const baseURL = "https://corona.lmao.ninja/";

function loadCountryList() {
  let resultsString = "";
  fetch(baseURL + "v2/all")
    .then(function (result) {
      return result.text();
    })
    .then(function (result) {
      resultsString = result;
      console.log(resultsString);
    });
  console.log("list of countries loaded");
}

function handleAddCountry() {
  $("#optionsDiv").on("click", "#addCountry", function (event) {
    event.preventDefault();
    console.log("add country handled");
  });
}

function handleEverything() {
  handleAddCountry();
  loadCountryList();
  console.log("everything handled");
}

$(handleEverything());
