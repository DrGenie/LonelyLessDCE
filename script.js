/****************************************************
 * 1) TAB SWITCHING
 ****************************************************/
function openTab(tabId, element) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  const tablinks = document.getElementsByClassName("tablink");
  for (let j = 0; j < tablinks.length; j++) {
    tablinks[j].classList.remove("active");
  }
  document.getElementById(tabId).style.display = "block";
  element.classList.add("active");
}

/****************************************************
 * 2) DCE COEFFICIENTS & COST-OF-LIVING MULTIPLIERS
 *    (As previously defined)
 ****************************************************/
const finalCoefficients = {
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
  },
  notLonely: {
    ASC_mean: -0.149,
    ASC_optout: 0.151,
    type_comm: 0.369,
    type_psych: -0.019,
    type_vr: -0.375,
    mode_virtual: -0.604,
    mode_hybrid: -0.289,
    freq_weekly: 0.759,
    freq_monthly: 0.540,
    dur_2hrs: 0.031,
    dur_4hrs: 0.243,
    dist_local: -0.041,
    dist_signif: -0.814,
    cost_cont: -0.034
  },
  moderatelyLonely: {
    ASC_mean: -0.145,
    ASC_optout: 0.074,
    type_comm: 0.532,
    type_psych: 0.178,
    type_vr: -0.204,
    mode_virtual: -0.320,
    mode_hybrid: -0.402,
    freq_weekly: 0.555,
    freq_monthly: 0.357,
    dur_2hrs: 0.322,
    dur_4hrs: 0.266,
    dist_local: 0.082,
    dist_signif: -0.467,
    cost_cont: -0.042
  },
  severelyLonely: {
    ASC_mean: -0.028,
    ASC_optout: 0.160,
    type_comm: 0.734,
    type_psych: 0.317,
    type_vr: -0.567,
    mode_virtual: -0.353,
    mode_hybrid: -0.151,
    freq_weekly: 0.540,
    freq_monthly: 0.042,
    dur_2hrs: 0.157,
    dur_4hrs: 0.060,
    dist_local: 0.211,
    dist_signif: -0.185,
    cost_cont: -0.033
  }
};

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

// Basic WTP data (example) for the WTP tab
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

/****************************************************
 * 3) BENEFIT / COST ASSUMPTIONS
 ****************************************************/
// Example: 10,000 AUD benefit per 1% uptake
const benefitPerPercent = 10000;

/****************************************************
 * 4) LOAD WTP RESULTS TABLE WHEN WTP TAB IS OPENED
 ****************************************************/
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

/****************************************************
 * 5) COST SLIDER LABEL
 ****************************************************/
function updateCostDisplay(val) {
  document.getElementById("costLabel").textContent = val;
}

/****************************************************
 * 6) SCENARIO MANAGEMENT
 ****************************************************/
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

  if (localCheck && widerCheck) {
    alert("You cannot select both Local Area and Wider Community in one scenario.");
    return null;
  }
  if (weeklyCheck && monthlyCheck) {
    alert("You cannot select both Weekly and Monthly in one scenario.");
    return null;
  }
  if (twoHCheck && fourHCheck) {
    alert("You cannot select both 2-Hour and 4-Hour sessions in one scenario.");
    return null;
  }
  if (adjustCosts === "yes" && !state) {
    alert("Please select a State if you choose to adjust costs for living.");
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
  const scenario = buildScenarioFromInputs();
  if (!scenario) return;
  scenarioList.push(scenario);
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

/****************************************************
 * 7) OPEN SINGLE-SCENARIO WINDOW
 ****************************************************/
function openSingleScenario() {
  const sc = buildScenarioFromInputs();
  if (!sc) return;
  openResultsWindow([sc], "Single Scenario Results");
}

/****************************************************
 * 8) OPEN COMPARISON WINDOW
 ****************************************************/
function openComparison() {
  if (scenarioList.length === 0) {
    alert("No saved scenarios to compare.");
    return;
  }
  openResultsWindow(scenarioList, "Compare Multiple Scenarios");
}

/****************************************************
 * 9) MULTI-WINDOW RESULTS + PDF
 ****************************************************/
function openResultsWindow(scenarios, windowTitle) {
  const w = window.open("", "_blank", "width=1400,height=800,scrollbars,resizable");
  if (!w) {
    alert("Please allow popups for the new window to open.");
    return;
  }

  // Basic HTML
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>${windowTitle}</title>
      <style>
        body {
          margin: 20px;
          font-family: Arial, sans-serif;
          background: #f4f7fa;
        }
        h1, h2 {
          text-align: center; 
          color: #2c3e50;
        }
        .scenario-box {
          background: #fff;
          margin: 20px 0;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 8px;
        }
        th {
          background: #2980b9;
          color: #fff;
        }
        .charts-container {
          display: flex; 
          flex-wrap: wrap; 
          gap: 20px; 
          margin-top: 20px;
        }
        .chart-box {
          width: 300px; 
          height: 300px; 
          background: #f9f9f9;
          border: 1px solid #ccc;
          border-radius: 6px;
          position: relative;
        }
        .buttons-row {
          text-align: center;
          margin: 20px 0;
        }
        button {
          background: #2980b9;
          color: #fff;
          border: none;
          padding: 10px 15px;
          border-radius: 5px;
          cursor: pointer;
          margin: 0 10px;
        }
        button:hover {
          background: #1f6391;
        }
        .loneliness-note {
          background: #fff3db;
          padding: 10px;
          margin: 10px 0;
          border-left: 4px solid #f39c12;
        }
      </style>
    </head>
    <body>
      <h1>${windowTitle}</h1>
      <p class="loneliness-note">
        This report shows main DCE probabilities plus separate analyses by loneliness categories (Not Lonely, Moderately Lonely, Severely Lonely).
      </p>
      <div id="resultsContainer"></div>
      <div class="buttons-row">
        <button onclick="downloadPDF()">Download PDF</button>
      </div>

      <!-- Chart.js & jsPDF in child window -->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

      <script>
        const scenariosData = ${JSON.stringify(scenarios)};
        const finalCoefs = ${JSON.stringify(finalCoefficients)};
        const costMultipliers = ${JSON.stringify(costOfLivingMultipliers)};
        const benefitPerPercent = ${benefitPerPercent};

        window.onload = function() {
          buildScenarioViews();
        };

        function buildScenarioViews() {
          const container = document.getElementById('resultsContainer');
          scenariosData.forEach((sc, idx) => {
            const box = document.createElement('div');
            box.className = 'scenario-box';
            const h2 = document.createElement('h2');
            h2.textContent = sc.name;
            box.appendChild(h2);

            const table = document.createElement('table');
            table.innerHTML = \`
              <thead>
                <tr><th>Attribute</th><th>Value</th></tr>
              </thead>
              <tbody>
                <tr><td>State</td><td>\${sc.state || '-'}</td></tr>
                <tr><td>Adjust Costs?</td><td>\${sc.adjustCosts}</td></tr>
                <tr><td>Base Cost (AUD)</td><td>\${sc.cost_val}</td></tr>
                <tr><td>Local?</td><td>\${sc.localCheck}</td></tr>
                <tr><td>Wider?</td><td>\${sc.widerCheck}</td></tr>
                <tr><td>Weekly?</td><td>\${sc.weeklyCheck}</td></tr>
                <tr><td>Monthly?</td><td>\${sc.monthlyCheck}</td></tr>
                <tr><td>Virtual?</td><td>\${sc.virtualCheck}</td></tr>
                <tr><td>Hybrid?</td><td>\${sc.hybridCheck}</td></tr>
                <tr><td>2-Hour?</td><td>\${sc.twoHCheck}</td></tr>
                <tr><td>4-Hour?</td><td>\${sc.fourHCheck}</td></tr>
                <tr><td>Comm Engagement?</td><td>\${sc.commCheck}</td></tr>
                <tr><td>Psych Counselling?</td><td>\${sc.psychCheck}</td></tr>
                <tr><td>VR?</td><td>\${sc.vrCheck}</td></tr>
              </tbody>
            \`;
            box.appendChild(table);

            // Calculate probabilities
            const pMain = computeProbability(sc, finalCoefs.main);
            const pNot = computeProbability(sc, finalCoefs.notLonely);
            const pMod = computeProbability(sc, finalCoefs.moderatelyLonely);
            const pSev = computeProbability(sc, finalCoefs.severelyLonely);

            // Simple example cost/benefit
            const totalBenefits = pMain * 100 * benefitPerPercent;
            const totalCost = sc.cost_val * 1000; 
            const netB = totalBenefits - totalCost;
            const bcr = totalCost === 0 ? 0 : (totalBenefits / totalCost);

            const infoP = document.createElement('p');
            infoP.innerHTML = \`
              <strong>Main Prob:</strong> \${(pMain*100).toFixed(2)}%<br/>
              <strong>Not Lonely:</strong> \${(pNot*100).toFixed(2)}% |
              <strong>Mod Lonely:</strong> \${(pMod*100).toFixed(2)}% |
              <strong>Sev Lonely:</strong> \${(pSev*100).toFixed(2)}%<br/>
              <strong>Est. Benefits:</strong> \$\${totalBenefits.toFixed(0)} |
              <strong>Est. Cost:</strong> \$\${totalCost.toFixed(0)} |
              <strong>Net Benefit:</strong> \$\${netB.toFixed(0)} |
              <strong>BCR:</strong> \${bcr.toFixed(2)}
            \`;
            box.appendChild(infoP);

            const chartWrap = document.createElement('div');
            chartWrap.className = 'charts-container';
            // 4 doughnut charts
            chartWrap.appendChild(buildChartCanvas("main_" + idx));
            chartWrap.appendChild(buildChartCanvas("not_" + idx));
            chartWrap.appendChild(buildChartCanvas("mod_" + idx));
            chartWrap.appendChild(buildChartCanvas("sev_" + idx));

            box.appendChild(chartWrap);
            container.appendChild(box);

            // After dom append
            initDoughnut("main_" + idx, "Main Probability", pMain);
            initDoughnut("not_" + idx, "Not Lonely", pNot);
            initDoughnut("mod_" + idx, "Moderately Lonely", pMod);
            initDoughnut("sev_" + idx, "Severely Lonely", pSev);
          });
        }

        function buildChartCanvas(id) {
          const div = document.createElement('div');
          div.className = 'chart-box';
          const cnv = document.createElement('canvas');
          cnv.id = id;
          div.appendChild(cnv);
          return div;
        }

        function initDoughnut(canvasId, label, prob) {
          const ctx = document.getElementById(canvasId).getContext('2d');
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ["Uptake Probability", "Remaining"],
              datasets: [{
                data: [prob, 1-prob],
                backgroundColor: pickColour(prob),
                borderColor: "#fff",
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "bottom" },
                title: {
                  display: true,
                  text: label + " (" + (prob*100).toFixed(2) + "%)"
                }
              }
            }
          });
        }

        function pickColour(p) {
          if (p < 0.3) return ["rgba(231,76,60,0.7)","rgba(236,240,241,0.3)"];
          if (p < 0.7) return ["rgba(241,196,15,0.7)","rgba(236,240,241,0.3)"];
          return ["rgba(39,174,96,0.7)","rgba(236,240,241,0.3)"];
        }

        function computeProbability(sc, coefs) {
          let finalCost = sc.cost_val;
          if (sc.adjustCosts === "yes" && sc.state && costMultipliers[sc.state]) {
            finalCost = sc.cost_val * costMultipliers[sc.state];
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

          const exp_alt = Math.exp(U_alt);
          const exp_opt = Math.exp(coefs.ASC_optout);
          return exp_alt / (exp_alt + exp_opt);
        }

        function downloadPDF() {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF('p','pt','a4');
          pdf.setFontSize(14);
          pdf.text("${windowTitle}", 40, 40);
          let yOff = 60;

          const scenarioDivs = document.getElementsByClassName("scenario-box");
          for (let i=0; i<scenarioDivs.length; i++) {
            if (i>0) pdf.addPage();
            yOff = 40;
            pdf.text(scenariosData[i].name, 40, yOff);
            yOff += 15;

            // Grab chart canvases
            const mainCanvas = document.getElementById("main_" + i);
            if (mainCanvas) {
              const mainImg = mainCanvas.toDataURL("image/png");
              pdf.addImage(mainImg, "PNG", 40, yOff, 180, 180);
            }
            const notCanvas = document.getElementById("not_" + i);
            if (notCanvas) {
              const notImg = notCanvas.toDataURL("image/png");
              pdf.addImage(notImg, "PNG", 240, yOff, 180, 180);
            }
            yOff += 200;
            const modCanvas = document.getElementById("mod_" + i);
            if (modCanvas) {
              const modImg = modCanvas.toDataURL("image/png");
              pdf.addImage(modImg, "PNG", 40, yOff, 180, 180);
            }
            const sevCanvas = document.getElementById("sev_" + i);
            if (sevCanvas) {
              const sevImg = sevCanvas.toDataURL("image/png");
              pdf.addImage(sevImg, "PNG", 240, yOff, 180, 180);
            }
            yOff += 220;
          }

          pdf.save("LonelyLessAustralia_Results.pdf");
        }
      </script>
    </body>
    </html>
  `);

  w.document.close();
}
