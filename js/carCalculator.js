// Car Calculator - Buy vs Lease vs Credit Comparison
// Compares wealth development over time for different car financing options

let carComparisonChart = null;
let currentChartView = 'overview';
let lastCalculationData = null;

// Initialize car calculator when the page loads
function initCarCalculator() {
    const container = document.getElementById('autorechner');
    if (!container) return;

    // Get input elements
    const inputs = {
        availableMoney: document.getElementById('availableMoney'),
        carPrice: document.getElementById('carPrice'),
        interestRate: document.getElementById('interestRate'),
        duration: document.getElementById('duration'),
        investmentReturn: document.getElementById('investmentReturn')
    };

    // Check if all inputs exist
    if (!inputs.availableMoney || !inputs.carPrice) return;

    // Update displays and calculate on input change
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateCarDisplays(inputs);
                calculateCarComparison(inputs);
            });
        }
    });

    // Initialize tab clicks
    initChartTabs();

    // Initial calculation
    updateCarDisplays(inputs);
    calculateCarComparison(inputs);
}

// Initialize chart tab functionality
function initChartTabs() {
    const tabs = document.querySelectorAll('.chart-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch chart view
            currentChartView = tab.dataset.view;
            if (lastCalculationData) {
                renderChart(lastCalculationData);
            }
        });
    });
}

// Update display values for sliders
function updateCarDisplays(inputs) {
    const formatCHF = (val) => `CHF ${parseInt(val).toLocaleString('de-CH')}`;

    document.getElementById('availableMoneyDisplay').textContent = formatCHF(inputs.availableMoney.value);
    document.getElementById('carPriceDisplay').textContent = formatCHF(inputs.carPrice.value);
    document.getElementById('interestRateDisplay').textContent = `${parseFloat(inputs.interestRate.value).toFixed(1)}%`;
    document.getElementById('durationDisplay').textContent = `${inputs.duration.value} Monate`;
    document.getElementById('investmentReturnDisplay').textContent = `${parseFloat(inputs.investmentReturn.value).toFixed(1)}%`;
    document.getElementById('resultDuration').textContent = inputs.duration.value;
}

// Main calculation function
function calculateCarComparison(inputs) {
    const availableMoney = parseFloat(inputs.availableMoney.value);
    const carPrice = parseFloat(inputs.carPrice.value);
    const interestRate = parseFloat(inputs.interestRate.value) / 100;
    const duration = parseInt(inputs.duration.value);
    const investmentReturn = parseFloat(inputs.investmentReturn.value) / 100;

    // Calculate monthly investment return
    const monthlyReturn = Math.pow(1 + investmentReturn, 1/12) - 1;

    // Calculate car depreciation (15% first year, then 10% per year)
    const carValueAtEnd = calculateCarValue(carPrice, duration);

    // === OPTION 1: BARKAUF (Cash Purchase) ===
    const barkaufData = calculateBarkauf(availableMoney, carPrice, duration, monthlyReturn, carValueAtEnd);

    // === OPTION 2: LEASING ===
    const leasingData = calculateLeasing(availableMoney, carPrice, duration, interestRate, monthlyReturn);

    // === OPTION 3: KREDIT (Loan) ===
    const kreditData = calculateKredit(availableMoney, carPrice, duration, interestRate, monthlyReturn, carValueAtEnd);

    // Update results display
    updateResults(barkaufData, leasingData, kreditData, duration, carValueAtEnd);

    // Store data for chart rendering
    lastCalculationData = {
        barkauf: barkaufData,
        leasing: leasingData,
        kredit: kreditData,
        duration: duration
    };

    // Update chart
    renderChart(lastCalculationData);
}

// Calculate car value after depreciation
function calculateCarValue(price, months) {
    let value = price;
    const years = months / 12;

    // First year: 15% depreciation
    if (years >= 1) {
        value *= 0.85;
        // Remaining years: 10% per year
        for (let i = 1; i < Math.floor(years); i++) {
            value *= 0.90;
        }
        // Partial year depreciation
        const partialYear = years - Math.floor(years);
        if (partialYear > 0 && years > 1) {
            value *= (1 - 0.10 * partialYear);
        } else if (partialYear > 0 && years < 1) {
            value = price * (1 - 0.15 * partialYear);
        }
    } else {
        value = price * (1 - 0.15 * years);
    }

    return Math.round(value);
}

// BARKAUF calculation
function calculateBarkauf(availableMoney, carPrice, duration, monthlyReturn, carValueAtEnd) {
    const data = [];
    let invested = availableMoney - carPrice;

    // Can't afford cash purchase
    if (invested < 0) {
        for (let m = 0; m <= duration; m++) {
            data.push({ month: m, wealth: 0, portfolio: 0, carValue: 0 });
        }
        return { monthlyData: data, finalWealth: 0, totalCost: carPrice };
    }

    for (let m = 0; m <= duration; m++) {
        const carValue = calculateCarValue(carPrice, m);
        const portfolioValue = invested * Math.pow(1 + monthlyReturn, m);
        const totalWealth = portfolioValue + carValue;
        data.push({
            month: m,
            wealth: Math.round(totalWealth),
            portfolio: Math.round(portfolioValue),
            carValue: Math.round(carValue)
        });
    }

    const finalWealth = data[data.length - 1].wealth;
    const totalCost = carPrice - carValueAtEnd; // Net cost after selling

    return { monthlyData: data, finalWealth, totalCost };
}

// LEASING calculation
function calculateLeasing(availableMoney, carPrice, duration, interestRate, monthlyReturn) {
    const data = [];

    // Leasing typically covers depreciation + interest + profit margin
    // Simplified: monthly rate covers the difference between purchase and residual value + interest
    const residualValue = carPrice * 0.45; // 45% residual after typical lease
    const depreciationCost = carPrice - residualValue;
    const totalInterest = (carPrice + residualValue) / 2 * interestRate * (duration / 12);
    const monthlyPayment = (depreciationCost + totalInterest) / duration;

    let portfolio = availableMoney;
    let totalPaid = 0;

    for (let m = 0; m <= duration; m++) {
        if (m > 0) {
            // Grow portfolio, then pay lease
            portfolio = portfolio * (1 + monthlyReturn) - monthlyPayment;
            totalPaid += monthlyPayment;
        }
        // Leasing: no car ownership, so wealth = portfolio only
        data.push({
            month: m,
            wealth: Math.round(Math.max(0, portfolio)),
            portfolio: Math.round(Math.max(0, portfolio)),
            totalPaid: Math.round(totalPaid)
        });
    }

    const finalWealth = Math.max(0, data[data.length - 1].wealth);
    const totalCost = monthlyPayment * duration;

    return { monthlyData: data, finalWealth, totalCost, monthlyPayment: Math.round(monthlyPayment) };
}

// KREDIT calculation
function calculateKredit(availableMoney, carPrice, duration, interestRate, monthlyReturn, carValueAtEnd) {
    const data = [];

    // Calculate monthly credit payment (annuity formula)
    const monthlyInterest = interestRate / 12;
    let monthlyPayment;

    if (monthlyInterest === 0) {
        monthlyPayment = carPrice / duration;
    } else {
        monthlyPayment = carPrice * (monthlyInterest * Math.pow(1 + monthlyInterest, duration)) /
            (Math.pow(1 + monthlyInterest, duration) - 1);
    }

    let portfolio = availableMoney;
    let remainingDebt = carPrice;

    for (let m = 0; m <= duration; m++) {
        const carValue = calculateCarValue(carPrice, m);

        if (m > 0) {
            // Grow portfolio
            portfolio = portfolio * (1 + monthlyReturn);
            // Pay credit installment
            portfolio -= monthlyPayment;
            // Update remaining debt
            const interestPortion = remainingDebt * monthlyInterest;
            const principalPortion = monthlyPayment - interestPortion;
            remainingDebt = Math.max(0, remainingDebt - principalPortion);
        }

        // Total wealth = portfolio + car value - remaining debt
        const totalWealth = Math.max(0, portfolio) + carValue - remainingDebt;
        data.push({
            month: m,
            wealth: Math.round(totalWealth),
            portfolio: Math.round(Math.max(0, portfolio)),
            carValue: Math.round(carValue),
            debt: Math.round(remainingDebt)
        });
    }

    const finalWealth = data[data.length - 1].wealth;
    const totalPaid = monthlyPayment * duration;
    const totalInterestPaid = totalPaid - carPrice;
    const totalCost = (carPrice - carValueAtEnd) + totalInterestPaid;

    return {
        monthlyData: data,
        finalWealth,
        totalCost,
        monthlyPayment: Math.round(monthlyPayment),
        totalInterest: Math.round(totalInterestPaid)
    };
}

// Update results display
function updateResults(barkauf, leasing, kredit, duration, carValueAtEnd) {
    const formatCHF = (val) => `CHF ${Math.round(val).toLocaleString('de-CH')}`;

    // Update values
    document.getElementById('barkaufValue').textContent = formatCHF(barkauf.finalWealth);
    document.getElementById('leasingValue').textContent = formatCHF(leasing.finalWealth);
    document.getElementById('kreditValue').textContent = formatCHF(kredit.finalWealth);

    // Update details
    document.getElementById('barkaufDetail').textContent = `Auto-Restwert: ${formatCHF(carValueAtEnd)}`;
    document.getElementById('leasingDetail').textContent = `Rate: ${formatCHF(leasing.monthlyPayment)}/Mt - Kein Eigentum!`;
    document.getElementById('kreditDetail').textContent = `Rate: ${formatCHF(kredit.monthlyPayment)}/Mt, Zinsen: ${formatCHF(kredit.totalInterest)}`;

    // Determine best option
    const results = [
        { name: 'Barkauf', wealth: barkauf.finalWealth, elem: 'resultBarkauf' },
        { name: 'Leasing', wealth: leasing.finalWealth, elem: 'resultLeasing' },
        { name: 'Kredit', wealth: kredit.finalWealth, elem: 'resultKredit' }
    ];

    // Remove all highlight classes
    results.forEach(r => {
        document.getElementById(r.elem).classList.remove('result-best', 'result-worst');
    });

    // Sort by wealth (highest first)
    results.sort((a, b) => b.wealth - a.wealth);

    // Add highlight to best
    document.getElementById(results[0].elem).classList.add('result-best');
    document.getElementById(results[2].elem).classList.add('result-worst');

    // Update recommendation
    const recommendation = document.getElementById('recommendation');
    if (barkauf.finalWealth === 0) {
        recommendation.innerHTML = `<strong>Hinweis:</strong> Du hast nicht genug Kapital für einen Barkauf. Vergleiche <strong>Leasing</strong> vs. <strong>Kredit</strong>.`;
    } else if (results[0].name === 'Barkauf') {
        recommendation.innerHTML = `<strong>Empfehlung:</strong> Der <strong>Barkauf</strong> ist hier die beste Option. Du sparst Zinsen und hast das Auto sofort.`;
    } else if (results[0].name === 'Kredit') {
        recommendation.innerHTML = `<strong>Empfehlung:</strong> Bei diesen Rendite-Erwartungen könnte ein <strong>Kredit</strong> sinnvoll sein, da dein Geld mehr verdient als der Kredit kostet.`;
    } else {
        recommendation.innerHTML = `<strong>Hinweis:</strong> <strong>Leasing</strong> zeigt hier das höchste Restvermögen, aber bedenke: Am Ende gehört dir das Auto nicht!`;
    }
}

// Main chart rendering function - switches between views
function renderChart(data) {
    // Destroy existing chart before creating new one
    if (carComparisonChart) {
        carComparisonChart.destroy();
        carComparisonChart = null;
    }

    const canvas = document.getElementById('carComparisonChart');
    if (!canvas) return;

    switch (currentChartView) {
        case 'barkauf':
            renderStackedChart(canvas, data, 'barkauf');
            break;
        case 'leasing':
            renderStackedChart(canvas, data, 'leasing');
            break;
        case 'kredit':
            renderStackedChart(canvas, data, 'kredit');
            break;
        default:
            renderOverviewChart(canvas, data);
    }
}

// Create labels for charts
function createChartLabels(duration) {
    const labels = [];
    for (let m = 0; m <= duration; m += 3) {
        labels.push(m === 0 ? 'Start' : `${m} Mt.`);
    }
    if (duration % 3 !== 0) {
        labels.push(`${duration} Mt.`);
    }
    return labels;
}

// Get data points at 3-month intervals
function getDataPoints(monthlyData, duration, property) {
    const points = [];
    for (let m = 0; m <= duration; m += 3) {
        points.push(monthlyData[m]?.[property] || 0);
    }
    if (duration % 3 !== 0) {
        points.push(monthlyData[duration]?.[property] || 0);
    }
    return points;
}

// Render the overview comparison chart
function renderOverviewChart(canvas, data) {
    const { barkauf, leasing, kredit, duration } = data;
    const labels = createChartLabels(duration);

    const ctx = canvas.getContext('2d');
    carComparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Barkauf',
                data: getDataPoints(barkauf.monthlyData, duration, 'wealth'),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Leasing',
                data: getDataPoints(leasing.monthlyData, duration, 'wealth'),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Kredit',
                data: getDataPoints(kredit.monthlyData, duration, 'wealth'),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: getChartOptions('Gesamtvermögen über Zeit')
    });
}

// Render stacked chart for individual option
function renderStackedChart(canvas, data, option) {
    const { duration } = data;
    const optionData = data[option];
    const labels = createChartLabels(duration);
    const ctx = canvas.getContext('2d');

    let datasets = [];
    let title = '';

    if (option === 'barkauf') {
        title = 'Barkauf - Vermögensaufbau';
        datasets = [{
            label: 'Portfolio',
            data: getDataPoints(optionData.monthlyData, duration, 'portfolio'),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: '#22c55e',
            borderWidth: 2,
            fill: true,
            order: 2
        }, {
            label: 'Auto-Wert',
            data: getDataPoints(optionData.monthlyData, duration, 'carValue'),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            fill: true,
            order: 1
        }];
    } else if (option === 'leasing') {
        title = 'Leasing - Vermögensaufbau';
        // For leasing, show portfolio and cumulative payments
        const portfolioData = getDataPoints(optionData.monthlyData, duration, 'portfolio');
        const paidData = getDataPoints(optionData.monthlyData, duration, 'totalPaid');

        datasets = [{
            label: 'Portfolio',
            data: portfolioData,
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: '#f59e0b',
            borderWidth: 2,
            fill: true,
            order: 2
        }, {
            label: 'Bezahlte Raten (kein Gegenwert)',
            data: paidData,
            backgroundColor: 'rgba(239, 68, 68, 0.4)',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            order: 1
        }];
    } else if (option === 'kredit') {
        title = 'Kredit - Vermögensaufbau';
        const portfolioData = getDataPoints(optionData.monthlyData, duration, 'portfolio');
        const carData = getDataPoints(optionData.monthlyData, duration, 'carValue');
        const debtData = getDataPoints(optionData.monthlyData, duration, 'debt').map(d => -d);

        datasets = [{
            label: 'Portfolio',
            data: portfolioData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: '#22c55e',
            borderWidth: 2,
            stack: 'positive',
            order: 3
        }, {
            label: 'Auto-Wert',
            data: carData,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            stack: 'positive',
            order: 2
        }, {
            label: 'Restschuld',
            data: debtData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: 2,
            stack: 'negative',
            order: 1
        }];
    }

    carComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: getStackedChartOptions(title, option)
    });
}

// Chart options for overview
function getChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 20, color: '#c9c9d1' }
            },
            title: {
                display: true,
                text: title,
                color: '#c9c9d1',
                font: { size: 14 }
            },
            tooltip: {
                callbacks: {
                    label: context => `${context.dataset.label}: CHF ${context.parsed.y.toLocaleString('de-CH')}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                    callback: value => `CHF ${(value / 1000).toFixed(0)}k`,
                    color: '#c9c9d1'
                }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#c9c9d1' }
            }
        }
    };
}

// Chart options for stacked charts
function getStackedChartOptions(title, option) {
    const isKredit = option === 'kredit';

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 20, color: '#c9c9d1' }
            },
            title: {
                display: true,
                text: title,
                color: '#c9c9d1',
                font: { size: 14 }
            },
            tooltip: {
                callbacks: {
                    label: context => {
                        const value = Math.abs(context.parsed.y);
                        const prefix = context.parsed.y < 0 ? '-' : '';
                        return `${context.dataset.label}: ${prefix}CHF ${value.toLocaleString('de-CH')}`;
                    }
                }
            }
        },
        scales: {
            y: {
                stacked: isKredit,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                    callback: value => {
                        const absValue = Math.abs(value);
                        const prefix = value < 0 ? '-' : '';
                        return `${prefix}CHF ${(absValue / 1000).toFixed(0)}k`;
                    },
                    color: '#c9c9d1'
                }
            },
            x: {
                stacked: isKredit,
                grid: { display: false },
                ticks: { color: '#c9c9d1' }
            }
        }
    };
}

// Destroy chart when navigating away
function destroyCarChart() {
    if (carComparisonChart) {
        carComparisonChart.destroy();
        carComparisonChart = null;
    }
}
