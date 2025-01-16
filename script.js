/****************************************************************************
 * SCRIPT.JS
 * 1) Tab switching
 * 2) Range slider label updates
 * 3) Main DCE coefficients & cost-of-living multipliers
 * 4) Single WTP data with error bars (p-values, SE)
 * 5) Program Uptake Probability bar chart
 * 6) Scenario saving & multi-window PDF
 * 7) Realistic cost & QALY-based benefit logic
 * Author: Mesfin Genie, Newcastle Business School, The University of Newcastle, Australia
 ****************************************************************************/

/** On page load, default to introduction tab */
window.onload = function() {
  openTab('introTab', document.querySelector('.tablink'));
};

/** Tab switching function */
function openTab(tabId, btn) {
  const allTabs = document.getElementsByClassName("tabcontent");
  for (let i=0; i<allTabs.length; i++){
    allTabs[i].style.display = "none";
  }
  const allBtns = document.getElementsByClassName("tablink");
  for (let j=0; j<allBtns.length; j++){
    allBtns[j].classList.remove("active");
  }
  document.getElementById(tabId).style.display = "block";
  btn.classList.add("active");

  // Render charts if navigating to respective tabs
  if (tabId === 'wtpTab') {
    renderWTPChart();
  }
  if (tabId === 'probTab') {
    // Do nothing, user has to click the button
  }
  if (tabId === 'costsTab') {
    renderCostsBenefits();
  }
}

/** Range slider label updates */
function updateCostDisplay(val) {
  document.getElementById("costLabel").textContent = val;
}

/***************************************************************************
 * MAIN DCE COEFFICIENTS
 ***************************************************************************/
const mainCoefficients = {
  ASC_mean: -0.112,
  ASC_sd: 1.161,
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
  dist_local: 0.059,   // e.g., local accessibility
  dist_signif: -0.509, // e.g., wider community
  cost_cont: -0.036    // cost coefficient
};

/***************************************************************************
 * COST-OF-LIVING MULTIPLIERS
 ***************************************************************************/
const costOfLivingMultipliers = {
  NSW: 1.10,
  VIC: 1.05,
  QLD: 1.00,
  WA: 1.08,
  SA: 1.02,
  TAS: 1.03,
  ACT: 1.15,
  NT: 1.07
};

/***************************************************************************
 * BUILD SCENARIO FROM INPUTS
 ***************************************************************************/
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

  // Basic validations
  if (localCheck && widerCheck) {
    alert("Cannot select both Local Area and Wider Community in one scenario.");
    return null;
  }
  if (weeklyCheck && monthlyCheck) {
    alert("Cannot select both Weekly and Monthly simultaneously.");
    return null;
  }
  if (twoHCheck && fourHCheck) {
    alert("Cannot select both 2-Hour and 4-Hour simultaneously.");
    return null;
  }
  if (adjustCosts === 'yes' && !state) {
    alert("Please select a state if adjusting cost-of-living.");
    return null;
  }

  return {
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

/***************************************************************************
 * COMPUTE PROGRAMME UPTAKE PROBABILITY
 ***************************************************************************/
function computeProbability(sc, coefs) {
  let finalCost = sc.cost_val;
  if (sc.adjustCosts === 'yes' && sc.state && costOfLivingMultipliers[sc.state]) {
    finalCost *= costOfLivingMultipliers[sc.state];
  }

  const dist_local = sc.localCheck ? 1 : 0;
  const dist_signif = sc.widerCheck ? 1 : 0;
  const freq_weekly = sc.weeklyCheck ? 1 : 0;
  const freq_monthly = sc.monthlyCheck ? 1 : 0;
  const mode_virtual = sc.virtualCheck ? 1 : 0;
  const mode_hybrid = sc.hybridCheck ? 1 : 0;
  const dur_2hrs = sc.twoHCheck ? 1 : 0;
  const dur_4hrs = sc.fourHCheck ? 1 : 0;
  const type_comm = sc.commCheck ? 1 : 0;
  const type_psych = sc.psychCheck ? 1 : 0;
  const type_vr = sc.vrCheck ? 1 : 0;

  const U_alt = coefs.ASC_mean
    + coefs.type_comm * type_comm
    + coefs.type_psych * type_psych
    + coefs.type_vr * type_vr
    + coefs.mode_virtual * mode_virtual
    + coefs.mode_hybrid * mode_hybrid
    + coefs.freq_weekly * freq_weekly
    + coefs.freq_monthly * freq_monthly
    + coefs.dur_2hrs * dur_2hrs
    + coefs.dur_4hrs * dur_4hrs
    + coefs.dist_local * dist_local
    + coefs.dist_signif * dist_signif
    + coefs.cost_cont * finalCost;

  const U_optout = coefs.ASC_optout;
  const exp_alt = Math.exp(U_alt);
  const exp_opt = Math.exp(U_optout);
  return exp_alt / (exp_alt + exp_opt);
}

/***************************************************************************
 * RENDER PROGRAM UPTAKE PROBABILITY CHART
 ***************************************************************************/
let probChartInstance = null;
function renderProbChart() {
  const scenario = buildScenarioFromInputs();
  if (!scenario) return;

  const pVal = computeProbability(scenario, mainCoefficients)*100;
  const ctx = document.getElementById("probChartMain").getContext("2d");

  // Destroy old chart if exists
  if (probChartInstance) {
    probChartInstance.destroy();
  }

  probChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["Program Uptake Probability"],
      datasets: [{
        label: 'Programme Uptake (%)',
        data: [pVal],
        backgroundColor: pVal < 30 ? 'rgba(231,76,60,0.6)'
                       : pVal < 70 ? 'rgba(241,196,15,0.6)'
                                   : 'rgba(39,174,96,0.6)',
        borderColor: pVal < 30 ? 'rgba(231,76,60,1)'
                     : pVal < 70 ? 'rgba(241,196,15,1)'
                                 : 'rgba(39,174,96,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          max: 100
        }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Program Uptake Probability = ${pVal.toFixed(2)}%`,
          font: { size: 16 }
        }
      }
    }
  });

  // Provide dynamic suggestions
  let interpretation = "";
  if (pVal < 30) {
    interpretation = "Uptake is relatively low. Consider lowering cost or increasing accessibility/frequency.";
  } else if (pVal < 70) {
    interpretation = "Uptake is moderate. Additional improvements may further boost participation.";
  } else {
    interpretation = "Uptake is high. Maintaining these attributes is recommended.";
  }
  alert(`Predicted probability: ${pVal.toFixed(2)}%. ${interpretation}`);
}

/***************************************************************************
 * WTP CHART WITH ERROR BARS
 ***************************************************************************/
const wtpDataMain = [
  { attribute: "Community engagement", wtp: 14.47, pVal: 0.000, se: 3.31 },
  { attribute: "Psychological counselling", wtp: 4.28, pVal: 0.245, se: 3.76 },
  { attribute: "Virtual reality", wtp: -9.58, pVal: 0.009, se: 3.72 }
];

let wtpChartInstance = null;
function renderWTPChart() {
  const ctx = document.getElementById("wtpChartMain").getContext("2d");

  // Destroy old chart if exists
  if (wtpChartInstance) {
    wtpChartInstance.destroy();
  }

  const labels = wtpDataMain.map(d => d.attribute);
  const data = wtpDataMain.map(d => d.wtp);
  const errorBars = wtpDataMain.map(d => d.se);

  wtpChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Willingness to Pay (A$)',
        data: data,
        backgroundColor: 'rgba(52, 152, 219, 0.6)',
        borderColor: 'rgba(41, 128, 185, 1)',
        borderWidth: 1,
        // Error bars are not natively supported in Chart.js, so use plugins or annotations
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const index = context[0].dataIndex;
              const d = wtpDataMain[index];
              return `SE: ${d.se}, p-value: ${d.pVal}`;
            }
          }
        },
        legend: { display: false },
        title: {
          display: true,
          text: 'Willingness to Pay (A$) for Program Attributes',
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Note: For error bars, consider using a Chart.js plugin like chartjs-plugin-error-bars
  // or use annotations to represent SE.
}

/***************************************************************************
 * SCENARIO SAVING & MULTI-WINDOW PDF
 ***************************************************************************/
// Placeholder functions, implement as needed
function saveScenario() {
  const scenario = buildScenarioFromInputs();
  if (!scenario) return;
  const tableBody = document.querySelector("#scenarioTable tbody");
  const row = document.createElement("tr");

  // Create table cells based on scenario properties
  const properties = [
    "name", "state", "adjustCosts", "cost_val",
    "localCheck", "widerCheck", "weeklyCheck", "monthlyCheck",
    "virtualCheck", "hybridCheck", "twoHCheck", "fourHCheck",
    "commCheck", "psychCheck", "vrCheck"
  ];

  properties.forEach(prop => {
    const cell = document.createElement("td");
    if (prop === "name") {
      cell.textContent = `Scenario ${tableBody.rows.length + 1}`;
    } else if (typeof scenario[prop] === 'boolean') {
      cell.textContent = scenario[prop] ? 'Yes' : 'No';
    } else {
      cell.textContent = scenario[prop];
    }
    row.appendChild(cell);
  });

  tableBody.appendChild(row);
}

function openComparison() {
  // Implement comparison logic or multi-window PDF export
  alert("Comparison feature not yet implemented.");
}

/***************************************************************************
 * REALISTIC COST & QALY-BASED BENEFIT LOGIC
 ***************************************************************************/
const QALY_SCENARIOS = {
  low: 0.02,
  moderate: 0.05,
  high: 0.1
};

const QALY_VALUES = ["low", "moderate", "high"];

const QALY_SELECT_HTML = `
  <label for="qalySelect">Select QALY Gain Scenario:</label>
  <select id="qalySelect">
    <option value="low">Low (0.02 QALYs per participant)</option>
    <option value="moderate" selected>Moderate (0.05 QALYs per participant)</option>
    <option value="high">High (0.1 QALYs per participant)</option>
  </select>
`;

// Inject QALY selection into Costs & Benefits tab
document.addEventListener("DOMContentLoaded", function() {
  const costsTab = document.getElementById("costsTab");
  const qalySelector = document.createElement("div");
  qalySelector.innerHTML = QALY_SELECT_HTML;
  costsTab.insertBefore(qalySelector, costsTab.firstChild);
});

/** Constants for Cost Calculations */
const FIXED_COSTS = {
  advertisement: 8127.60,
  training: 26863.00
};

const VARIABLE_COSTS = {
  delivery: 18000.00,
  participantTimeTravel: 7500.00
};

const TOTAL_FIXED_COST = FIXED_COSTS.advertisement + FIXED_COSTS.training; // 34,990.60
const TOTAL_VARIABLE_COST = VARIABLE_COSTS.delivery + VARIABLE_COSTS.participantTimeTravel; // 25,500.00

const VALUE_PER_QALY = 50000; // A$50,000

/** Render Costs & Benefits */
let costsChartInstance = null;
let benefitsChartInstance = null;

function renderCostsBenefits() {
  const scenario = buildScenarioFromInputs();
  if (!scenario) return;

  // Get Uptake Probability
  const pVal = computeProbability(scenario, mainCoefficients); // between 0 and 1
  const uptakePercentage = pVal * 100;

  // Get QALY Scenario
  const qalyScenario = document.getElementById("qalySelect").value;
  const qalyPerParticipant = QALY_SCENARIOS[qalyScenario];

  // Number of participants (assuming 2,500 as base)
  const baseParticipants = 2500;
  const numberOfParticipants = baseParticipants * pVal;

  // Total QALY Gains
  const totalQALY = numberOfParticipants * qalyPerParticipant;

  // Monetized Benefits
  const monetizedBenefits = totalQALY * VALUE_PER_QALY;

  // Total Intervention Cost
  const totalInterventionCost = TOTAL_FIXED_COST + (TOTAL_VARIABLE_COST * pVal);

  // Cost per Person
  const costPerPerson = totalInterventionCost / numberOfParticipants;

  // Display in Costs & Benefits Tab
  const costsTab = document.getElementById("costsTab");
  
  // Clear previous results if any
  const existingResults = document.getElementById("costsBenefitsResults");
  if (existingResults) {
    existingResults.remove();
  }

  const resultsDiv = document.createElement("div");
  resultsDiv.id = "costsBenefitsResults";
  resultsDiv.innerHTML = `
    <h3>Cost & Benefits Analysis</h3>
    <p><strong>Program Uptake Probability:</strong> ${uptakePercentage.toFixed(2)}%</p>
    <p><strong>Number of Participants:</strong> ${numberOfParticipants.toFixed(0)}</p>
    <p><strong>Total Intervention Cost:</strong> A$${totalInterventionCost.toFixed(2)}</p>
    <p><strong>Cost per Participant:</strong> A$${costPerPerson.toFixed(2)}</p>
    <p><strong>Total QALY Gains:</strong> ${totalQALY.toFixed(2)} QALYs</p>
    <p><strong>Monetized Benefits:</strong> A$${monetizedBenefits.toLocaleString()}</p>
    <p><strong>Net Benefit:</strong> A$${(monetizedBenefits - totalInterventionCost).toLocaleString()}</p>
  `;
  costsTab.appendChild(resultsDiv);

  // Render Cost Chart
  renderCostChart(totalInterventionCost, monetizedBenefits);

  // Render Benefit Chart
  renderBenefitChart(totalQALY, monetizedBenefits);
}

/** Render Cost Chart */
function renderCostChart(cost, benefit) {
  const ctx = document.createElement('canvas');
  ctx.id = "costChart";
  document.getElementById("costsBenefitsResults").appendChild(ctx);

  if (costsChartInstance) {
    costsChartInstance.destroy();
  }

  costsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["Total Intervention Cost"],
      datasets: [{
        label: 'A$',
        data: [cost],
        backgroundColor: 'rgba(231,76,60,0.6)',
        borderColor: 'rgba(192,57,43,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Total Intervention Cost',
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/** Render Benefit Chart */
function renderBenefitChart(totalQALY, monetizedBenefits) {
  const ctx = document.createElement('canvas');
  ctx.id = "benefitChart";
  document.getElementById("costsBenefitsResults").appendChild(ctx);

  if (benefitsChartInstance) {
    benefitsChartInstance.destroy();
  }

  benefitsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ["Monetized QALY Benefits"],
      datasets: [{
        label: 'A$',
        data: [monetizedBenefits],
        backgroundColor: 'rgba(39,174,96,0.6)',
        borderColor: 'rgba(27, 163, 156,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Monetized QALY Benefits',
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/***************************************************************************
 * PROGRAM UPTAKE PROBABILITY AND COSTS & BENEFITS INTEGRATION
 ***************************************************************************/

// Optionally, link "Calculate & View Results" button to trigger calculations
function openSingleScenario() {
  renderProbChart();
  renderCostsBenefits();
}

/***************************************************************************
 * ADDITIONAL FUNCTIONS FOR EXPORTING PDF OR OTHER FEATURES
 ***************************************************************************/

// Implement PDF export if needed using jsPDF
// Placeholder function
function exportToPDF() {
  // Implement using jsPDF or similar library
  alert("PDF export feature not yet implemented.");
}
