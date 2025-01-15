/* script.js */

// Model Coefficients - Final DCE Study Results
const coefficients = {
    // Overall Model
    overall: {
        ASC_alt1: -0.112,
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
    // Loneliness Categories
    categories: {
        not_lonely: {
            ASC_alt1: -0.149,
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
        moderately_lonely: {
            ASC_alt1: -0.145,
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
        severely_lonely: {
            ASC_alt1: -0.028,
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
    }
};

// Cost Data for Each Program Attribute
const costData = {
    type_comm: {
        personnel: 20000,
        materials: 2000,
        technology: 3000,
        facility: 5000,
        marketing: 5000,
        training: 1000,
        miscellaneous: 1000
    },
    type_psych: {
        personnel: 25000,
        materials: 1500,
        technology: 2000,
        facility: 4000,
        marketing: 4000,
        training: 800,
        miscellaneous: 1200
    },
    type_vr: {
        personnel: 18000,
        materials: 1000,
        technology: 5000,
        facility: 3000,
        marketing: 3000,
        training: 700,
        miscellaneous: 800
    },
    mode_virtual: {
        personnel: 5000,
        materials: 500,
        technology: 4000,
        facility: 0,
        marketing: 1000,
        training: 300,
        miscellaneous: 500
    },
    mode_hybrid: {
        personnel: 7000,
        materials: 800,
        technology: 4500,
        facility: 2000,
        marketing: 1200,
        training: 400,
        miscellaneous: 600
    },
    freq_weekly: {
        personnel: 10000,
        materials: 1200,
        technology: 1500,
        facility: 3000,
        marketing: 1500,
        training: 500,
        miscellaneous: 700
    },
    freq_monthly: {
        personnel: 8000,
        materials: 1000,
        technology: 1200,
        facility: 2500,
        marketing: 1300,
        training: 400,
        miscellaneous: 600
    },
    dur_2hrs: {
        personnel: 3000,
        materials: 500,
        technology: 800,
        facility: 1000,
        marketing: 700,
        training: 200,
        miscellaneous: 300
    },
    dur_4hrs: {
        personnel: 4000,
        materials: 700,
        technology: 1000,
        facility: 1500,
        marketing: 900,
        training: 300,
        miscellaneous: 400
    },
    cost_cont: {
        personnel: 0, // Assuming cost continuum is a scaling factor
        materials: 0,
        technology: 0,
        facility: 0,
        marketing: 0,
        training: 0,
        miscellaneous: 0
    },
    dist_local: {
        personnel: 5000,
        materials: 800,
        technology: 1000,
        facility: 2000,
        marketing: 1000,
        training: 300,
        miscellaneous: 500
    },
    dist_signif: {
        personnel: 6000,
        materials: 900,
        technology: 1100,
        facility: 2200,
        marketing: 1100,
        training: 350,
        miscellaneous: 550
    },
    // Add more attributes as needed
};

// Benefit Parameters
const benefitPerPercent = 10000; // $10,000 AUD per 1% uptake probability

// Cost-of-Living Multipliers by State
const costOfLivingMultipliers = {
    NSW: 1.10, // New South Wales
    VIC: 1.05, // Victoria
    QLD: 1.00, // Queensland
    WA: 1.08,  // Western Australia
    SA: 1.02,  // South Australia
    TAS: 1.03, // Tasmania
    ACT: 1.15, // Australian Capital Territory
    NT: 1.07   // Northern Territory
};

// Initialize Chart.js with Doughnut Chart for Uptake Probability
let ctx = document.getElementById('probabilityChart').getContext('2d');
let probabilityChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Uptake Probability', 'Remaining'],
        datasets: [{
            data: [0, 1],
            backgroundColor: ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)'], // Green and Light Gray
            borderColor: ['rgba(39, 174, 96, 1)', 'rgba(236, 240, 241, 1)'],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        size: 14
                    },
                    color: '#34495e'
                }
            },
            title: {
                display: true,
                text: 'Predicted Probability of Program Uptake',
                font: {
                    size: 18
                },
                color: '#2c3e50'
            }
        }
    }
});

// Initialize Chart.js with Bar Chart for Cost-Benefit Analysis
let cbaCtx = document.getElementById('cbaChart').getContext('2d');
let cbaChart = new Chart(cbaCtx, {
    type: 'bar',
    data: {
        labels: ['Total Costs', 'Total Benefits'],
        datasets: [{
            label: 'Amount (AUD)',
            data: [0, 0],
            backgroundColor: [
                'rgba(231, 76, 60, 0.6)', // Red for Costs
                'rgba(39, 174, 96, 0.6)'   // Green for Benefits
            ],
            borderColor: [
                'rgba(231, 76, 60, 1)',
                'rgba(39, 174, 96, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Cost-Benefit Analysis',
                font: {
                    size: 18
                },
                color: '#2c3e50'
            }
        }
    }
});

// Function to calculate predicted probability and update the charts and tables
function calculateProbability() {
    // Get values from the form
    const category = document.getElementById('loneliness_category').value;
    const state = document.getElementById('state_select').value;
    const adjustCosts = document.getElementById('adjust_costs').value;
    const cost_cont = parseFloat(document.getElementById('cost_cont').value);
    const dist_signif = parseFloat(document.getElementById('dist_signif').value);
    const dist_local = parseFloat(document.getElementById('dist_local').value);
    const freq_monthly = parseFloat(document.getElementById('freq_monthly').value);
    const freq_weekly = parseFloat(document.getElementById('freq_weekly').value);
    const mode_virtual = parseFloat(document.getElementById('mode_virtual').value);
    const mode_hybrid = parseFloat(document.getElementById('mode_hybrid').value);
    const dur_2hrs = parseFloat(document.getElementById('dur_2hrs').value);
    const dur_4hrs = parseFloat(document.getElementById('dur_4hrs').value);
    const type_comm = parseFloat(document.getElementById('type_comm').value);
    const type_psych = parseFloat(document.getElementById('type_psych').value);
    const type_vr = parseFloat(document.getElementById('type_vr').value);

    // Validate selections
    if (!category) {
        alert("Please select a loneliness category.");
        return;
    }

    // Validate that only one duration is selected
    if (dur_2hrs === 1 && dur_4hrs === 1) {
        alert("Please select only one duration: either 2 Hours or 4 Hours.");
        return;
    }

    // Validate that only one frequency is selected
    if (freq_monthly === 1 && freq_weekly === 1) {
        alert("Please select only one frequency: either Monthly or Weekly.");
        return;
    }

    // Validate that only one accessibility option is selected
    if (dist_local === 1 && dist_signif === 1) {
        alert("Please select only one accessibility option: either Local Area Accessibility or Low Accessibility.");
        return;
    }

    // Validate that if 'Adjust Costs for Living Expenses' is 'Yes', a state is selected
    if (adjustCosts === 'yes' && !state) {
        alert("Please select a state if you choose to adjust costs for living expenses.");
        return;
    }

    // Select the appropriate coefficients based on category
    let selectedCoefficients = coefficients.overall; // Default to overall

    if (category in coefficients.categories) {
        selectedCoefficients = coefficients.categories[category];
    } else {
        alert("Selected loneliness category is invalid.");
        return;
    }

    // Calculate U_alt1 with Cost-of-Living Adjustment
    let adjusted_cost_cont = cost_cont; // Initialize adjusted cost_cont

    if (adjustCosts === 'yes' && state && costOfLivingMultipliers[state]) {
        adjusted_cost_cont = cost_cont * costOfLivingMultipliers[state];
    }

    let U_alt1 = selectedCoefficients.ASC_alt1 +
                selectedCoefficients.type_comm * type_comm +
                selectedCoefficients.type_psych * type_psych +
                selectedCoefficients.type_vr * type_vr +
                selectedCoefficients.mode_virtual * mode_virtual +
                selectedCoefficients.mode_hybrid * mode_hybrid +
                selectedCoefficients.freq_weekly * freq_weekly +
                selectedCoefficients.freq_monthly * freq_monthly +
                selectedCoefficients.dur_2hrs * dur_2hrs +
                selectedCoefficients.dur_4hrs * dur_4hrs +
                selectedCoefficients.dist_local * dist_local +
                selectedCoefficients.dist_signif * dist_signif +
                selectedCoefficients.cost_cont * adjusted_cost_cont;

    // Calculate U_optout
    const U_optout = selectedCoefficients.ASC_optout;

    // Calculate P_alt1 using the logistic function
    const exp_U_alt1 = Math.exp(U_alt1);
    const exp_U_optout = Math.exp(U_optout);
    const P_alt1 = exp_U_alt1 / (exp_U_alt1 + exp_U_optout);

    // Ensure P_alt1 is between 0 and 1
    const P_final = Math.min(Math.max(P_alt1, 0), 1);

    // Display the result with percentage formatting
    document.getElementById('probability').innerText = (P_final * 100).toFixed(2) + '%';

    // Update the Uptake Probability chart
    probabilityChart.data.datasets[0].data = [P_final, 1 - P_final];

    // Update the Uptake Probability chart color based on probability
    if (P_final < 0.3) {
        probabilityChart.data.datasets[0].backgroundColor = ['rgba(231, 76, 60, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Red and Light Gray
        probabilityChart.data.datasets[0].borderColor = ['rgba(231, 76, 60, 1)', 'rgba(236, 240, 241, 1)'];
    } else if (P_final >= 0.3 && P_final < 0.7) {
        probabilityChart.data.datasets[0].backgroundColor = ['rgba(241, 196, 15, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Yellow and Light Gray
        probabilityChart.data.datasets[0].borderColor = ['rgba(241, 196, 15, 1)', 'rgba(236, 240, 241, 1)'];
    } else {
        probabilityChart.data.datasets[0].backgroundColor = ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Green and Light Gray
        probabilityChart.data.datasets[0].borderColor = ['rgba(39, 174, 96, 1)', 'rgba(236, 240, 241, 1)'];
    }

    // Update the Uptake Probability chart
    probabilityChart.update();

    // Update Interpretations Section with Brief Interpretations
    const interpretationsDiv = document.getElementById('interpretations');
    interpretationsDiv.innerHTML = generateInterpretations(P_final);

    // Update Program Package Display
    const packageList = document.getElementById('packageList');
    packageList.innerHTML = generateProgramPackage();

    // Show or hide download buttons based on package selection
    const downloadPackageBtn = document.getElementById('downloadPackageBtn');
    const downloadChartBtn = document.getElementById('downloadChartBtn');
    if (packageList.children.length > 0) {
        downloadPackageBtn.style.display = 'inline-block';
        downloadChartBtn.style.display = 'inline-block';
    } else {
        downloadPackageBtn.style.display = 'none';
        downloadChartBtn.style.display = 'none';
    }

    // Calculate and Display Costs
    const costResults = calculateTotalCost(state, adjustCosts);
    displayCosts(costResults);

    // Calculate and Display Benefits
    const benefits = calculateBenefits(P_final);
    displayBenefits(benefits);

    // Display Cost-Benefit Analysis
    displayCBA(costResults.grandTotal, benefits);

    // Update CBA Chart
    updateCBACChart(costResults.grandTotal, benefits);
}

// Function to generate brief interpretations based on probability
function generateInterpretations(probability) {
    let interpretation = '';

    if (probability < 0.3) {
        interpretation = `<p>Your selected support programs have a low probability of uptake (<30%). This suggests that the current configuration may not be attractive to older adults. Consider revising the program features to better meet the needs and preferences of your target population.</p>`;
    } else if (probability >= 0.3 && probability < 0.7) {
        interpretation = `<p>Your selected support programs have a moderate probability of uptake (30%-70%). While there is potential interest, there is room for improvement. Enhancing certain program features could increase engagement and participation rates.</p>`;
    } else {
        interpretation = `<p>Your selected support programs have a high probability of uptake (>70%). This indicates strong acceptance and interest from older adults. Maintaining and promoting these program features is recommended to maximize impact.</p>`;
    }

    return interpretation;
}

// Function to generate program package list with user-friendly labels
function generateProgramPackage() {
    const packageList = [];
    const form = document.getElementById('decisionForm');
    const selects = form.getElementsByTagName('select');
    for (let select of selects) {
        if (select.id === 'state_select' || select.id === 'adjust_costs' || select.id === 'loneliness_category') {
            continue; // Skip state, adjust costs, and loneliness category selections
        }
        if (select.value === "1") {
            let label = select.previousElementSibling.innerText;
            label = label.replace(':', '').trim();
            const value = select.options[select.selectedIndex].innerText;
            packageList.push(`${label}: ${value}`);
        }
    }
    // Generate HTML list items
    let listItems = '';
    packageList.forEach(item => {
        listItems += `<li>${item}</li>`;
    });
    return listItems;
}

// Function to calculate total cost with state adjustment
function calculateTotalCost(state, adjustCosts) {
    const selectedAttributes = getSelectedAttributes();
    let totalCost = {
        personnel: 0,
        materials: 0,
        technology: 0,
        facility: 0,
        marketing: 0,
        training: 0,
        miscellaneous: 0
    };
    
    selectedAttributes.forEach(attr => {
        const costs = costData[attr];
        for (let key in totalCost) {
            if (costs[key]) {
                totalCost[key] += costs[key];
            }
        }
    });

    // Calculate Grand Total before adjustment
    let grandTotal = 0;
    for (let key in totalCost) {
        grandTotal += totalCost[key];
    }

    // Apply Cost-of-Living Adjustment if applicable
    if (adjustCosts === 'yes' && state && costOfLivingMultipliers[state]) {
        grandTotal = grandTotal * costOfLivingMultipliers[state];
    }

    return { totalCost, grandTotal };
}

// Helper Function to Get Selected Attributes
function getSelectedAttributes() {
    const form = document.getElementById('decisionForm');
    const selects = form.getElementsByTagName('select');
    const attributes = [];
    for (let select of selects) {
        if (select.id === 'state_select' || select.id === 'adjust_costs' || select.id === 'loneliness_category') {
            continue; // Skip state, adjust costs, and loneliness category selections
        }
        if (select.value === "1") {
            attributes.push(select.id);
        }
    }
    return attributes;
}

// Function to calculate benefits based on probability
function calculateBenefits(probability) {
    const benefit = probability * 100 * benefitPerPercent;
    return benefit;
}

// Function to display cost information
function displayCosts(costResults) {
    const { totalCost, grandTotal } = costResults;
    const costList = document.getElementById('costList');
    const totalCostDisplay = document.getElementById('totalCost');
    
    // Clear Previous Costs
    costList.innerHTML = '';
    
    // Populate Cost Components
    for (let key in totalCost) {
        if (totalCost[key] > 0) {
            const listItem = document.createElement('li');
            listItem.innerText = `${capitalizeFirstLetter(key)}: \$${totalCost[key].toLocaleString()}`;
            costList.appendChild(listItem);
        }
    }
    
    // Display Grand Total
    totalCostDisplay.innerText = grandTotal.toLocaleString();
}

// Function to display benefits
function displayBenefits(benefits) {
    const costInformation = document.getElementById('costInformation');
    
    // Check if Benefits Section Exists, else Create
    let benefitsSection = document.getElementById('benefits');
    if (!benefitsSection) {
        benefitsSection = document.createElement('div');
        benefitsSection.id = 'benefits';
        benefitsSection.innerHTML = `
            <h3>Benefit Analysis:</h3>
            <p><strong>Total Estimated Benefits:</strong> <span id="totalBenefits">--</span> AUD</p>
        `;
        costInformation.appendChild(benefitsSection);
    }
    
    // Update Benefits
    document.getElementById('totalBenefits').innerText = benefits.toLocaleString();
}

// Function to display Cost-Benefit Analysis
function displayCBA(totalCost, benefits) {
    const costInformation = document.getElementById('costInformation');
    
    // Check if CBA Section Exists, else Create
    let cbaSection = document.getElementById('cba');
    if (!cbaSection) {
        cbaSection = document.createElement('div');
        cbaSection.id = 'cba';
        cbaSection.innerHTML = `
            <h3>Cost-Benefit Analysis:</h3>
            <p><strong>Net Benefit:</strong> <span id="netBenefit">--</span> AUD</p>
            <p><strong>Benefit-Cost Ratio:</strong> <span id="bcr">--</span></p>
        `;
        costInformation.appendChild(cbaSection);
    }
    
    // Calculate Net Benefit and Benefit-Cost Ratio
    const netBenefit = benefits - totalCost;
    const bcr = benefits / totalCost;
    
    // Update CBA
    document.getElementById('netBenefit').innerText = netBenefit.toLocaleString();
    document.getElementById('bcr').innerText = bcr.toFixed(2);
}

// Function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to download program package as a text file
function downloadPackage() {
    const packageList = document.getElementById('packageList');
    if (packageList.children.length === 0) {
        alert("No program package selected to download.");
        return;
    }

    let packageText = 'Selected Program Package:\n';
    for (let li of packageList.children) {
        packageText += li.innerText + '\n';
    }

    const blob = new Blob([packageText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Program_Package.txt';
    a.click();
    URL.revokeObjectURL(url);

    alert("Program Package downloaded successfully!");
}

// Function to download the Uptake Probability chart as an image
function downloadChart() {
    const canvas = document.getElementById('probabilityChart');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'Uptake_Probability_Chart.png';
    link.click();
    
    alert("Uptake Probability chart downloaded successfully!");
}

// Function to download CBA report as PDF
function downloadCBAPDF() {
    const state = document.getElementById('state_select').value;
    const adjustCosts = document.getElementById('adjust_costs').value;
    const category = document.getElementById('loneliness_category').value;
    const { grandTotal } = calculateTotalCost(state, adjustCosts);
    const P_final = parseFloat((document.getElementById('probability').innerText).replace('%', '')) / 100;
    const benefits = calculateBenefits(P_final);
    const netBenefit = benefits - grandTotal;
    const bcr = benefits / grandTotal;

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("AussieConnect Plus - Cost-Benefit Analysis Report", 10, 20);
    doc.setFontSize(12);
    doc.text(`Selected Loneliness Category: ${capitalizeFirstLetter(category.replace('_', ' '))}`, 10, 30);
    doc.text(`Selected State: ${state ? state : 'N/A'}`, 10, 40);
    doc.text(`Adjust Costs for Living Expenses: ${adjustCosts === 'yes' ? 'Yes' : 'No'}`, 10, 50);
    doc.text(`Total Estimated Cost: $${grandTotal.toLocaleString()} AUD`, 10, 60);
    doc.text(`Total Estimated Benefits: $${benefits.toLocaleString()} AUD`, 10, 70);
    doc.text(`Net Benefit: $${netBenefit.toLocaleString()} AUD`, 10, 80);
    doc.text(`Benefit-Cost Ratio: ${bcr.toFixed(2)}`, 10, 90);
    
    doc.save('CBA_Report.pdf');

    alert("Cost-Benefit Analysis report downloaded successfully!");
}

// Function to update CBA Chart
function updateCBACChart(totalCost, benefits) {
    cbaChart.data.datasets[0].data = [totalCost, benefits];
    cbaChart.update();
}

// Function to open results by loneliness categories in a new window
function openCategoryResults() {
    const categoryResults = {
        not_lonely: {},
        moderately_lonely: {},
        severely_lonely: {}
    };

    // Iterate through each category and calculate probabilities
    for (let category in coefficients.categories) {
        // Get user selections
        const state = document.getElementById('state_select').value;
        const adjustCosts = document.getElementById('adjust_costs').value;
        const cost_cont = parseFloat(document.getElementById('cost_cont').value);
        const dist_signif = parseFloat(document.getElementById('dist_signif').value);
        const dist_local = parseFloat(document.getElementById('dist_local').value);
        const freq_monthly = parseFloat(document.getElementById('freq_monthly').value);
        const freq_weekly = parseFloat(document.getElementById('freq_weekly').value);
        const mode_virtual = parseFloat(document.getElementById('mode_virtual').value);
        const mode_hybrid = parseFloat(document.getElementById('mode_hybrid').value);
        const dur_2hrs = parseFloat(document.getElementById('dur_2hrs').value);
        const dur_4hrs = parseFloat(document.getElementById('dur_4hrs').value);
        const type_comm = parseFloat(document.getElementById('type_comm').value);
        const type_psych = parseFloat(document.getElementById('type_psych').value);
        const type_vr = parseFloat(document.getElementById('type_vr').value);

        // Calculate U_alt1 with Cost-of-Living Adjustment
        let selectedCoefficients = coefficients.categories[category];

        let adjusted_cost_cont = cost_cont; // Initialize adjusted cost_cont

        if (adjustCosts === 'yes' && state && costOfLivingMultipliers[state]) {
            adjusted_cost_cont = cost_cont * costOfLivingMultipliers[state];
        }

        let U_alt1 = selectedCoefficients.ASC_alt1 +
                    selectedCoefficients.type_comm * type_comm +
                    selectedCoefficients.type_psych * type_psych +
                    selectedCoefficients.type_vr * type_vr +
                    selectedCoefficients.mode_virtual * mode_virtual +
                    selectedCoefficients.mode_hybrid * mode_hybrid +
                    selectedCoefficients.freq_weekly * freq_weekly +
                    selectedCoefficients.freq_monthly * freq_monthly +
                    selectedCoefficients.dur_2hrs * dur_2hrs +
                    selectedCoefficients.dur_4hrs * dur_4hrs +
                    selectedCoefficients.dist_local * dist_local +
                    selectedCoefficients.dist_signif * dist_signif +
                    selectedCoefficients.cost_cont * adjusted_cost_cont;

        // Calculate U_optout
        const U_optout = selectedCoefficients.ASC_optout;

        // Calculate P_alt1 using the logistic function
        const exp_U_alt1 = Math.exp(U_alt1);
        const exp_U_optout = Math.exp(U_optout);
        const P_alt1 = exp_U_alt1 / (exp_U_alt1 + exp_U_optout);

        // Ensure P_alt1 is between 0 and 1
        const P_final = Math.min(Math.max(P_alt1, 0), 1);

        // Store results
        categoryResults[category] = (P_final * 100).toFixed(2) + '%';
    }

    // Open new window and display the results
    const resultWindow = window.open("", "CategoryResults", "width=600,height=400");
    resultWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Results by Loneliness Category</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>Predicted Uptake Probability by Loneliness Category</h1>
                </header>
                <section>
                    <table>
                        <thead>
                            <tr>
                                <th>Loneliness Category</th>
                                <th>Predicted Uptake Probability</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Not Lonely</td>
                                <td>${categoryResults.not_lonely}</td>
                            </tr>
                            <tr>
                                <td>Moderately Lonely</td>
                                <td>${categoryResults.moderately_lonely}</td>
                            </tr>
                            <tr>
                                <td>Severely Lonely</td>
                                <td>${categoryResults.severely_lonely}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>
        </body>
        </html>
    `);
}

// Function to open WTP in a new window
function openWTP() {
    const state = document.getElementById('state_select').value;
    const adjustCosts = document.getElementById('adjust_costs').value;
    const category = document.getElementById('loneliness_category').value;
    const cost_cont = parseFloat(document.getElementById('cost_cont').value);
    const dist_signif = parseFloat(document.getElementById('dist_signif').value);
    const dist_local = parseFloat(document.getElementById('dist_local').value);
    const freq_monthly = parseFloat(document.getElementById('freq_monthly').value);
    const freq_weekly = parseFloat(document.getElementById('freq_weekly').value);
    const mode_virtual = parseFloat(document.getElementById('mode_virtual').value);
    const mode_hybrid = parseFloat(document.getElementById('mode_hybrid').value);
    const dur_2hrs = parseFloat(document.getElementById('dur_2hrs').value);
    const dur_4hrs = parseFloat(document.getElementById('dur_4hrs').value);
    const type_comm = parseFloat(document.getElementById('type_comm').value);
    const type_psych = parseFloat(document.getElementById('type_psych').value);
    const type_vr = parseFloat(document.getElementById('type_vr').value);

    if (!category) {
        alert("Please select a loneliness category.");
        return;
    }

    // Select the appropriate coefficients based on category
    let selectedCoefficients = coefficients.overall; // Default to overall

    if (category in coefficients.categories) {
        selectedCoefficients = coefficients.categories[category];
    } else {
        alert("Selected loneliness category is invalid.");
        return;
    }

    // Calculate WTP for each attribute (only for significant attributes)
    // WTP = Coef / |cost_cont_coef|
    const cost_coef = selectedCoefficients.cost_cont;

    let WTP = {};

    // List of attributes for WTP calculation (exclude constants and cost)
    const attributes = ['type_comm', 'type_psych', 'type_vr', 'mode_virtual', 'mode_hybrid', 'freq_weekly', 'freq_monthly', 'dur_2hrs', 'dur_4hrs', 'dist_local', 'dist_signif'];

    attributes.forEach(attr => {
        const coef = selectedCoefficients[attr];
        if (coef !== undefined && coef !== 0) {
            WTP[attr] = (coef / Math.abs(cost_coef)).toFixed(2);
        }
    });

    // Open new window and display the WTP
    const wtpWindow = window.open("", "WTPCalculation", "width=600,height=400");
    wtpWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Willingness To Pay (WTP) Report</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>Willingness To Pay (WTP) Report</h1>
                </header>
                <section>
                    <p><strong>Selected Loneliness Category:</strong> ${capitalizeFirstLetter(category.replace('_', ' '))}</p>
                    <p><strong>Selected State:</strong> ${state ? state : 'N/A'}</p>
                    <p><strong>Adjust Costs for Living Expenses:</strong> ${adjustCosts === 'yes' ? 'Yes' : 'No'}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Attribute</th>
                                <th>WTP (AUD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(WTP).map(attr => `
                                <tr>
                                    <td>${formatAttributeName(attr)}</td>
                                    <td>$${WTP[attr]}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>
            </div>
        </body>
        </html>
    `);
}

// Helper function to format attribute names
function formatAttributeName(attr) {
    switch(attr) {
        case 'type_comm':
            return 'Community Engagement';
        case 'type_psych':
            return 'Psychological Counselling';
        case 'type_vr':
            return 'Virtual Reality';
        case 'mode_virtual':
            return 'Virtual Mode';
        case 'mode_hybrid':
            return 'Hybrid Mode';
        case 'freq_weekly':
            return 'Weekly Frequency';
        case 'freq_monthly':
            return 'Monthly Frequency';
        case 'dur_2hrs':
            return '2-hour Duration';
        case 'dur_4hrs':
            return '4-hour Duration';
        case 'dist_local':
            return 'Local Area Accessibility';
        case 'dist_signif':
            return 'Wider Community Accessibility';
        default:
            return attr;
    }
}

// Function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to open results by loneliness categories in a new window
function openCategoryResults() {
    const categoryResults = {
        not_lonely: {},
        moderately_lonely: {},
        severely_lonely: {}
    };

    // Iterate through each category and calculate probabilities
    for (let category in coefficients.categories) {
        // Get user selections
        const state = document.getElementById('state_select').value;
        const adjustCosts = document.getElementById('adjust_costs').value;
        const cost_cont = parseFloat(document.getElementById('cost_cont').value);
        const dist_signif = parseFloat(document.getElementById('dist_signif').value);
        const dist_local = parseFloat(document.getElementById('dist_local').value);
        const freq_monthly = parseFloat(document.getElementById('freq_monthly').value);
        const freq_weekly = parseFloat(document.getElementById('freq_weekly').value);
        const mode_virtual = parseFloat(document.getElementById('mode_virtual').value);
        const mode_hybrid = parseFloat(document.getElementById('mode_hybrid').value);
        const dur_2hrs = parseFloat(document.getElementById('dur_2hrs').value);
        const dur_4hrs = parseFloat(document.getElementById('dur_4hrs').value);
        const type_comm = parseFloat(document.getElementById('type_comm').value);
        const type_psych = parseFloat(document.getElementById('type_psych').value);
        const type_vr = parseFloat(document.getElementById('type_vr').value);

        // Calculate U_alt1 with Cost-of-Living Adjustment
        let selectedCoefficients = coefficients.categories[category];

        let adjusted_cost_cont = cost_cont; // Initialize adjusted cost_cont

        if (adjustCosts === 'yes' && state && costOfLivingMultipliers[state]) {
            adjusted_cost_cont = cost_cont * costOfLivingMultipliers[state];
        }

        let U_alt1 = selectedCoefficients.ASC_alt1 +
                    selectedCoefficients.type_comm * type_comm +
                    selectedCoefficients.type_psych * type_psych +
                    selectedCoefficients.type_vr * type_vr +
                    selectedCoefficients.mode_virtual * mode_virtual +
                    selectedCoefficients.mode_hybrid * mode_hybrid +
                    selectedCoefficients.freq_weekly * freq_weekly +
                    selectedCoefficients.freq_monthly * freq_monthly +
                    selectedCoefficients.dur_2hrs * dur_2hrs +
                    selectedCoefficients.dur_4hrs * dur_4hrs +
                    selectedCoefficients.dist_local * dist_local +
                    selectedCoefficients.dist_signif * dist_signif +
                    selectedCoefficients.cost_cont * adjusted_cost_cont;

        // Calculate U_optout
        const U_optout = selectedCoefficients.ASC_optout;

        // Calculate P_alt1 using the logistic function
        const exp_U_alt1 = Math.exp(U_alt1);
        const exp_U_optout = Math.exp(U_optout);
        const P_alt1 = exp_U_alt1 / (exp_U_alt1 + exp_U_optout);

        // Ensure P_alt1 is between 0 and 1
        const P_final = Math.min(Math.max(P_alt1, 0), 1);

        // Store results
        categoryResults[category] = (P_final * 100).toFixed(2) + '%';
    }

    // Open new window and display the results
    const resultWindow = window.open("", "CategoryResults", "width=600,height=400");
    resultWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Results by Loneliness Category</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>Predicted Uptake Probability by Loneliness Category</h1>
                </header>
                <section>
                    <table>
                        <thead>
                            <tr>
                                <th>Loneliness Category</th>
                                <th>Predicted Uptake Probability</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Not Lonely</td>
                                <td>${categoryResults.not_lonely}</td>
                            </tr>
                            <tr>
                                <td>Moderately Lonely</td>
                                <td>${categoryResults.moderately_lonely}</td>
                            </tr>
                            <tr>
                                <td>Severely Lonely</td>
                                <td>${categoryResults.severely_lonely}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>
        </body>
        </html>
    `);
}

// Function to open WTP in a new window
function openWTP() {
    const state = document.getElementById('state_select').value;
    const adjustCosts = document.getElementById('adjust_costs').value;
    const category = document.getElementById('loneliness_category').value;
    const cost_cont = parseFloat(document.getElementById('cost_cont').value);
    const dist_signif = parseFloat(document.getElementById('dist_signif').value);
    const dist_local = parseFloat(document.getElementById('dist_local').value);
    const freq_monthly = parseFloat(document.getElementById('freq_monthly').value);
    const freq_weekly = parseFloat(document.getElementById('freq_weekly').value);
    const mode_virtual = parseFloat(document.getElementById('mode_virtual').value);
    const mode_hybrid = parseFloat(document.getElementById('mode_hybrid').value);
    const dur_2hrs = parseFloat(document.getElementById('dur_2hrs').value);
    const dur_4hrs = parseFloat(document.getElementById('dur_4hrs').value);
    const type_comm = parseFloat(document.getElementById('type_comm').value);
    const type_psych = parseFloat(document.getElementById('type_psych').value);
    const type_vr = parseFloat(document.getElementById('type_vr').value);

    if (!category) {
        alert("Please select a loneliness category.");
        return;
    }

    // Select the appropriate coefficients based on category
    let selectedCoefficients = coefficients.overall; // Default to overall

    if (category in coefficients.categories) {
        selectedCoefficients = coefficients.categories[category];
    } else {
        alert("Selected loneliness category is invalid.");
        return;
    }

    // Calculate WTP for each attribute (only for significant attributes)
    // WTP = Coef / |cost_cont_coef|
    const cost_coef = selectedCoefficients.cost_cont;

    let WTP = {};

    // List of attributes for WTP calculation (exclude constants and cost)
    const attributes = ['type_comm', 'type_psych', 'type_vr', 'mode_virtual', 'mode_hybrid', 'freq_weekly', 'freq_monthly', 'dur_2hrs', 'dur_4hrs', 'dist_local', 'dist_signif'];

    attributes.forEach(attr => {
        const coef = selectedCoefficients[attr];
        if (coef !== undefined && coef !== 0) {
            WTP[attr] = (coef / Math.abs(cost_coef)).toFixed(2);
        }
    });

    // Open new window and display the WTP
    const wtpWindow = window.open("", "WTPCalculation", "width=600,height=400");
    wtpWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Willingness To Pay (WTP) Report</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>Willingness To Pay (WTP) Report</h1>
                </header>
                <section>
                    <p><strong>Selected Loneliness Category:</strong> ${capitalizeFirstLetter(category.replace('_', ' '))}</p>
                    <p><strong>Selected State:</strong> ${state ? state : 'N/A'}</p>
                    <p><strong>Adjust Costs for Living Expenses:</strong> ${adjustCosts === 'yes' ? 'Yes' : 'No'}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Attribute</th>
                                <th>WTP (AUD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(WTP).map(attr => `
                                <tr>
                                    <td>${formatAttributeName(attr)}</td>
                                    <td>$${WTP[attr]}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </section>
            </div>
        </body>
        </html>
    `);
}

// Function to format attribute names
function formatAttributeName(attr) {
    switch(attr) {
        case 'type_comm':
            return 'Community Engagement';
        case 'type_psych':
            return 'Psychological Counselling';
        case 'type_vr':
            return 'Virtual Reality';
        case 'mode_virtual':
            return 'Virtual Mode';
        case 'mode_hybrid':
            return 'Hybrid Mode';
        case 'freq_weekly':
            return 'Weekly Frequency';
        case 'freq_monthly':
            return 'Monthly Frequency';
        case 'dur_2hrs':
            return '2-hour Duration';
        case 'dur_4hrs':
            return '4-hour Duration';
        case 'dist_local':
            return 'Local Area Accessibility';
        case 'dist_signif':
            return 'Wider Community Accessibility';
        default:
            return attr;
    }
}

// Function to download CBA report as PDF
function downloadCBAPDF() {
    const state = document.getElementById('state_select').value;
    const adjustCosts = document.getElementById('adjust_costs').value;
    const category = document.getElementById('loneliness_category').value;
    const { grandTotal } = calculateTotalCost(state, adjustCosts);
    const P_final = parseFloat((document.getElementById('probability').innerText).replace('%', '')) / 100;
    const benefits = calculateBenefits(P_final);
    const netBenefit = benefits - grandTotal;
    const bcr = benefits / grandTotal;

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("AussieConnect Plus - Cost-Benefit Analysis Report", 10, 20);
    doc.setFontSize(12);
    doc.text(`Selected Loneliness Category: ${capitalizeFirstLetter(category.replace('_', ' '))}`, 10, 30);
    doc.text(`Selected State: ${state ? state : 'N/A'}`, 10, 40);
    doc.text(`Adjust Costs for Living Expenses: ${adjustCosts === 'yes' ? 'Yes' : 'No'}`, 10, 50);
    doc.text(`Total Estimated Cost: $${grandTotal.toLocaleString()} AUD`, 10, 60);
    doc.text(`Total Estimated Benefits: $${benefits.toLocaleString()} AUD`, 10, 70);
    doc.text(`Net Benefit: $${netBenefit.toLocaleString()} AUD`, 10, 80);
    doc.text(`Benefit-Cost Ratio: ${bcr.toFixed(2)}`, 10, 90);
    
    doc.save('CBA_Report.pdf');

    alert("Cost-Benefit Analysis report downloaded successfully!");
}

// Function to update CBA Chart
function updateCBACChart(totalCost, benefits) {
    cbaChart.data.datasets[0].data = [totalCost, benefits];
    cbaChart.update();
}

// Feedback Form Submission Handler
document.getElementById('feedbackForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const feedback = document.getElementById('feedback').value.trim();
    if (feedback) {
        // For demonstration, we'll just alert the feedback. 
        // In a real application, you'd send this to a server.
        alert("Thank you for your feedback!");
        document.getElementById('feedbackForm').reset();
    } else {
        alert("Please enter your feedback before submitting.");
    }
});
