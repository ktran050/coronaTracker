// "use strict";
const baseURL = "https://disease.sh/";

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
    console.log("country to add: ", readInput);
  });
}

function handleEverything() {
  handleAddCountry();
  drawCountryList();
  console.log("everything handled");
}

$(handleEverything());
