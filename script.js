/* script.js */

// Model Coefficients for Each Loneliness Category
const coefficients = {
    "Not Lonely": {
        ASC_alt1: -0.112,         // Alternative specific constant (mean)
        ASC_optout: 0.131,        // Alternative specific constant - optout
        type_comm: 0.527,          // Community engagement
        type_psych: 0.156,         // Psychological counselling
        type_vr: -0.349,           // Virtual reality
        mode_virtual: -0.426,      // Virtual
        mode_hybrid: -0.289,       // Hybrid (virtual and in-person)
        freq_weekly: 0.617,        // Weekly
        freq_monthly: 0.336,       // Monthly
        dur_2hrs: 0.185,           // 2-hour interaction
        dur_4hrs: 0.213,           // 4-hour interaction
        dist_local: 0.059,         // Local area accessibility (up to 12 km travel)
        dist_signif: -0.509,       // Wider community accessibility (50+ km travel)
        cost_cont: -0.036           // Cost per session
    },
    "Moderately Lonely": {
        ASC_alt1: -0.150,
        ASC_optout: 0.200,
        type_comm: 0.400,
        type_psych: 0.250,
        type_vr: -0.300,
        mode_virtual: -0.350,
        mode_hybrid: -0.320,
        freq_weekly: 0.700,
        freq_monthly: 0.400,
        dur_2hrs: 0.200,
        dur_4hrs: 0.250,
        dist_local: 0.070,
        dist_signif: -0.600,
        cost_cont: -0.050
    },
    "Severely Lonely": {
        ASC_alt1: -0.200,
        ASC_optout: 0.250,
        type_comm: 0.350,
        type_psych: 0.300,
        type_vr: -0.400,
        mode_virtual: -0.500,
        mode_hybrid: -0.450,
        freq_weekly: 0.800,
        freq_monthly: 0.500,
        dur_2hrs: 0.250,
        dur_4hrs: 0.300,
        dist_local: 0.080,
        dist_signif: -0.700,
        cost_cont: -0.060
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
    }
};

// Benefit Parameters
const benefitPerPercent = 10000; // $10,000 AUD per 1% uptake probability

// Cost-of-Living Multipliers by State
let costOfLivingMultipliers = {
    "NSW": 1.10,
    "VIC": 1.05,
    "QLD": 1.00,
    "WA": 1.08,
    "SA": 1.02,
    "TAS": 1.03,
    "ACT": 1.15,
    "NT": 1.07
};

// Function to fetch dynamic cost-of-living data from a JSON file
async function fetchCostOfLivingData() {
    try {
        const response = await fetch('costOfLiving.json'); // Ensure this file is in your project directory
        if (!response.ok) {
            throw new Error('Failed to load cost-of-living data.');
        }
        const data = await response.json();
        costOfLivingMultipliers = data;
        console.log('Cost-of-Living data loaded successfully:', costOfLivingMultipliers);
    } catch (error) {
        console.error('Error loading Cost-of-Living data:', error);
        alert('Failed to load Cost-of-Living data. Using default values.');
        // Default multipliers remain as initially set
    }
}

// Call the fetch function on page load
window.addEventListener('DOMContentLoaded', (event) => {
    fetchCostOfLivingData();
    initializePooledCharts();
    initializeCategoryCharts();
    initializeWTPCcharts();
});

// Initialize Chart.js with Doughnut Chart for Pooled Uptake Probability
let pooledProbabilityChart;
let pooledCBAChart;
let pooledWTPChart;

function initializePooledCharts() {
    const ctx = document.getElementById('pooledProbabilityChart').getContext('2d');
    pooledProbabilityChart = new Chart(ctx, {
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
                    text: 'Pooled Predicted Probability of Program Uptake',
                    font: {
                        size: 18
                    },
                    color: '#2c3e50'
                }
            }
        }
    });

    const cbaCtx = document.getElementById('pooledCBAChart').getContext('2d');
    pooledCBAChart = new Chart(cbaCtx, {
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
                    text: 'Pooled Cost-Benefit Analysis',
                    font: {
                        size: 18
                    },
                    color: '#2c3e50'
                }
            }
        }
    });

    const wtpCtx = document.getElementById('pooledWTPChart').getContext('2d');
    pooledWTPChart = new Chart(wtpCtx, {
        type: 'bar',
        data: {
            labels: ['Willingness To Pay (AUD)'],
            datasets: [{
                label: 'WTP',
                data: [0],
                backgroundColor: ['rgba(155, 89, 182, 0.6)'], // Purple
                borderColor: ['rgba(155, 89, 182, 1)'],
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
                    text: 'Pooled Willingness To Pay (WTP)',
                    font: {
                        size: 18
                    },
                    color: '#2c3e50'
                }
            }
        }
    });
}

// Initialize Charts for Each Loneliness Category
const categoryCharts = {};

function initializeCategoryCharts() {
    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];

    categories.forEach(category => {
        // Uptake Probability Chart
        const ctxProb = document.getElementById(`${category}ProbabilityChart`).getContext('2d');
        categoryCharts[`${category}ProbabilityChart`] = new Chart(ctxProb, {
            type: 'doughnut',
            data: {
                labels: ['Uptake Probability', 'Remaining'],
                datasets: [{
                    data: [0, 1],
                    backgroundColor: ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)'],
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
                        text: `Predicted Probability of Uptake - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });

        // Cost-Benefit Analysis Chart
        const ctxCBA = document.getElementById(`${category}CBAChart`).getContext('2d');
        categoryCharts[`${category}CBAChart`] = new Chart(ctxCBA, {
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
                        text: `Cost-Benefit Analysis - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });

        // WTP Chart
        const ctxWTP = document.getElementById(`${category}WTPChart`).getContext('2d');
        categoryCharts[`${category}WTPChart`] = new Chart(ctxWTP, {
            type: 'bar',
            data: {
                labels: ['Willingness To Pay (AUD)'],
                datasets: [{
                    label: 'WTP',
                    data: [0],
                    backgroundColor: ['rgba(155, 89, 182, 0.6)'], // Purple
                    borderColor: ['rgba(155, 89, 182, 1)'],
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
                        text: `Willingness To Pay (WTP) - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });
    }
}

// Initialize WTP Charts
let pooledWTPChart;

function initializeWTPCcharts() {
    // Pooled WTP Chart is already initialized in initializePooledCharts()
    // No additional initialization needed here
}

// Function to open tabs
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let content of tabContents) {
        content.classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-button");
    for (let btn of tabButtons) {
        btn.classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Helper Function to Format Category Names
function formatCategoryName(category) {
    // Convert 'NotLonely' to 'Not Lonely', etc.
    return category.replace(/([A-Z])/g, ' $1').trim();
}

// Function to calculate predicted probability and update the charts and tables
function calculateProbability() {
    // Get values from the form
    const state = document.getElementById('state_select').value;
    const adjustCosts = document.getElementById('adjust_costs').value;
    const cost_cont = parseFloat(document.getElementById('cost_cont').value);
    const dist_signif = parseFloat(document.getElementById('dist_signif').value);
    const dist_local = parseFloat(document.getElementById('dist_local').value);
    const freq_weekly = parseFloat(document.getElementById('freq_weekly').value);
    const freq_monthly = parseFloat(document.getElementById('freq_monthly').value);
    const mode_virtual = parseFloat(document.getElementById('mode_virtual').value);
    const mode_hybrid = parseFloat(document.getElementById('mode_hybrid').value);
    const dur_2hrs = parseFloat(document.getElementById('dur_2hrs').value);
    const dur_4hrs = parseFloat(document.getElementById('dur_4hrs').value);
    const type_comm = parseFloat(document.getElementById('type_comm').value);
    const type_psych = parseFloat(document.getElementById('type_psych').value);
    const type_vr = parseFloat(document.getElementById('type_vr').value);

    // Validation
    // Ensure only one duration is selected
    if (dur_2hrs === 1 && dur_4hrs === 1) {
        alert("Please select only one duration: either 2 Hours or 4 Hours.");
        return;
    }

    // Ensure only one frequency is selected
    if (freq_weekly === 1 && freq_monthly === 1) {
        alert("Please select only one frequency: either Weekly or Monthly.");
        return;
    }

    // Ensure only one accessibility option is selected
    if (dist_local === 1 && dist_signif === 1) {
        alert("Please select only one accessibility option: either Local Area Accessibility or Wider Community Accessibility.");
        return;
    }

    // Validate that if 'Adjust Costs for Living Expenses' is 'Yes', a state is selected
    if (adjustCosts === 'yes' && !state) {
        alert("Please select a state if you choose to adjust costs for living expenses.");
        return;
    }

    // Calculate U_alt1 for each category with Cost-of-Living Adjustment
    const categories = ["Not Lonely", "Moderately Lonely", "Severely Lonely"];
    const results = {};

    categories.forEach(category => {
        let adjusted_cost_cont = cost_cont; // Initialize adjusted cost_cont

        if (adjustCosts === 'yes' && state && costOfLivingMultipliers[state]) {
            adjusted_cost_cont = cost_cont * costOfLivingMultipliers[state];
        }

        let U_alt1 = coefficients[category].ASC_alt1 +
                     coefficients[category].type_comm * type_comm +
                     coefficients[category].type_psych * type_psych +
                     coefficients[category].type_vr * type_vr +
                     coefficients[category].mode_virtual * mode_virtual +
                     coefficients[category].mode_hybrid * mode_hybrid +
                     coefficients[category].freq_weekly * freq_weekly +
                     coefficients[category].freq_monthly * freq_monthly +
                     coefficients[category].dur_2hrs * dur_2hrs +
                     coefficients[category].dur_4hrs * dur_4hrs +
                     coefficients[category].dist_local * dist_local +
                     coefficients[category].dist_signif * dist_signif +
                     coefficients[category].cost_cont * adjusted_cost_cont;

        // Calculate U_optout (same for all categories)
        const U_optout = coefficients[category].ASC_optout;

        // Calculate P_alt1 using the logistic function
        const exp_U_alt1 = Math.exp(U_alt1);
        const exp_U_optout = Math.exp(U_optout);
        const P_alt1 = exp_U_alt1 / (exp_U_alt1 + exp_U_optout);

        // Ensure P_alt1 is between 0 and 1
        const P_final = Math.min(Math.max(P_alt1, 0), 1);

        // Store probability
        results[category] = {
            probability: (P_final * 100).toFixed(2) + '%',
            interpretation: generateInterpretations(P_final),
            packageList: generateProgramPackage(),
            costList: generateCostList(),
            totalCost: calculateTotalCost(adjustCosts, state).grandTotal,
            benefits: calculateBenefits(P_final),
            netBenefit: calculateBenefits(P_final) - calculateTotalCost(adjustCosts, state).grandTotal,
            bcr: (calculateBenefits(P_final) / calculateTotalCost(adjustCosts, state).grandTotal).toFixed(2),
            WTP: calculateWTP(calculateBenefits(P_final), calculateTotalCost(adjustCosts, state).grandTotal)
        };
    });

    // Update Pooled Uptake Probability Chart
    // Assuming Pooled Probability is the average of all categories
    let totalProbability = 0;
    categories.forEach(category => {
        const prob = parseFloat(results[category].probability.replace('%', ''));
        totalProbability += prob;
    });
    const averageProbability = (totalProbability / categories.length) / 100;
    pooledProbabilityChart.data.datasets[0].data = [averageProbability, 1 - averageProbability];

    // Update the Pooled Uptake Probability chart color based on probability
    if (averageProbability < 0.3) {
        pooledProbabilityChart.data.datasets[0].backgroundColor = ['rgba(231, 76, 60, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Red and Light Gray
        pooledProbabilityChart.data.datasets[0].borderColor = ['rgba(231, 76, 60, 1)', 'rgba(236, 240, 241, 1)'];
    } else if (averageProbability >= 0.3 && averageProbability < 0.7) {
        pooledProbabilityChart.data.datasets[0].backgroundColor = ['rgba(241, 196, 15, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Yellow and Light Gray
        pooledProbabilityChart.data.datasets[0].borderColor = ['rgba(241, 196, 15, 1)', 'rgba(236, 240, 241, 1)'];
    } else {
        pooledProbabilityChart.data.datasets[0].backgroundColor = ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Green and Light Gray
        pooledProbabilityChart.data.datasets[0].borderColor = ['rgba(39, 174, 96, 1)', 'rgba(236, 240, 241, 1)'];
    }

    // Update the Pooled Uptake Probability chart
    pooledProbabilityChart.update();

    // Update Pooled Interpretation
    document.getElementById('pooledInterpretation').innerHTML = generateInterpretations(averageProbability);

    // Update Pooled Program Package
    document.getElementById('pooledPackageList').innerHTML = results["Moderately Lonely"].packageList; // Assuming "Moderately Lonely" as representative

    // Show or hide download buttons based on package selection
    const pooledPackageList = document.getElementById('pooledPackageList');
    const downloadPooledPackageBtn = document.getElementById('downloadPooledPackageBtn');
    const downloadPooledCBAReportBtn = document.getElementById('downloadPooledCBAReportBtn');
    if (pooledPackageList.children.length > 0) {
        downloadPooledPackageBtn.style.display = 'inline-block';
        downloadPooledCBAReportBtn.style.display = 'inline-block';
    } else {
        downloadPooledPackageBtn.style.display = 'none';
        downloadPooledCBAReportBtn.style.display = 'none';
    }

    // Calculate and Display Costs
    const pooledCostResults = calculateTotalCost(adjustCosts, state);
    displayCosts('pooled', pooledCostResults);

    // Calculate and Display Benefits
    const pooledBenefitsValue = calculateBenefits(averageProbability);
    displayBenefits('pooled', pooledBenefitsValue);

    // Display Cost-Benefit Analysis
    displayCBA('pooled', pooledCostResults.grandTotal, pooledBenefitsValue);

    // Update Pooled CBA Chart
    pooledCBAChart.data.datasets[0].data = [pooledCostResults.grandTotal, pooledBenefitsValue];
    pooledCBAChart.update();

    // Calculate and Display WTP
    const pooledWTPValue = results["Moderately Lonely"].WTP;
    document.getElementById('pooledWTP').innerText = costsFormatted(pooledWTPValue);

    // Update Pooled WTP Chart
    pooledWTPChart.data.datasets[0].data = [pooledWTPValue];
    pooledWTPChart.update();

    // Update Category Charts and Sections
    categories.forEach(category => {
        // Update Probability Chart
        const probChart = categoryCharts[`${category.replace(/ /g, '')}ProbabilityChart`];
        const probValue = parseFloat(results[category].probability.replace('%', '')) / 100;
        probChart.data.datasets[0].data = [probValue, 1 - probValue];

        // Update chart colors based on probability
        if (probValue < 0.3) {
            probChart.data.datasets[0].backgroundColor = ['rgba(231, 76, 60, 0.6)', 'rgba(236, 240, 241, 0.3)'];
            probChart.data.datasets[0].borderColor = ['rgba(231, 76, 60, 1)', 'rgba(236, 240, 241, 1)'];
        } else if (probValue >= 0.3 && probValue < 0.7) {
            probChart.data.datasets[0].backgroundColor = ['rgba(241, 196, 15, 0.6)', 'rgba(236, 240, 241, 0.3)'];
            probChart.data.datasets[0].borderColor = ['rgba(241, 196, 15, 1)', 'rgba(236, 240, 241, 1)'];
        } else {
            probChart.data.datasets[0].backgroundColor = ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)'];
            probChart.data.datasets[0].borderColor = ['rgba(39, 174, 96, 1)', 'rgba(236, 240, 241, 1)'];
        }
        probChart.update();

        // Update Interpretation
        document.getElementById(`${category}Interpretation`).innerHTML = results[category].interpretation;

        // Update Program Package
        document.getElementById(`${category}PackageList`).innerHTML = results[category].packageList;

        // Show or hide download buttons based on package selection
        const packageList = document.getElementById(`${category}PackageList`);
        const downloadPackageBtn = document.getElementById(`download${category}PackageBtn`);
        const downloadCBAReportBtn = document.getElementById(`download${category}CBAReportBtn`);
        if (packageList.children.length > 0) {
            downloadPackageBtn.style.display = 'inline-block';
            downloadCBAReportBtn.style.display = 'inline-block';
        } else {
            downloadPackageBtn.style.display = 'none';
            downloadCBAReportBtn.style.display = 'none';
        }

        // Update Cost Analysis
        displayCosts(category, calculateTotalCost(adjustCosts, state));

        // Update Benefits
        displayBenefits(category, results[category].benefits);

        // Update Cost-Benefit Analysis
        displayCBA(category, calculateTotalCost(adjustCosts, state).grandTotal, results[category].benefits);

        // Update CBA Chart
        const cbaChart = categoryCharts[`${category}CBAChart`];
        cbaChart.data.datasets[0].data = [calculateTotalCost(adjustCosts, state).grandTotal, results[category].benefits];
        cbaChart.update();

        // Update WTP
        const WTPValue = results[category].WTP;
        document.getElementById(`${category}WTP`).innerText = costsFormatted(WTPValue);

        // Update WTP Chart
        const wtpChart = categoryCharts[`${category}WTPChart`];
        wtpChart.data.datasets[0].data = [WTPValue];
        wtpChart.update();
    });
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
        if (select.id === 'state_select' || select.id === 'adjust_costs') {
            continue; // Skip state and adjust costs selections
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

// Function to generate cost list HTML
function generateCostList() {
    const selectedAttributes = getSelectedAttributes();
    let listItems = '';
    selectedAttributes.forEach(attr => {
        const costs = costData[attr];
        for (let key in costs) {
            if (costs[key] > 0) {
                listItems += `<li>${capitalizeFirstLetter(key)}: \$${costsFormatted(costs[key])}</li>`;
            }
        }
    });
    return listItems;
}

// Function to calculate total cost with state adjustment
function calculateTotalCost(adjustCosts, state) {
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
        if (select.id === 'state_select' || select.id === 'adjust_costs') {
            continue; // Skip state and adjust costs selections
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

// Function to calculate WTP
function calculateWTP(benefits, costs) {
    // Define WTP as net benefit
    return benefits - costs;
}

// Function to display cost information
function displayCosts(category, costResults) {
    const { totalCost, grandTotal } = costResults;
    const costList = document.getElementById(`${category}CostList`);
    const totalCostDisplay = document.getElementById(`${category}TotalCost`);
    
    // Clear Previous Costs
    costList.innerHTML = '';

    // Populate Cost Components
    for (let key in totalCost) {
        if (totalCost[key] > 0) {
            const listItem = document.createElement('li');
            listItem.innerText = `${capitalizeFirstLetter(key)}: \$${costsFormatted(totalCost[key])}`;
            costList.appendChild(listItem);
        }
    }

    // Display Grand Total
    totalCostDisplay.innerText = costsFormatted(grandTotal);
}

// Function to display benefits
function displayBenefits(category, benefits) {
    const benefitsDisplay = document.getElementById(`${category}Benefits`);
    benefitsDisplay.innerText = costsFormatted(benefits);
}

// Function to display Cost-Benefit Analysis
function displayCBA(category, totalCost, benefits) {
    const netBenefitDisplay = document.getElementById(`${category}NetBenefit`);
    const bcrDisplay = document.getElementById(`${category}BCR`);

    const netBenefit = benefits - totalCost;
    const bcr = benefits / totalCost;

    netBenefitDisplay.innerText = costsFormatted(netBenefit);
    bcrDisplay.innerText = bcr.toFixed(2);
}

// Function to format costs
function costsFormatted(amount) {
    return amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// Function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to download program package as a text file
function downloadPackage(category) {
    let packageText = '';
    if (category === 'pooled') {
        const packageList = document.getElementById('pooledPackageList');
        if (packageList.children.length === 0) {
            alert("No program package selected to download.");
            return;
        }
        packageText = 'Selected Program Package (Pooled):\n';
        for (let li of packageList.children) {
            packageText += li.innerText + '\n';
        }
    } else {
        const packageList = document.getElementById(`${category}PackageList`);
        if (packageList.children.length === 0) {
            alert(`No program package selected to download for ${formatCategoryName(category)}.`);
            return;
        }
        packageText = `Selected Program Package (${formatCategoryName(category)}):\n`;
        for (let li of packageList.children) {
            packageText += li.innerText + '\n';
        }
    }

    const blob = new Blob([packageText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}_Program_Package.txt`;
    a.click();
    URL.revokeObjectURL(url);

    alert("Program Package downloaded successfully!");
}

// Function to download the Cost-Benefit Analysis report as PDF
function downloadCBAPDF(category) {
    let data = {};
    if (category === 'pooled') {
        data = {
            state: document.getElementById('state_select').value || 'N/A',
            adjustCosts: document.getElementById('adjust_costs').value === 'yes' ? 'Yes' : 'No',
            cost_cont: document.getElementById('cost_cont').value,
            totalCost: document.getElementById('pooledTotalCost').innerText,
            benefits: document.getElementById('pooledBenefits').innerText,
            netBenefit: document.getElementById('pooledNetBenefit').innerText,
            bcr: document.getElementById('pooledBCR').innerText
        };
    } else {
        data = {
            state: document.getElementById('state_select').value || 'N/A',
            adjustCosts: document.getElementById('adjust_costs').value === 'yes' ? 'Yes' : 'No',
            cost_cont: document.getElementById('cost_cont').value,
            totalCost: document.getElementById(`${category}TotalCost`).innerText,
            benefits: document.getElementById(`${category}Benefits`).innerText,
            netBenefit: document.getElementById(`${category}NetBenefit`).innerText,
            bcr: document.getElementById(`${category}BCR`).innerText
        };
    }

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add content to PDF
    doc.setFontSize(16);
    doc.text("LonelyLess - Cost-Benefit Analysis Report", 10, 20);
    doc.setFontSize(12);
    doc.text(`Selected State: ${data.state}`, 10, 30);
    doc.text(`Adjust Costs for Living Expenses: ${data.adjustCosts}`, 10, 40);
    doc.text(`Cost Continuum: ${data.cost_cont}`, 10, 50);
    doc.text(`Total Estimated Cost: $${data.totalCost} AUD`, 10, 60);
    doc.text(`Total Estimated Benefits: $${data.benefits} AUD`, 10, 70);
    doc.text(`Net Benefit: $${data.netBenefit} AUD`, 10, 80);
    doc.text(`Benefit-Cost Ratio: ${data.bcr}`, 10, 90);

    // Save PDF
    doc.save(`${category}_CBA_Report.pdf`);

    alert("Cost-Benefit Analysis report downloaded successfully!");
}

// Function to initialize Category Charts
function initializeCategoryCharts() {
    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];
    categories.forEach(category => {
        // Uptake Probability Chart
        const ctxProb = document.getElementById(`${category}ProbabilityChart`).getContext('2d');
        categoryCharts[`${category}ProbabilityChart`] = new Chart(ctxProb, {
            type: 'doughnut',
            data: {
                labels: ['Uptake Probability', 'Remaining'],
                datasets: [{
                    data: [0, 1],
                    backgroundColor: ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)'],
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
                        text: `Predicted Probability of Uptake - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });

        // Cost-Benefit Analysis Chart
        const ctxCBA = document.getElementById(`${category}CBAChart`).getContext('2d');
        categoryCharts[`${category}CBAChart`] = new Chart(ctxCBA, {
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
                        text: `Cost-Benefit Analysis - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });

        // WTP Chart
        const ctxWTP = document.getElementById(`${category}WTPChart`).getContext('2d');
        categoryCharts[`${category}WTPChart`] = new Chart(ctxWTP, {
            type: 'bar',
            data: {
                labels: ['Willingness To Pay (AUD)'],
                datasets: [{
                    label: 'WTP',
                    data: [0],
                    backgroundColor: ['rgba(155, 89, 182, 0.6)'], // Purple
                    borderColor: ['rgba(155, 89, 182, 1)'],
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
                        text: `Willingness To Pay (WTP) - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });
    }
}

// Function to initialize WTP Charts
function initializeWTPCcharts() {
    // WTP Charts are already initialized in initializePooledCharts and initializeCategoryCharts
    // No additional initialization needed here
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

// Function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to format costs
function costsFormatted(amount) {
    return amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// Function to download all CBA reports as PDFs
function downloadAllCBAs() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10;

    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];

    categories.forEach((category, index) => {
        // Get data from the page
        const probability = document.getElementById(`${category}Probability`).innerText;
        const totalCost = document.getElementById(`${category}TotalCost`).innerText;
        const benefits = document.getElementById(`${category}Benefits`).innerText;
        const netBenefit = document.getElementById(`${category}NetBenefit`).innerText;
        const bcr = document.getElementById(`${category}BCR`).innerText;

        doc.setFontSize(16);
        doc.text(`Cost-Benefit Analysis Report - ${formatCategoryName(category)}`, 10, yPosition);
        yPosition += 10;
        doc.setFontSize(12);
        doc.text(`Total Estimated Cost: $${totalCost} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Total Estimated Benefits: $${benefits} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Net Benefit: $${netBenefit} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Benefit-Cost Ratio: ${bcr}`, 10, yPosition);
        
        yPosition += 20;

        if (yPosition > 270 && index < categories.length - 1) { // Avoid adding a page after the last category
            doc.addPage();
            yPosition = 10;
        }
    });

    doc.save('All_CBA_Reports.pdf');

    alert("All Cost-Benefit Analysis reports downloaded successfully!");
}

// Function to download all WTP reports as PDFs
function downloadAllWTPCPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10;

    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];

    categories.forEach((category, index) => {
        // Get WTP data from the page
        const WTP = document.getElementById(`${category}WTP`).innerText;

        doc.setFontSize(16);
        doc.text(`Willingness To Pay (WTP) Report - ${formatCategoryName(category)}`, 10, yPosition);
        yPosition += 10;
        doc.setFontSize(12);
        doc.text(`WTP: $${WTP} AUD`, 10, yPosition);
        
        yPosition += 20;

        if (yPosition > 270 && index < categories.length - 1) { // Avoid adding a page after the last category
            doc.addPage();
            yPosition = 10;
        }
    });

    doc.save('All_WTP_Reports.pdf');

    alert("All Willingness To Pay reports downloaded successfully!");
}

// Function to download all CBA and WTP reports
function downloadAllReports() {
    // You can call downloadAllCBAs and downloadAllWTPCPDF sequentially or combine them
    // For simplicity, let's notify the user to download them separately
    alert("Please use the individual download buttons in each section to download reports.");
}

// Function to calculate predicted probability and update the charts and tables
function calculateProbability() {
    // Get values from the form
    const state = document.getElementById('state_select').value;
    const adjustCosts = document.getElementById('adjust_costs').value;
    const cost_cont = parseFloat(document.getElementById('cost_cont').value);
    const dist_signif = parseFloat(document.getElementById('dist_signif').value);
    const dist_local = parseFloat(document.getElementById('dist_local').value);
    const freq_weekly = parseFloat(document.getElementById('freq_weekly').value);
    const freq_monthly = parseFloat(document.getElementById('freq_monthly').value);
    const mode_virtual = parseFloat(document.getElementById('mode_virtual').value);
    const mode_hybrid = parseFloat(document.getElementById('mode_hybrid').value);
    const dur_2hrs = parseFloat(document.getElementById('dur_2hrs').value);
    const dur_4hrs = parseFloat(document.getElementById('dur_4hrs').value);
    const type_comm = parseFloat(document.getElementById('type_comm').value);
    const type_psych = parseFloat(document.getElementById('type_psych').value);
    const type_vr = parseFloat(document.getElementById('type_vr').value);

    // Validation
    // Ensure only one duration is selected
    if (dur_2hrs === 1 && dur_4hrs === 1) {
        alert("Please select only one duration: either 2 Hours or 4 Hours.");
        return;
    }

    // Ensure only one frequency is selected
    if (freq_weekly === 1 && freq_monthly === 1) {
        alert("Please select only one frequency: either Weekly or Monthly.");
        return;
    }

    // Ensure only one accessibility option is selected
    if (dist_local === 1 && dist_signif === 1) {
        alert("Please select only one accessibility option: either Local Area Accessibility or Wider Community Accessibility.");
        return;
    }

    // Validate that if 'Adjust Costs for Living Expenses' is 'Yes', a state is selected
    if (adjustCosts === 'yes' && !state) {
        alert("Please select a state if you choose to adjust costs for living expenses.");
        return;
    }

    // Calculate U_alt1 for each category with Cost-of-Living Adjustment
    const categories = ["Not Lonely", "Moderately Lonely", "Severely Lonely"];
    const results = {};

    categories.forEach(category => {
        let adjusted_cost_cont = cost_cont; // Initialize adjusted cost_cont

        if (adjustCosts === 'yes' && state && costOfLivingMultipliers[state]) {
            adjusted_cost_cont = cost_cont * costOfLivingMultipliers[state];
        }

        let U_alt1 = coefficients[category].ASC_alt1 +
                     coefficients[category].type_comm * type_comm +
                     coefficients[category].type_psych * type_psych +
                     coefficients[category].type_vr * type_vr +
                     coefficients[category].mode_virtual * mode_virtual +
                     coefficients[category].mode_hybrid * mode_hybrid +
                     coefficients[category].freq_weekly * freq_weekly +
                     coefficients[category].freq_monthly * freq_monthly +
                     coefficients[category].dur_2hrs * dur_2hrs +
                     coefficients[category].dur_4hrs * dur_4hrs +
                     coefficients[category].dist_local * dist_local +
                     coefficients[category].dist_signif * dist_signif +
                     coefficients[category].cost_cont * adjusted_cost_cont;

        // Calculate U_optout (same for all categories)
        const U_optout = coefficients[category].ASC_optout;

        // Calculate P_alt1 using the logistic function
        const exp_U_alt1 = Math.exp(U_alt1);
        const exp_U_optout = Math.exp(U_optout);
        const P_alt1 = exp_U_alt1 / (exp_U_alt1 + exp_U_optout);

        // Ensure P_alt1 is between 0 and 1
        const P_final = Math.min(Math.max(P_alt1, 0), 1);

        // Store probability
        results[category] = {
            probability: (P_final * 100).toFixed(2) + '%',
            interpretation: generateInterpretations(P_final),
            packageList: generateProgramPackage(),
            costList: generateCostList(),
            totalCost: calculateTotalCost(adjustCosts, state).grandTotal,
            benefits: calculateBenefits(P_final),
            netBenefit: calculateBenefits(P_final) - calculateTotalCost(adjustCosts, state).grandTotal,
            bcr: (calculateBenefits(P_final) / calculateTotalCost(adjustCosts, state).grandTotal).toFixed(2),
            WTP: calculateWTP(calculateBenefits(P_final), calculateTotalCost(adjustCosts, state).grandTotal)
        };
    });

    // Update Pooled Uptake Probability Chart
    // Assuming Pooled Probability is the average of all categories
    let totalProbability = 0;
    categories.forEach(category => {
        const prob = parseFloat(results[category].probability.replace('%', ''));
        totalProbability += prob;
    });
    const averageProbability = (totalProbability / categories.length) / 100;
    pooledProbabilityChart.data.datasets[0].data = [averageProbability, 1 - averageProbability];

    // Update the Pooled Uptake Probability chart color based on probability
    if (averageProbability < 0.3) {
        pooledProbabilityChart.data.datasets[0].backgroundColor = ['rgba(231, 76, 60, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Red and Light Gray
        pooledProbabilityChart.data.datasets[0].borderColor = ['rgba(231, 76, 60, 1)', 'rgba(236, 240, 241, 1)'];
    } else if (averageProbability >= 0.3 && averageProbability < 0.7) {
        pooledProbabilityChart.data.datasets[0].backgroundColor = ['rgba(241, 196, 15, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Yellow and Light Gray
        pooledProbabilityChart.data.datasets[0].borderColor = ['rgba(241, 196, 15, 1)', 'rgba(236, 240, 241, 1)'];
    } else {
        pooledProbabilityChart.data.datasets[0].backgroundColor = ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Green and Light Gray
        pooledProbabilityChart.data.datasets[0].borderColor = ['rgba(39, 174, 96, 1)', 'rgba(236, 240, 241, 1)'];
    }

    // Update the Pooled Uptake Probability chart
    pooledProbabilityChart.update();

    // Update Pooled Interpretation
    document.getElementById('pooledInterpretation').innerHTML = generateInterpretations(averageProbability);

    // Update Pooled Program Package
    document.getElementById('pooledPackageList').innerHTML = results["Moderately Lonely"].packageList; // Assuming "Moderately Lonely" as representative

    // Show or hide download buttons based on package selection
    const pooledPackageList = document.getElementById('pooledPackageList');
    const downloadPooledPackageBtn = document.getElementById('downloadPooledPackageBtn');
    const downloadPooledCBAReportBtn = document.getElementById('downloadPooledCBAReportBtn');
    if (pooledPackageList.children.length > 0) {
        downloadPooledPackageBtn.style.display = 'inline-block';
        downloadPooledCBAReportBtn.style.display = 'inline-block';
    } else {
        downloadPooledPackageBtn.style.display = 'none';
        downloadPooledCBAReportBtn.style.display = 'none';
    }

    // Calculate and Display Costs
    const pooledCostResults = calculateTotalCost(adjustCosts, state);
    displayCosts('pooled', pooledCostResults);

    // Calculate and Display Benefits
    const pooledBenefitsValue = calculateBenefits(averageProbability);
    displayBenefits('pooled', pooledBenefitsValue);

    // Display Cost-Benefit Analysis
    displayCBA('pooled', pooledCostResults.grandTotal, pooledBenefitsValue);

    // Update Pooled CBA Chart
    pooledCBAChart.data.datasets[0].data = [pooledCostResults.grandTotal, pooledBenefitsValue];
    pooledCBAChart.update();

    // Calculate and Display WTP
    const pooledWTPValue = results["Moderately Lonely"].WTP;
    document.getElementById('pooledWTP').innerText = costsFormatted(pooledWTPValue);

    // Update Pooled WTP Chart
    pooledWTPChart.data.datasets[0].data = [pooledWTPValue];
    pooledWTPChart.update();

    // Update Category Charts and Sections
    categories.forEach(category => {
        // Update Probability Chart
        const probChart = categoryCharts[`${category.replace(/ /g, '')}ProbabilityChart`];
        const probValue = parseFloat(results[category].probability.replace('%', '')) / 100;
        probChart.data.datasets[0].data = [probValue, 1 - probValue];

        // Update chart colors based on probability
        if (probValue < 0.3) {
            probChart.data.datasets[0].backgroundColor = ['rgba(231, 76, 60, 0.6)', 'rgba(236, 240, 241, 0.3)'];
            probChart.data.datasets[0].borderColor = ['rgba(231, 76, 60, 1)', 'rgba(236, 240, 241, 1)'];
        } else if (probValue >= 0.3 && probValue < 0.7) {
            probChart.data.datasets[0].backgroundColor = ['rgba(241, 196, 15, 0.6)', 'rgba(236, 240, 241, 0.3)'];
            probChart.data.datasets[0].borderColor = ['rgba(241, 196, 15, 1)', 'rgba(236, 240, 241, 1)'];
        } else {
            probChart.data.datasets[0].backgroundColor = ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)'];
            probChart.data.datasets[0].borderColor = ['rgba(39, 174, 96, 1)', 'rgba(236, 240, 241, 1)'];
        }
        probChart.update();

        // Update Interpretation
        document.getElementById(`${category}Interpretation`).innerHTML = results[category].interpretation;

        // Update Program Package
        document.getElementById(`${category}PackageList`).innerHTML = results[category].packageList;

        // Show or hide download buttons based on package selection
        const packageList = document.getElementById(`${category}PackageList`);
        const downloadPackageBtn = document.getElementById(`download${category}PackageBtn`);
        const downloadCBAReportBtn = document.getElementById(`download${category}CBAReportBtn`);
        if (packageList.children.length > 0) {
            downloadPackageBtn.style.display = 'inline-block';
            downloadCBAReportBtn.style.display = 'inline-block';
        } else {
            downloadPackageBtn.style.display = 'none';
            downloadCBAReportBtn.style.display = 'none';
        }

        // Update Cost Analysis
        displayCosts(category, calculateTotalCost(adjustCosts, state));

        // Update Benefits
        displayBenefits(category, results[category].benefits);

        // Update Cost-Benefit Analysis
        displayCBA(category, calculateTotalCost(adjustCosts, state).grandTotal, results[category].benefits);

        // Update CBA Chart
        const cbaChart = categoryCharts[`${category}CBAChart`];
        cbaChart.data.datasets[0].data = [calculateTotalCost(adjustCosts, state).grandTotal, results[category].benefits];
        cbaChart.update();

        // Update WTP
        const WTPValue = results[category].WTP;
        document.getElementById(`${category}WTP`).innerText = costsFormatted(WTPValue);

        // Update WTP Chart
        const wtpChart = categoryCharts[`${category}WTPChart`];
        wtpChart.data.datasets[0].data = [WTPValue];
        wtpChart.update();
    });
}

// Function to download all CBA reports as PDFs
function downloadAllCBAs() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10;

    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];

    categories.forEach((category, index) => {
        // Get data from the page
        const totalCost = document.getElementById(`${category}TotalCost`).innerText;
        const benefits = document.getElementById(`${category}Benefits`).innerText;
        const netBenefit = document.getElementById(`${category}NetBenefit`).innerText;
        const bcr = document.getElementById(`${category}BCR`).innerText;

        doc.setFontSize(16);
        doc.text(`Cost-Benefit Analysis Report - ${formatCategoryName(category)}`, 10, yPosition);
        yPosition += 10;
        doc.setFontSize(12);
        doc.text(`Total Estimated Cost: $${totalCost} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Total Estimated Benefits: $${benefits} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Net Benefit: $${netBenefit} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Benefit-Cost Ratio: ${bcr}`, 10, yPosition);
        
        yPosition += 20;

        if (yPosition > 270 && index < categories.length - 1) { // Avoid adding a page after the last category
            doc.addPage();
            yPosition = 10;
        }
    });

    doc.save('All_CBA_Reports.pdf');

    alert("All Cost-Benefit Analysis reports downloaded successfully!");
}

// Function to download all WTP reports as PDFs
function downloadAllWTPCPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10;

    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];

    categories.forEach((category, index) => {
        // Get WTP data from the page
        const WTP = document.getElementById(`${category}WTP`).innerText;

        doc.setFontSize(16);
        doc.text(`Willingness To Pay (WTP) Report - ${formatCategoryName(category)}`, 10, yPosition);
        yPosition += 10;
        doc.setFontSize(12);
        doc.text(`WTP: $${WTP} AUD`, 10, yPosition);
        
        yPosition += 20;

        if (yPosition > 270 && index < categories.length - 1) { // Avoid adding a page after the last category
            doc.addPage();
            yPosition = 10;
        }
    });

    doc.save('All_WTP_Reports.pdf');

    alert("All Willingness To Pay reports downloaded successfully!");
}

// Function to open tabs
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let content of tabContents) {
        content.classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-button");
    for (let btn of tabButtons) {
        btn.classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
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
        if (select.id === 'state_select' || select.id === 'adjust_costs') {
            continue; // Skip state and adjust costs selections
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

// Function to generate cost list HTML
function generateCostList() {
    const selectedAttributes = getSelectedAttributes();
    let listItems = '';
    selectedAttributes.forEach(attr => {
        const costs = costData[attr];
        for (let key in costs) {
            if (costs[key] > 0) {
                listItems += `<li>${capitalizeFirstLetter(key)}: \$${costsFormatted(costs[key])}</li>`;
            }
        }
    });
    return listItems;
}

// Function to calculate total cost with state adjustment
function calculateTotalCost(adjustCosts, state) {
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
        if (select.id === 'state_select' || select.id === 'adjust_costs') {
            continue; // Skip state and adjust costs selections
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

// Function to calculate WTP
function calculateWTP(benefits, costs) {
    // Define WTP as net benefit
    return benefits - costs;
}

// Function to display cost information
function displayCosts(category, costResults) {
    const { totalCost, grandTotal } = costResults;
    const costList = document.getElementById(`${category}CostList`);
    const totalCostDisplay = document.getElementById(`${category}TotalCost`);
    
    // Clear Previous Costs
    costList.innerHTML = '';

    // Populate Cost Components
    for (let key in totalCost) {
        if (totalCost[key] > 0) {
            const listItem = document.createElement('li');
            listItem.innerText = `${capitalizeFirstLetter(key)}: \$${costsFormatted(totalCost[key])}`;
            costList.appendChild(listItem);
        }
    }

    // Display Grand Total
    totalCostDisplay.innerText = costsFormatted(grandTotal);
}

// Function to display benefits
function displayBenefits(category, benefits) {
    const benefitsDisplay = document.getElementById(`${category}Benefits`);
    benefitsDisplay.innerText = costsFormatted(benefits);
}

// Function to display Cost-Benefit Analysis
function displayCBA(category, totalCost, benefits) {
    const netBenefitDisplay = document.getElementById(`${category}NetBenefit`);
    const bcrDisplay = document.getElementById(`${category}BCR`);

    const netBenefit = benefits - totalCost;
    const bcr = benefits / totalCost;

    netBenefitDisplay.innerText = costsFormatted(netBenefit);
    bcrDisplay.innerText = bcr.toFixed(2);
}

// Function to format costs
function costsFormatted(amount) {
    return amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// Function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to download program package as a text file
function downloadPackage(category) {
    let packageText = '';
    if (category === 'pooled') {
        const packageList = document.getElementById('pooledPackageList');
        if (packageList.children.length === 0) {
            alert("No program package selected to download.");
            return;
        }
        packageText = 'Selected Program Package (Pooled):\n';
        for (let li of packageList.children) {
            packageText += li.innerText + '\n';
        }
    } else {
        const packageList = document.getElementById(`${category}PackageList`);
        if (packageList.children.length === 0) {
            alert(`No program package selected to download for ${formatCategoryName(category)}.`);
            return;
        }
        packageText = `Selected Program Package (${formatCategoryName(category)}):\n`;
        for (let li of packageList.children) {
            packageText += li.innerText + '\n';
        }
    }

    const blob = new Blob([packageText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}_Program_Package.txt`;
    a.click();
    URL.revokeObjectURL(url);

    alert("Program Package downloaded successfully!");
}

// Function to download the Cost-Benefit Analysis report as PDF
function downloadCBAPDF(category) {
    let data = {};
    if (category === 'pooled') {
        data = {
            state: document.getElementById('state_select').value || 'N/A',
            adjustCosts: document.getElementById('adjust_costs').value === 'yes' ? 'Yes' : 'No',
            cost_cont: document.getElementById('cost_cont').value,
            totalCost: document.getElementById('pooledTotalCost').innerText,
            benefits: document.getElementById('pooledBenefits').innerText,
            netBenefit: document.getElementById('pooledNetBenefit').innerText,
            bcr: document.getElementById('pooledBCR').innerText
        };
    } else {
        data = {
            state: document.getElementById('state_select').value || 'N/A',
            adjustCosts: document.getElementById('adjust_costs').value === 'yes' ? 'Yes' : 'No',
            cost_cont: document.getElementById('cost_cont').value,
            totalCost: document.getElementById(`${category}TotalCost`).innerText,
            benefits: document.getElementById(`${category}Benefits`).innerText,
            netBenefit: document.getElementById(`${category}NetBenefit`).innerText,
            bcr: document.getElementById(`${category}BCR`).innerText
        };
    }

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add content to PDF
    doc.setFontSize(16);
    doc.text("LonelyLess - Cost-Benefit Analysis Report", 10, 20);
    doc.setFontSize(12);
    doc.text(`Selected State: ${data.state}`, 10, 30);
    doc.text(`Adjust Costs for Living Expenses: ${data.adjustCosts}`, 10, 40);
    doc.text(`Cost Continuum: ${data.cost_cont}`, 10, 50);
    doc.text(`Total Estimated Cost: $${data.totalCost} AUD`, 10, 60);
    doc.text(`Total Estimated Benefits: $${data.benefits} AUD`, 10, 70);
    doc.text(`Net Benefit: $${data.netBenefit} AUD`, 10, 80);
    doc.text(`Benefit-Cost Ratio: ${data.bcr}`, 10, 90);

    // Save PDF
    doc.save(`${category}_CBA_Report.pdf`);

    alert("Cost-Benefit Analysis report downloaded successfully!");
}

// Function to initialize Category Charts
function initializeCategoryCharts() {
    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];
    categories.forEach(category => {
        // Uptake Probability Chart
        const ctxProb = document.getElementById(`${category}ProbabilityChart`).getContext('2d');
        categoryCharts[`${category}ProbabilityChart`] = new Chart(ctxProb, {
            type: 'doughnut',
            data: {
                labels: ['Uptake Probability', 'Remaining'],
                datasets: [{
                    data: [0, 1],
                    backgroundColor: ['rgba(39, 174, 96, 0.6)', 'rgba(236, 240, 241, 0.3)'],
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
                        text: `Predicted Probability of Uptake - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });

        // Cost-Benefit Analysis Chart
        const ctxCBA = document.getElementById(`${category}CBAChart`).getContext('2d');
        categoryCharts[`${category}CBAChart`] = new Chart(ctxCBA, {
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
                        text: `Cost-Benefit Analysis - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });

        // WTP Chart
        const ctxWTP = document.getElementById(`${category}WTPChart`).getContext('2d');
        categoryCharts[`${category}WTPChart`] = new Chart(ctxWTP, {
            type: 'bar',
            data: {
                labels: ['Willingness To Pay (AUD)'],
                datasets: [{
                    label: 'WTP',
                    data: [0],
                    backgroundColor: ['rgba(155, 89, 182, 0.6)'], // Purple
                    borderColor: ['rgba(155, 89, 182, 1)'],
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
                        text: `Willingness To Pay (WTP) - ${formatCategoryName(category)}`,
                        font: {
                            size: 18
                        },
                        color: '#2c3e50'
                    }
                }
            }
        });
    }
}

// Function to initialize WTP Charts
function initializeWTPCcharts() {
    // WTP Charts are already initialized in initializePooledCharts and initializeCategoryCharts
    // No additional initialization needed here
}

// Function to download all CBA reports as PDFs
function downloadAllCBAs() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10;

    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];

    categories.forEach((category, index) => {
        // Get data from the page
        const totalCost = document.getElementById(`${category}TotalCost`).innerText;
        const benefits = document.getElementById(`${category}Benefits`).innerText;
        const netBenefit = document.getElementById(`${category}NetBenefit`).innerText;
        const bcr = document.getElementById(`${category}BCR`).innerText;

        doc.setFontSize(16);
        doc.text(`Cost-Benefit Analysis Report - ${formatCategoryName(category)}`, 10, yPosition);
        yPosition += 10;
        doc.setFontSize(12);
        doc.text(`Total Estimated Cost: $${totalCost} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Total Estimated Benefits: $${benefits} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Net Benefit: $${netBenefit} AUD`, 10, yPosition);
        yPosition += 10;
        doc.text(`Benefit-Cost Ratio: ${bcr}`, 10, yPosition);
        
        yPosition += 20;

        if (yPosition > 270 && index < categories.length - 1) { // Avoid adding a page after the last category
            doc.addPage();
            yPosition = 10;
        }
    });

    doc.save('All_CBA_Reports.pdf');

    alert("All Cost-Benefit Analysis reports downloaded successfully!");
}

// Function to download all WTP reports as PDFs
function downloadAllWTPCPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 10;

    const categories = ["NotLonely", "ModeratelyLonely", "SeverelyLonely"];

    categories.forEach((category, index) => {
        // Get WTP data from the page
        const WTP = document.getElementById(`${category}WTP`).innerText;

        doc.setFontSize(16);
        doc.text(`Willingness To Pay (WTP) Report - ${formatCategoryName(category)}`, 10, yPosition);
        yPosition += 10;
        doc.setFontSize(12);
        doc.text(`WTP: $${WTP} AUD`, 10, yPosition);
        
        yPosition += 20;

        if (yPosition > 270 && index < categories.length - 1) { // Avoid adding a page after the last category
            doc.addPage();
            yPosition = 10;
        }
    });

    doc.save('All_WTP_Reports.pdf');

    alert("All Willingness To Pay reports downloaded successfully!");
}

// Function to download all CBA and WTP reports
function downloadAllReports() {
    // You can call downloadAllCBAs and downloadAllWTPCPDF sequentially or combine them
    // For simplicity, let's notify the user to download them separately
    alert("Please use the individual download buttons in each section to download reports.");
}
