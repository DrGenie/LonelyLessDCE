/**
 * 1) On page load: default to Introduction tab.
 */
window.onload = function() {
  openTab('introTab', document.querySelector('.tablink'));
};

/**
 * 2) Tab switching function
 */
function openTab(tabId, element) {
  // Hide all tabcontent
  const allTabs = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < allTabs.length; i++) {
    allTabs[i].style.display = "none";
  }
  // Remove 'active' from all tablinks
  const allTablinks = document.getElementsByClassName("tablink");
  for (let j = 0; j < allTablinks.length; j++) {
    allTablinks[j].classList.remove("active");
  }
  // Show requested tab
  document.getElementById(tabId).style.display = "block";
  element.classList.add("active");

  // If WTP tab, load WTP data
  if (tabId === 'wtpTab') {
    loadWTPResults();
  }
}

/**
 * 3) Range slider cost label
 */
function updateCostDisplay(val) {
  document.getElementById("costLabel").textContent = val;
}

/**
 * 4) WTP data for main model and categories
 *    This data is for demonstration but can be replaced with real results.
 */
const wtpDataMain = [
  { attribute: "Community Engagement", coef: 0.527, pVal: 0.000, sig: "***", wtp: 15.0 },
  { attribute: "Psychological Counselling", coef: 0.156, pVal: 0.245, sig: "", wtp: 4.3 },
  { attribute: "Virtual Reality", coef: -0.349, pVal: 0.009, sig: "**", wtp: -9.7 },
  // ... add more attributes as needed
];

const wtpDataNotLonely = [
  { attribute: "Community Engagement", coef: 0.369, pVal: 0.064, sig: "", wtp: 10.4 },
  { attribute: "Psychological Counselling", coef: -0.019, pVal: 0.940, sig: "", wtp: -0.5 },
  { attribute: "Virtual Reality", coef: -0.375, pVal: 0.082, sig: "", wtp: -10.0 },
  // ... add more
];

const wtpDataModLonely = [
  { attribute: "Community Engagement", coef: 0.532, pVal: 0.008, sig: "**", wtp: 14.7 },
  { attribute: "Psychological Counselling", coef: 0.178, pVal: 0.406, sig: "", wtp: 4.9 },
  { attribute: "Virtual Reality", coef: -0.204, pVal: 0.352, sig: "", wtp: -5.6 },
  // ... add more
];

const wtpDataSevLonely = [
  { attribute: "Community Engagement", coef: 0.734, pVal: 0.000, sig: "***", wtp: 20.3 },
  { attribute: "Psychological Counselling", coef: 0.317, pVal: 0.154, sig: "", wtp: 8.8 },
  { attribute: "Virtual Reality", coef: -0.567, pVal: 0.036, sig: "*", wtp: -15.7 },
  // ... add more
];

/**
 * 5) Load WTP data into the tables on WTP tab
 */
function loadWTPResults() {
  // Main
  populateWtpTable(wtpDataMain, "wtpBodyMain");
  // Not Lonely
  populateWtpTable(wtpDataNotLonely, "wtpBodyNotLonely");
  // Moderately Lonely
  populateWtpTable(wtpDataModLonely, "wtpBodyModLonely");
  // Severely Lonely
  populateWtpTable(wtpDataSevLonely, "wtpBodySevLonely");
}

function populateWtpTable(dataArray, tableBodyId) {
  const tBody = document.getElementById(tableBodyId);
  tBody.innerHTML = "";
  dataArray.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.attribute}</td>
      <td>${item.coef.toFixed(3)}</td>
      <td>${item.pVal.toFixed(3)}</td>
      <td>${item.sig}</td>
      <td>${item.wtp.toFixed(1)}</td>
    `;
    tBody.appendChild(row);
  });
}

/**
 * 6) DCE model data placeholders (abbreviated or partial)
 */
const finalCoefficients = {
  main: {
    ASC_mean: -0.112,
    ASC_optout: 0.131,
    type_comm: 0.527,
    // ... etc. (expand as needed)
  },
  // ... other categories if needed
};

const costOfLivingMultipliers = {
  NSW: 1.10,
  VIC: 1.05,
  QLD: 1.00,
  // etc.
};

/**
 * 7) Building and saving scenarios
 */
let scenarioList = [];

function buildScenarioFromInputs() {
  const state = document.getElementById("state_select").value;
  const adjustCosts = document.getElementById("adjustCosts").value;
  const cost_val = parseInt(document.getElementById("costSlider").value, 10);

  const localCheck = document.getElementById("localCheck").checked;
  const widerCheck = document.getElementById("widerCheck").checked;
  const weeklyCheck = document.getElementById("weeklyCheck").checked;
  const monthlyCheck = document.getElementById("monthlyCheck").checked;
  const virtualCheck = document.getElementById("virtualCheck").checked;
  const hybridCheck = document.getElementById("hybridCheck").checked;
  const twoHCheck = document.getElementById("twoHCheck").checked;
  const fourHCheck = document.getElementById("fourHCheck").checked;
  const commCheck = document.getElementById("commCheck").checked;
  const psychCheck = document.getElementById("psychCheck").checked;
  const vrCheck = document.getElementById("vrCheck").checked;

  // Basic constraints
  if (localCheck && widerCheck) {
    alert("Cannot select both Local Area and Wider Community.");
    return null;
  }
  if (weeklyCheck && monthlyCheck) {
    alert("Cannot select both Weekly and Monthly.");
    return null;
  }
  if (twoHCheck && fourHCheck) {
    alert("Cannot select both 2-Hour and 4-Hour.");
    return null;
  }
  if (adjustCosts === "yes" && !state) {
    alert("Please select a state if adjusting costs.");
    return null;
  }

  return {
    name: "Scenario " + (scenarioList.length + 1),
    state,
    adjustCosts,
    cost_val,
    localCheck,
    widerCheck,
    weeklyCheck,
    monthlyCheck,
    virtualCheck,
    hybridCheck,
    twoHCheck,
    fourHCheck,
    commCheck,
    psychCheck,
    vrCheck
  };
}

function saveScenario() {
  const sc = buildScenarioFromInputs();
  if (!sc) return;
  scenarioList.push(sc);
  updateScenarioTable();
  alert("Scenario saved successfully!");
}

function updateScenarioTable() {
  const tb = document.querySelector("#scenarioTable tbody");
  tb.innerHTML = "";
  scenarioList.forEach(sc => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${sc.name}</td>
      <td>${sc.state || "-"}</td>
      <td>${sc.adjustCosts}</td>
      <td>${sc.cost_val}</td>
      <td>${sc.localCheck ? "Yes" : "No"}</td>
      <td>${sc.widerCheck ? "Yes" : "No"}</td>
      <td>${sc.weeklyCheck ? "Yes" : "No"}</td>
      <td>${sc.monthlyCheck ? "Yes" : "No"}</td>
      <td>${sc.virtualCheck ? "Yes" : "No"}</td>
      <td>${sc.hybridCheck ? "Yes" : "No"}</td>
      <td>${sc.twoHCheck ? "Yes" : "No"}</td>
      <td>${sc.fourHCheck ? "Yes" : "No"}</td>
      <td>${sc.commCheck ? "Yes" : "No"}</td>
      <td>${sc.psychCheck ? "Yes" : "No"}</td>
      <td>${sc.vrCheck ? "Yes" : "No"}</td>
    `;
    tb.appendChild(row);
  });
}

/**
 * 8) Single scenario results
 */
function openSingleScenario() {
  const sc = buildScenarioFromInputs();
  if (!sc) return;
  openResultsWindow([sc], "Single Scenario Results");
}

/**
 * 9) Compare multiple scenarios
 */
function openComparison() {
  if (scenarioList.length === 0) {
    alert("No scenarios to compare.");
    return;
  }
  openResultsWindow(scenarioList, "Compare Multiple Scenarios");
}

/**
 * 10) openResultsWindow (charts, PDF, etc. can be expanded)
 */
function openResultsWindow(scenarios, windowTitle) {
  const w = window.open("", "_blank", "width=1200,height=800,resizable,scrollbars");
  if (!w) {
    alert("Please allow popups in your browser for results window.");
    return;
  }
  // Minimal demonstration
  w.document.write(`
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>${windowTitle}</title>
    </head>
    <body>
      <h1>${windowTitle}</h1>
      <p>This window would show the calculated probabilities, cost-benefit details, PDF charts, etc.</p>
    </body>
    </html>
  `);
  w.document.close();
}

/**
 * 11) SUGGESTIONS FOR TOOL IMPROVEMENT
 *  - Integrate real DCE coefficients for each loneliness category.
 *  - Provide advanced charting for cost-benefit analyses.
 *  - Export scenario tables and charts into a combined PDF report.
 *  - Allow multiple discrete cost-of-living multipliers for sub-regions.
 *  - Expand WTP data to reflect updated research or participant segments.
 */
