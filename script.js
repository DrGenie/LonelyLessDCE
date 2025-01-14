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
window.onload = function() {
    fetchCostOfLivingData();
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
            totalCost: calculateTotalCost(adjustCosts, state).toLocaleString(),
            benefits: calculateBenefits(P_final).toLocaleString(),
            netBenefit: (calculateBenefits(P_final) - calculateTotalCost(adjustCosts, state)).toLocaleString(),
            bcr: (calculateBenefits(P_final) / calculateTotalCost(adjustCosts, state)).toFixed(2)
        };
    });

    // Update the Uptake Probability chart for the main page
    // Assuming overall probability is an average or a specific category
    // Here, we'll take the "Moderately Lonely" as an example
    const overallProbability = parseFloat(results["Moderately Lonely"].probability.replace('%', '')) / 100;
    probabilityChart.data.datasets[0].data = [overallProbability, 1 - overallProbability];

    // Update the Uptake Probability chart color based on probability
    if (overallProbability < 0.3) {
        probabilityChart.data.datasets[0].backgroundColor = ['rgba(231, 76, 60, 0.6)', 'rgba(236, 240, 241, 0.3)']; // Red and Light Gray
        probabilityChart.data.datasets[0].borderColor = ['rgba(231, 76, 60, 1)', 'rgba(236, 240, 241, 1)'];
    } else if (overallProbability >= 0.3 && overallProbability < 0.7) {
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
    interpretationsDiv.innerHTML = results["Moderately Lonely"].interpretation;

    // Update Program Package Display
    const packageList = document.getElementById('packageList');
    packageList.innerHTML = results["Moderately Lonely"].packageList;

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
    const costResults = calculateTotalCost(adjustCosts, state);
    displayCosts(costResults);

    // Calculate and Display Benefits
    const benefitsValue = calculateBenefits(overallProbability);
    displayBenefits(benefitsValue);

    // Display Cost-Benefit Analysis
    displayCBA(costResults.grandTotal, benefitsValue);

    // Update CBA Chart
    updateCBACChart(costResults.grandTotal, benefitsValue);

    // Prepare Data for Category Results
    // Store distinct data for each category
    const categoriesData = results;

    // Store Data in localStorage
    localStorage.setItem('lonelyLessResults', JSON.stringify(categoriesData));

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
                    listItems += `<li>${capitalizeFirstLetter(key)}: \$${costs[key].toLocaleString()}</li>`;
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
        const benefitsSection = document.getElementById('benefit-analysis');
        
        // Update Benefits
        document.getElementById('totalBenefits').innerText = benefits.toLocaleString();
    }

    // Function to display Cost-Benefit Analysis
    function displayCBA(totalCost, benefits) {
        const cbaSection = document.getElementById('cba-analysis');

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

        // Recalculate total cost
        const costResults = calculateTotalCost(adjustCosts, state);
        const totalCost = costResults.grandTotal;
        const benefits = calculateBenefits(parseFloat(document.getElementById('probability').innerText.replace('%', '')) / 100);
        const netBenefit = benefits - totalCost;
        const bcr = benefits / totalCost;

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("LonelyLess - Cost-Benefit Analysis Report", 10, 20);
        doc.setFontSize(12);
        doc.text(`Selected State: ${state ? state : 'N/A'}`, 10, 30);
        doc.text(`Adjust Costs for Living Expenses: ${adjustCosts === 'yes' ? 'Yes' : 'No'}`, 10, 40);
        doc.text(`Total Estimated Cost: $${totalCost.toLocaleString()} AUD`, 10, 50);
        doc.text(`Total Estimated Benefits: $${benefits.toLocaleString()} AUD`, 10, 60);
        doc.text(`Net Benefit: $${netBenefit.toLocaleString()} AUD`, 10, 70);
        doc.text(`Benefit-Cost Ratio: ${bcr.toFixed(2)}`, 10, 80);
        
        doc.save('CBA_Report.pdf');

        alert("Cost-Benefit Analysis report downloaded successfully!");
    }

    // Function to update CBA Chart
    function updateCBACChart(totalCost, benefits) {
        cbaChart.data.datasets[0].data = [totalCost, benefits];
        cbaChart.update();
    }

    // Function to view results by loneliness category
    function viewByLonelinessCategory() {
        // Check if results are stored in localStorage
        const storedData = localStorage.getItem('lonelyLessResults');
        if (!storedData) {
            alert("No results available to display. Please perform calculations first.");
            return;
        }

        // Open categoryResults.html in a new window
        window.open('categoryResults.html', '_blank');
    }

    // Feedback Form Submission Handler (if any)
    // Assuming there's a feedback form in index.html
    /*
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
    */
