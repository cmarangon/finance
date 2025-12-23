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
        creditRate: document.getElementById('creditRate'),
        leasingRate: document.getElementById('leasingRate'),
        serviceFees: document.getElementById('serviceFees'),
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
    document.getElementById('creditRateDisplay').textContent = `${parseFloat(inputs.creditRate.value).toFixed(1)}%`;
    document.getElementById('leasingRateDisplay').textContent = `${parseFloat(inputs.leasingRate.value).toFixed(1)}%`;
    document.getElementById('serviceFeesDisplay').textContent = formatCHF(inputs.serviceFees.value);
    document.getElementById('durationDisplay').textContent = `${inputs.duration.value} Monate`;
    document.getElementById('investmentReturnDisplay').textContent = `${parseFloat(inputs.investmentReturn.value).toFixed(1)}%`;
    document.getElementById('resultDuration').textContent = inputs.duration.value;
}

// Main calculation function
function calculateCarComparison(inputs) {
    const availableMoney = parseFloat(inputs.availableMoney.value);
    const carPrice = parseFloat(inputs.carPrice.value);
    const creditRate = parseFloat(inputs.creditRate.value) / 100;
    const leasingRate = parseFloat(inputs.leasingRate.value) / 100;
    const serviceFees = parseFloat(inputs.serviceFees.value);
    const duration = parseInt(inputs.duration.value);
    const investmentReturn = parseFloat(inputs.investmentReturn.value) / 100;

    // Calculate monthly investment return
    const monthlyReturn = Math.pow(1 + investmentReturn, 1/12) - 1;

    // Calculate car depreciation (15% first year, then 10% per year)
    const carValueAtEnd = calculateCarValue(carPrice, duration);

    // === OPTION 1: BARKAUF (Cash Purchase) ===
    const barkaufData = calculateBarkauf(availableMoney, carPrice, serviceFees, duration, monthlyReturn, carValueAtEnd);

    // === OPTION 2: LEASING ===
    const leasingData = calculateLeasing(availableMoney, carPrice, duration, leasingRate, monthlyReturn);

    // === OPTION 3: KREDIT (Loan) ===
    const kreditData = calculateKredit(availableMoney, carPrice, serviceFees, duration, creditRate, monthlyReturn, carValueAtEnd);

    // Update results display
    updateResults(barkaufData, leasingData, kreditData, duration, carPrice, serviceFees, carValueAtEnd);

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
function calculateBarkauf(availableMoney, carPrice, serviceFees, duration, monthlyReturn, carValueAtEnd) {
    const data = [];
    const totalInitialCost = carPrice + serviceFees;
    let invested = availableMoney - totalInitialCost;

    // Can't afford cash purchase
    if (invested < 0) {
        for (let m = 0; m <= duration; m++) {
            data.push({ month: m, wealth: 0, portfolio: 0, carValue: 0 });
        }
        return {
            monthlyData: data,
            finalWealth: 0,
            totalCost: totalInitialCost,
            serviceFees: serviceFees,
            initialInvestment: totalInitialCost,
            canAfford: false
        };
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

    const finalPortfolio = data[data.length - 1].portfolio;
    const finalWealth = data[data.length - 1].wealth;
    const depreciation = carPrice - carValueAtEnd;
    const totalCost = depreciation + serviceFees;

    return {
        monthlyData: data,
        finalWealth,
        finalPortfolio,
        totalCost,
        serviceFees: serviceFees,
        depreciation: depreciation,
        initialInvestment: totalInitialCost,
        carValueAtEnd: carValueAtEnd,
        canAfford: true
    };
}

// LEASING calculation
function calculateLeasing(availableMoney, carPrice, duration, leasingRate, monthlyReturn) {
    const data = [];

    // Leasing typically covers depreciation + interest + profit margin
    // Simplified: monthly rate covers the difference between purchase and residual value + interest
    const residualValue = carPrice * 0.45; // 45% residual after typical lease
    const depreciationCost = carPrice - residualValue;
    const totalInterest = (carPrice + residualValue) / 2 * leasingRate * (duration / 12);
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

    const finalPortfolio = Math.max(0, data[data.length - 1].portfolio);
    const finalWealth = finalPortfolio; // No car value at end
    const totalCost = monthlyPayment * duration;

    return {
        monthlyData: data,
        finalWealth,
        finalPortfolio,
        totalCost,
        monthlyPayment: Math.round(monthlyPayment),
        totalPaid: Math.round(totalCost),
        duration: duration
    };
}

// KREDIT calculation
function calculateKredit(availableMoney, carPrice, serviceFees, duration, creditRate, monthlyReturn, carValueAtEnd) {
    const data = [];

    // Calculate monthly credit payment (annuity formula)
    const monthlyInterest = creditRate / 12;
    let monthlyPayment;

    if (monthlyInterest === 0) {
        monthlyPayment = carPrice / duration;
    } else {
        monthlyPayment = carPrice * (monthlyInterest * Math.pow(1 + monthlyInterest, duration)) /
            (Math.pow(1 + monthlyInterest, duration) - 1);
    }

    // Service fees are paid upfront
    let portfolio = availableMoney - serviceFees;
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

    const finalPortfolio = data[data.length - 1].portfolio;
    const finalWealth = data[data.length - 1].wealth;
    const totalPaid = monthlyPayment * duration;
    const totalInterestPaid = totalPaid - carPrice;
    const depreciation = carPrice - carValueAtEnd;
    const totalCost = depreciation + totalInterestPaid + serviceFees;

    return {
        monthlyData: data,
        finalWealth,
        finalPortfolio,
        totalCost,
        monthlyPayment: Math.round(monthlyPayment),
        totalInterest: Math.round(totalInterestPaid),
        serviceFees: serviceFees,
        depreciation: depreciation,
        carValueAtEnd: carValueAtEnd,
        duration: duration
    };
}

// Update results display
function updateResults(barkauf, leasing, kredit, duration, carPrice, serviceFees, carValueAtEnd) {
    const formatCHF = (val) => `CHF ${Math.round(val).toLocaleString('de-CH')}`;
    const formatCHFNeg = (val) => `-CHF ${Math.round(Math.abs(val)).toLocaleString('de-CH')}`;

    // === BARKAUF Panel ===
    document.getElementById('barkaufKaufpreis').textContent = formatCHF(carPrice);
    document.getElementById('barkaufNebenkosten').textContent = formatCHF(serviceFees);
    document.getElementById('barkaufTotalInitial').textContent = formatCHF(carPrice + serviceFees);
    document.getElementById('barkaufPortfolio').textContent = formatCHF(barkauf.finalPortfolio || 0);
    document.getElementById('barkaufCarValue').textContent = formatCHF(carValueAtEnd);
    document.getElementById('barkaufTotal').textContent = formatCHF(barkauf.finalWealth);
    document.getElementById('barkaufDepreciation').textContent = formatCHFNeg(barkauf.depreciation || 0);
    document.getElementById('barkaufFees').textContent = formatCHFNeg(serviceFees);
    document.getElementById('barkaufTotalCost').textContent = formatCHFNeg(barkauf.totalCost || 0);

    // === LEASING Panel ===
    document.getElementById('leasingMonthlyRate').textContent = `${formatCHF(leasing.monthlyPayment)}/Mt.`;
    document.getElementById('leasingRateCount').textContent = `${duration} Monate`;
    document.getElementById('leasingTotalPaid').textContent = formatCHF(leasing.totalPaid);
    document.getElementById('leasingPortfolio').textContent = formatCHF(leasing.finalPortfolio);
    document.getElementById('leasingTotal').textContent = formatCHF(leasing.finalWealth);
    document.getElementById('leasingAllRates').textContent = formatCHFNeg(leasing.totalPaid);
    document.getElementById('leasingTotalCost').textContent = formatCHFNeg(leasing.totalCost);

    // === KREDIT Panel ===
    document.getElementById('kreditMonthlyRate').textContent = `${formatCHF(kredit.monthlyPayment)}/Mt.`;
    document.getElementById('kreditDuration').textContent = `${duration} Monate`;
    document.getElementById('kreditInterest').textContent = formatCHFNeg(kredit.totalInterest);
    document.getElementById('kreditPortfolio').textContent = formatCHF(kredit.finalPortfolio);
    document.getElementById('kreditCarValue').textContent = formatCHF(carValueAtEnd);
    document.getElementById('kreditTotal').textContent = formatCHF(kredit.finalWealth);
    document.getElementById('kreditDepreciation').textContent = formatCHFNeg(kredit.depreciation);
    document.getElementById('kreditFeesAndInterest').textContent = formatCHFNeg(kredit.totalInterest + serviceFees);
    document.getElementById('kreditTotalCost').textContent = formatCHFNeg(kredit.totalCost);

    // Determine best option
    const results = [
        { name: 'Barkauf', wealth: barkauf.finalWealth, panel: 'panelBarkauf', badge: 'barkaufBadge' },
        { name: 'Leasing', wealth: leasing.finalWealth, panel: 'panelLeasing', badge: 'leasingBadge' },
        { name: 'Kredit', wealth: kredit.finalWealth, panel: 'panelKredit', badge: 'kreditBadge' }
    ];

    // Remove all highlight classes from panels
    results.forEach(r => {
        document.getElementById(r.panel).classList.remove('panel-best', 'panel-worst');
        document.getElementById(r.badge).style.display = 'none';
    });

    // Sort by wealth (highest first)
    results.sort((a, b) => b.wealth - a.wealth);

    // Highlight best and worst panels
    document.getElementById(results[0].panel).classList.add('panel-best');
    document.getElementById(results[0].badge).style.display = 'inline-block';
    document.getElementById(results[0].badge).textContent = 'Beste Option';
    document.getElementById(results[0].badge).className = 'panel-badge';

    document.getElementById(results[2].panel).classList.add('panel-worst');

    // Update recommendation banner
    const recommendation = document.getElementById('recommendation');
    const diff = Math.round(results[0].wealth - results[1].wealth);

    if (!barkauf.canAfford) {
        recommendation.innerHTML = `Du hast nicht genug Kapital für Barkauf. <strong>Leasing</strong> ergibt ${formatCHF(leasing.finalWealth)}, <strong>Kredit</strong> ergibt ${formatCHF(kredit.finalWealth)}.`;
    } else if (results[0].name === 'Barkauf') {
        recommendation.innerHTML = `<strong>Barkauf</strong> ist die beste Option mit <strong>${formatCHF(diff)}</strong> mehr Vermögen als ${results[1].name}. Du sparst Zinsen und besitzt das Auto sofort.`;
    } else if (results[0].name === 'Kredit') {
        recommendation.innerHTML = `<strong>Kredit</strong> ist hier besser – dein investiertes Geld verdient mehr als der Kredit kostet. Vorteil: <strong>${formatCHF(diff)}</strong> gegenüber ${results[1].name}.`;
    } else {
        recommendation.innerHTML = `<strong>Leasing</strong> zeigt das höchste Restvermögen, aber <strong>Achtung:</strong> Am Ende gehört dir das Auto nicht!`;
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
