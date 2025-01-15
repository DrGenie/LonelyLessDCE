/**
 * 1) Onload: default to Introduction tab.
 */
window.onload = function() {
  // By default, show the 'introTab' content and mark its button as active
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
  // Remove 'active' class from all tablinks
  const allTablinks = document.getElementsByClassName("tablink");
  for (let j = 0; j < allTablinks.length; j++) {
    allTablinks[j].classList.remove("active");
  }
  // Show the requested tab
  document.getElementById(tabId).style.display = "block";
  element.classList.add("active");

  // If this is the WTP tab, load the WTP data
  if (tabId === 'wtpTab') {
    loadWTPResults();
  }
}

/**
 * 3) WTP data for the WTP Results tab
 */
const wtpData = [
  { attribute: "Community Engagement", coef: 0.527, pval: 0.000, sig: "***", wtp: 15.0 },
  { attribute: "Psychological Counselling", coef: 0.156, pval: 0.245, sig: "", wtp: 4.3 },
  { attribute: "Virtual Reality", coef: -0.349, pval: 0.009, sig: "**", wtp: -9.7 },
  { attribute: "Virtual Only (Method)", coef: -0.426, pval: 0.019, sig: "**", wtp: -11.8 },
  { attribute: "Hybrid (Method)", coef: -0.289, pval: 0.001, sig: "***", wtp: -8.0 },
  { attribute: "Weekly Frequency", coef: 0.617, pval: 0.000, sig: "***", wtp: 17.1 },
  { attribute: "Monthly Frequency", coef: 0.336, pval: 0.005, sig: "**", wtp: 9.3 },
  { attribute: "2-Hour Session", coef: 0.185, pval: 0.059, sig: "", wtp: 5.1 },
  { attribute: "4-Hour Session", coef: 0.213, pval: 0.037, sig: "*", wtp: 5.9 },
  { attribute: "Local Area (12km)", coef: 0.059, pval: 0.712, sig: "", wtp: 1.6 },
  { attribute: "Wider Community (50+km)", coef: -0.509, pval: 0.000, sig: "***", wtp: -14.1 }
];

/**
 * 4) Load WTP results into table if user clicks "WTP Results" tab
 */
function loadWTPResults() {
  const wtpBody = document.getElementById("wtpBody");
  wtpBody.innerHTML = "";
  wtpData.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.attribute}</td>
      <td>${item.coef.toFixed(3)}</td>
      <td>${item.pval.toFixed(3)}</td>
      <td>${item.sig}</td>
      <td>${item.wtp.toFixed(1)}</td>
    `;
    wtpBody.appendChild(row);
  });
}

/**
 * 5) Range slider cost label
 */
function updateCostDisplay(val) {
  document.getElementById("costLabel").textContent = val;
}

/**
 * 6) DCE Calculations & Coefficients
 *    (Truncated for brevity; you can add full finalCoefficients & costOfLivingMultipliers if needed)
 */
const finalCoefficients = {
  // For demonstration, these are partial or sample
  main: {
    ASC_mean: -0.112,
    ASC_optout: 0.131,
    type_comm: 0.527,
    type_psych: 0.156,
    type_vr: -0.349,
    mode_virtual: -0.426,
    mode_hybrid: -0.289,
    freq_weekly: 0.617,
    freq_monthly: 0.336,
    dur_2hrs: 0.185,
    dur_4hrs: 0.213,
    dist_local: 0.059,
    dist_signif: -0.509,
    cost_cont: -0.036
  }
};

const costOfLivingMultipliers = {
  NSW: 1.10,
  VIC: 1.05,
  QLD: 1.00
  // etc.
};

/**
 * 7) Build scenario & open single scenario results
 */
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
    alert("Please select a state if adjusting costs for living.");
    return null;
  }

  return {
    name: "SingleScenario",
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

function openSingleScenario() {
  const sc = buildScenarioFromInputs();
  if (!sc) return;
  openResultsWindow([sc], "Single Scenario Results");
}

/**
 * 8) Scenario saving + comparison
 */
let scenarioList = [];
function saveScenario() {
  const sc = buildScenarioFromInputs();
  if (!sc) return;
  sc.name = "Scenario " + (scenarioList.length + 1);
  scenarioList.push(sc);
  updateScenarioTable();
  alert("Scenario saved!");
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
function openComparison() {
  if (scenarioList.length === 0) {
    alert("No saved scenarios to compare.");
    return;
  }
  openResultsWindow(scenarioList, "Compare Multiple Scenarios");
}

/**
 * 9) openResultsWindow (stub logic for PDF/charts)
 */
function openResultsWindow(scenarios, windowTitle) {
  const w = window.open("", "_blank", "width=1200,height=800,resizable,scrollbars");
  if (!w) {
    alert("Please allow popups for the new window to open.");
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
      <p>This window would show probabilities, charts, PDF download, etc.</p>
    </body>
    </html>
  `);
  w.document.close();
}
