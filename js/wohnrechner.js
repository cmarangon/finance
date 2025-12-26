// Wohn-Rechner - Mieten vs. Kaufen Comparison
// Compares wealth development over time for different housing options (Swiss-specific)

let wohnComparisonChart = null;
let currentWohnView = 'overview';
let lastWohnData = null;

// Initialize calculator when the page loads
function initWohnCalculator() {
    const container = document.getElementById('wohnrechner');
    if (!container) return;

    // Get input elements
    const inputs = {
        propertyPrice: document.getElementById('propertyPrice'),
        downPayment: document.getElementById('downPayment'),
        purchaseCosts: document.getElementById('purchaseCosts'),
        appreciation: document.getElementById('appreciation'),
        maintenanceCost: document.getElementById('maintenanceCost'),
        mortgageRate: document.getElementById('mortgageRate'),
        amortYears: document.getElementById('amortYears'),
        monthlyRent: document.getElementById('monthlyRent'),
        rentIncrease: document.getElementById('rentIncrease'),
        investReturn: document.getElementById('investReturn'),
        duration: document.getElementById('duration'),
        taxRate: document.getElementById('taxRate'),
        grossIncome: document.getElementById('grossIncome')
    };

    // Check if all inputs exist
    if (!inputs.propertyPrice || !inputs.downPayment) return;

    // Update displays and calculate on input change
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                updateWohnDisplays(inputs);
                calculateWohnComparison(inputs);
            });
        }
    });

    // Initialize tab clicks
    initWohnChartTabs();

    // Initial calculation
    updateWohnDisplays(inputs);
    calculateWohnComparison(inputs);
}

// Initialize chart tab functionality
function initWohnChartTabs() {
    const tabs = document.querySelectorAll('#wohnrechner .chart-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch chart view
            currentWohnView = tab.dataset.view;
            if (lastWohnData) {
                renderWohnChart(lastWohnData);
            }
        });
    });
}

// Update display values for sliders
function updateWohnDisplays(inputs) {
    const formatCHF = (val) => `CHF ${parseInt(val).toLocaleString('de-CH')}`;

    document.getElementById('propertyPriceDisplay').textContent = formatCHF(inputs.propertyPrice.value);
    document.getElementById('downPaymentDisplay').textContent = formatCHF(inputs.downPayment.value);
    document.getElementById('purchaseCostsDisplay').textContent = `${parseFloat(inputs.purchaseCosts.value).toFixed(1)}%`;
    document.getElementById('appreciationDisplay').textContent = `${parseFloat(inputs.appreciation.value).toFixed(2)}%`;
    document.getElementById('maintenanceCostDisplay').textContent = formatCHF(inputs.maintenanceCost.value);
    document.getElementById('mortgageRateDisplay').textContent = `${parseFloat(inputs.mortgageRate.value).toFixed(1)}%`;
    document.getElementById('amortYearsDisplay').textContent = `${inputs.amortYears.value} Jahre`;
    document.getElementById('monthlyRentDisplay').textContent = formatCHF(inputs.monthlyRent.value);
    document.getElementById('rentIncreaseDisplay').textContent = `${parseFloat(inputs.rentIncrease.value).toFixed(2)}%`;
    document.getElementById('investReturnDisplay').textContent = `${parseFloat(inputs.investReturn.value).toFixed(1)}%`;
    document.getElementById('durationDisplay').textContent = `${inputs.duration.value} Jahre`;
    document.getElementById('taxRateDisplay').textContent = `${inputs.taxRate.value}%`;
    document.getElementById('grossIncomeDisplay').textContent = formatCHF(inputs.grossIncome.value);
    document.getElementById('resultDuration').textContent = inputs.duration.value;

    const mietenEndYearEl = document.getElementById('mietenEndYear');
    if (mietenEndYearEl) {
        mietenEndYearEl.textContent = inputs.duration.value;
    }
}

// Check Swiss mortgage affordability (Tragbarkeit)
function checkAffordability(propertyPrice, downPayment, grossIncome) {
    const mortgage = propertyPrice - downPayment;
    const calcInterest = mortgage * 0.05;  // 5% Kalkulationszins
    const amortization = mortgage * 0.01;  // ~1% Amortisation
    const maintenance = propertyPrice * 0.01; // 1% NK

    const annualCost = calcInterest + amortization + maintenance;
    const ratio = annualCost / grossIncome;

    return {
        isAffordable: ratio <= 0.33,
        ratio: ratio,
        percentOfIncome: Math.round(ratio * 100),
        maxMortgage: Math.round((grossIncome * 0.33) / 0.07)
    };
}

// Main calculation function
function calculateWohnComparison(inputs) {
    const propertyPrice = parseFloat(inputs.propertyPrice.value);
    const downPayment = parseFloat(inputs.downPayment.value);
    const purchaseCostsPct = parseFloat(inputs.purchaseCosts.value) / 100;
    const appreciation = parseFloat(inputs.appreciation.value) / 100;
    const maintenanceCost = parseFloat(inputs.maintenanceCost.value);
    const mortgageRate = parseFloat(inputs.mortgageRate.value) / 100;
    const amortYears = parseInt(inputs.amortYears.value);
    const monthlyRent = parseFloat(inputs.monthlyRent.value);
    const rentIncrease = parseFloat(inputs.rentIncrease.value) / 100;
    const investReturn = parseFloat(inputs.investReturn.value) / 100;
    const duration = parseInt(inputs.duration.value);
    const taxRate = parseFloat(inputs.taxRate.value) / 100;
    const grossIncome = parseFloat(inputs.grossIncome.value);

    // Check affordability
    const affordability = checkAffordability(propertyPrice, downPayment, grossIncome);
    updateAffordabilityWarning(affordability);

    // Calculate purchase costs
    const purchaseCostsCHF = propertyPrice * purchaseCostsPct;

    // Calculate all options
    const kaufenData = calculateKaufen(
        propertyPrice, downPayment, purchaseCostsCHF, appreciation,
        maintenanceCost, mortgageRate, amortYears, duration, taxRate
    );

    const mietenData = calculateMieten(
        downPayment, monthlyRent, rentIncrease, investReturn, duration
    );

    const mietenMaxData = calculateMietenMax(
        downPayment, purchaseCostsCHF, monthlyRent, rentIncrease,
        investReturn, duration, kaufenData.avgMonthlyCost
    );

    // Update results display
    updateWohnResults(kaufenData, mietenData, mietenMaxData, duration, propertyPrice, downPayment, purchaseCostsCHF);

    // Store data for chart rendering
    lastWohnData = {
        kaufen: kaufenData,
        mieten: mietenData,
        mietenMax: mietenMaxData,
        duration: duration
    };

    // Update chart
    renderWohnChart(lastWohnData);
}

// Update affordability warning
function updateAffordabilityWarning(affordability) {
    const warningEl = document.getElementById('affordabilityWarning');
    const textEl = document.getElementById('affordabilityText');

    if (!warningEl) return;

    if (!affordability.isAffordable) {
        warningEl.style.display = 'block';
        textEl.textContent = `Die kalkulatorischen Wohnkosten betragen ${affordability.percentOfIncome}% deines Einkommens (> 33%). Schweizer Banken werden diese Finanzierung wahrscheinlich ablehnen. Maximale Hypothek bei deinem Einkommen: CHF ${affordability.maxMortgage.toLocaleString('de-CH')}.`;
    } else {
        warningEl.style.display = 'none';
    }
}

// KAUFEN calculation (Buy)
function calculateKaufen(propertyPrice, downPayment, purchaseCosts, appreciation, maintenanceCost, mortgageRate, amortYears, duration, taxRate) {
    const data = [];
    const mortgage = propertyPrice - downPayment;

    // Swiss mortgage structure: 1st mortgage (65% LTV) is interest-only
    // 2nd mortgage (remaining to 80% LTV) needs to be amortized
    const firstMortgage = Math.min(propertyPrice * 0.65, mortgage);
    const secondMortgage = Math.max(0, mortgage - firstMortgage);

    // Annual amortization of 2nd mortgage
    const annualAmort = amortYears > 0 ? secondMortgage / amortYears : 0;

    let remainingSecondMortgage = secondMortgage;
    let totalInterestPaid = 0;
    let totalMaintenancePaid = 0;
    let totalTaxEffect = 0;
    let totalMonthlyCosts = 0;

    for (let year = 0; year <= duration; year++) {
        const propertyValue = propertyPrice * Math.pow(1 + appreciation, year);
        const totalMortgage = firstMortgage + remainingSecondMortgage;

        // Swiss tax calculation
        const eigenmietwert = propertyPrice * 0.035; // ~3.5% of property value
        const interestDeduction = totalMortgage * mortgageRate;
        const maintenanceDeduction = propertyPrice * 0.01; // 1% pauschal
        const netTaxable = eigenmietwert - interestDeduction - maintenanceDeduction;
        const yearlyTaxEffect = netTaxable * taxRate; // Can be negative (tax savings)

        // Yearly costs
        const yearlyInterest = totalMortgage * mortgageRate;
        const yearlyAmort = (year < amortYears && year > 0) ? annualAmort : 0;
        const yearlyMaintenance = maintenanceCost;
        const yearlyCost = yearlyInterest + yearlyAmort + yearlyMaintenance + yearlyTaxEffect;

        if (year > 0) {
            totalInterestPaid += yearlyInterest;
            totalMaintenancePaid += yearlyMaintenance;
            totalTaxEffect += yearlyTaxEffect;
            totalMonthlyCosts += yearlyCost;

            // Amortize 2nd mortgage
            if (year <= amortYears) {
                remainingSecondMortgage = Math.max(0, remainingSecondMortgage - annualAmort);
            }
        }

        // Net equity = Property Value - Total Mortgage
        const netEquity = propertyValue - totalMortgage;

        data.push({
            year,
            wealth: Math.round(netEquity),
            propertyValue: Math.round(propertyValue),
            mortgage: Math.round(totalMortgage),
            netEquity: Math.round(netEquity),
            yearlyCost: Math.round(yearlyCost),
            taxEffect: Math.round(yearlyTaxEffect)
        });
    }

    const finalData = data[data.length - 1];
    const avgMonthlyCost = duration > 0 ? totalMonthlyCosts / duration / 12 : 0;

    // Calculate average monthly breakdown
    const avgMonthlyInterest = totalInterestPaid / duration / 12;
    const avgMonthlyAmort = (amortYears > 0 ? secondMortgage / Math.min(amortYears, duration) : 0) / 12;
    const avgMonthlyMaintenance = maintenanceCost / 12;
    const avgMonthlyTax = totalTaxEffect / duration / 12;

    return {
        yearlyData: data,
        finalWealth: finalData.wealth,
        finalPropertyValue: finalData.propertyValue,
        finalMortgage: finalData.mortgage,
        totalInterestPaid: Math.round(totalInterestPaid),
        totalMaintenancePaid: Math.round(totalMaintenancePaid),
        totalTaxEffect: Math.round(totalTaxEffect),
        avgMonthlyCost: Math.round(avgMonthlyCost),
        avgMonthlyInterest: Math.round(avgMonthlyInterest),
        avgMonthlyAmort: Math.round(avgMonthlyAmort),
        avgMonthlyMaintenance: Math.round(avgMonthlyMaintenance),
        avgMonthlyTax: Math.round(avgMonthlyTax),
        purchaseCosts: purchaseCosts
    };
}

// MIETEN calculation (Rent)
function calculateMieten(downPayment, monthlyRent, rentIncrease, investReturn, duration) {
    const data = [];
    let portfolio = downPayment;
    let currentYearlyRent = monthlyRent * 12;
    let totalRentPaid = 0;

    for (let year = 0; year <= duration; year++) {
        if (year > 0) {
            // Portfolio grows with investment return
            portfolio *= (1 + investReturn);

            // Rent increases
            currentYearlyRent *= (1 + rentIncrease);
            totalRentPaid += currentYearlyRent;
        }

        data.push({
            year,
            wealth: Math.round(portfolio),
            portfolio: Math.round(portfolio),
            yearlyRent: Math.round(currentYearlyRent),
            totalRentPaid: Math.round(totalRentPaid)
        });
    }

    const finalData = data[data.length - 1];
    const finalMonthlyRent = currentYearlyRent / 12;

    return {
        yearlyData: data,
        finalWealth: finalData.wealth,
        finalPortfolio: finalData.portfolio,
        totalRentPaid: finalData.totalRentPaid,
        startMonthlyRent: monthlyRent,
        endMonthlyRent: Math.round(finalMonthlyRent)
    };
}

// MIETEN + MAXIMAL SPAREN calculation (Rent and invest aggressively)
function calculateMietenMax(downPayment, purchaseCosts, monthlyRent, rentIncrease, investReturn, duration, kaufenAvgMonthlyCost) {
    const data = [];

    // Initial capital includes down payment AND purchase costs (since we're not buying)
    let portfolio = downPayment + purchaseCosts;
    let currentYearlyRent = monthlyRent * 12;
    let totalExtraSaved = 0;

    // Calculate how much more buying costs vs renting (to invest the difference)
    const monthlyRentStart = monthlyRent;

    for (let year = 0; year <= duration; year++) {
        // Calculate rent for this year
        const currentMonthlyRent = monthlyRentStart * Math.pow(1 + rentIncrease, year);
        currentYearlyRent = currentMonthlyRent * 12;

        if (year > 0) {
            // Portfolio grows with investment return
            portfolio *= (1 + investReturn);

            // If buying costs more than renting, invest the difference
            const monthlySavings = Math.max(0, kaufenAvgMonthlyCost - currentMonthlyRent);
            const yearlySavings = monthlySavings * 12;
            portfolio += yearlySavings;
            totalExtraSaved += yearlySavings;
        }

        data.push({
            year,
            wealth: Math.round(portfolio),
            portfolio: Math.round(portfolio),
            yearlyRent: Math.round(currentYearlyRent),
            extraSaved: Math.round(totalExtraSaved)
        });
    }

    const finalData = data[data.length - 1];
    const avgMonthlySavings = duration > 0 ? Math.max(0, kaufenAvgMonthlyCost - monthlyRent) : 0;

    return {
        yearlyData: data,
        finalWealth: finalData.wealth,
        finalPortfolio: finalData.portfolio,
        totalExtraSaved: finalData.extraSaved,
        avgMonthlySavings: Math.round(avgMonthlySavings),
        initialCapital: downPayment + purchaseCosts
    };
}

// Update results display
function updateWohnResults(kaufen, mieten, mietenMax, duration, propertyPrice, downPayment, purchaseCosts) {
    const formatCHF = (val) => `CHF ${Math.round(val).toLocaleString('de-CH')}`;
    const formatCHFMonth = (val) => `CHF ${Math.round(val).toLocaleString('de-CH')}/Mt.`;
    const formatCHFNeg = (val) => `-CHF ${Math.round(Math.abs(val)).toLocaleString('de-CH')}`;

    // === KAUFEN Panel ===
    document.getElementById('kaufenEigenkapital').textContent = formatCHF(downPayment);
    document.getElementById('kaufenNebenkosten').textContent = formatCHF(purchaseCosts);
    document.getElementById('kaufenZins').textContent = formatCHFMonth(kaufen.avgMonthlyInterest);
    document.getElementById('kaufenAmort').textContent = formatCHFMonth(kaufen.avgMonthlyAmort);
    document.getElementById('kaufenUnterhalt').textContent = formatCHFMonth(kaufen.avgMonthlyMaintenance);

    // Tax effect can be positive (tax burden) or negative (tax savings)
    const steuerEl = document.getElementById('kaufenSteuer');
    if (kaufen.avgMonthlyTax >= 0) {
        steuerEl.textContent = formatCHFMonth(kaufen.avgMonthlyTax);
        steuerEl.classList.remove('negative');
    } else {
        steuerEl.textContent = `-${formatCHFMonth(Math.abs(kaufen.avgMonthlyTax))}`;
        steuerEl.classList.add('negative');
    }

    document.getElementById('kaufenMonatlich').textContent = formatCHFMonth(kaufen.avgMonthlyCost);
    document.getElementById('kaufenImmowert').textContent = formatCHF(kaufen.finalPropertyValue);
    document.getElementById('kaufenRestschuld').textContent = formatCHFNeg(kaufen.finalMortgage);
    document.getElementById('kaufenTotal').textContent = formatCHF(kaufen.finalWealth);

    // === MIETEN Panel ===
    document.getElementById('mietenStart').textContent = formatCHFMonth(mieten.startMonthlyRent);
    document.getElementById('mietenEnd').textContent = formatCHFMonth(mieten.endMonthlyRent);
    document.getElementById('mietenTotalPaid').textContent = formatCHF(mieten.totalRentPaid);
    document.getElementById('mietenPortfolio').textContent = formatCHF(mieten.finalPortfolio);
    document.getElementById('mietenTotal').textContent = formatCHF(mieten.finalWealth);

    // === MIETEN MAX Panel ===
    document.getElementById('mietenMaxEK').textContent = formatCHF(downPayment);
    document.getElementById('mietenMaxNK').textContent = formatCHF(purchaseCosts);
    document.getElementById('mietenMaxSparrate').textContent = formatCHFMonth(mietenMax.avgMonthlySavings);
    document.getElementById('mietenMaxPortfolio').textContent = formatCHF(mietenMax.finalPortfolio);
    document.getElementById('mietenMaxTotal').textContent = formatCHF(mietenMax.finalWealth);

    // Determine best option
    const results = [
        { name: 'Kaufen', wealth: kaufen.finalWealth, panel: 'panelKaufen', badge: 'kaufenBadge' },
        { name: 'Mieten', wealth: mieten.finalWealth, panel: 'panelMieten', badge: 'mietenBadge' },
        { name: 'Mieten + Sparen', wealth: mietenMax.finalWealth, panel: 'panelMietenMax', badge: 'mietenMaxBadge' }
    ];

    // Remove all highlight classes from panels
    results.forEach(r => {
        const panel = document.getElementById(r.panel);
        const badge = document.getElementById(r.badge);
        if (panel) panel.classList.remove('panel-best', 'panel-worst');
        if (badge) badge.style.display = 'none';
    });

    // Sort by wealth (highest first)
    results.sort((a, b) => b.wealth - a.wealth);

    // Highlight best and worst panels
    const bestPanel = document.getElementById(results[0].panel);
    const bestBadge = document.getElementById(results[0].badge);
    if (bestPanel) bestPanel.classList.add('panel-best');
    if (bestBadge) {
        bestBadge.style.display = 'inline-block';
        bestBadge.textContent = 'Beste Option';
        bestBadge.className = 'panel-badge';
    }

    const worstPanel = document.getElementById(results[2].panel);
    if (worstPanel) worstPanel.classList.add('panel-worst');

    // Update recommendation banner
    const recommendation = document.getElementById('recommendation');
    const diff = Math.round(results[0].wealth - results[1].wealth);
    const diffFormatted = formatCHF(diff);

    if (results[0].name === 'Kaufen') {
        recommendation.innerHTML = `<strong>Kaufen</strong> ist die beste Option mit <strong>${diffFormatted}</strong> mehr Vermögen. Du baust Eigenkapital auf und profitierst von der Wertsteigerung.`;
    } else if (results[0].name === 'Mieten') {
        recommendation.innerHTML = `<strong>Mieten</strong> ergibt das höchste Vermögen. Das investierte Eigenkapital wächst stärker als das Immobilienvermögen. Vorteil: <strong>${diffFormatted}</strong>.`;
    } else {
        recommendation.innerHTML = `<strong>Mieten + Maximal Sparen</strong> ist optimal. Investiere Eigenkapital und Kaufnebenkosten plus die monatliche Differenz. Vorteil: <strong>${diffFormatted}</strong>.`;
    }
}

// Main chart rendering function - switches between views
function renderWohnChart(data) {
    // Destroy existing chart before creating new one
    if (wohnComparisonChart) {
        wohnComparisonChart.destroy();
        wohnComparisonChart = null;
    }

    const canvas = document.getElementById('wohnComparisonChart');
    if (!canvas) return;

    switch (currentWohnView) {
        case 'kaufen':
            renderWohnStackedChart(canvas, data, 'kaufen');
            break;
        case 'mieten':
            renderWohnStackedChart(canvas, data, 'mieten');
            break;
        case 'mietenMax':
            renderWohnStackedChart(canvas, data, 'mietenMax');
            break;
        default:
            renderWohnOverviewChart(canvas, data);
    }
}

// Create labels for charts (yearly)
function createWohnChartLabels(duration) {
    const labels = [];
    for (let y = 0; y <= duration; y += Math.max(1, Math.floor(duration / 10))) {
        labels.push(y === 0 ? 'Start' : `${y} J.`);
    }
    if (duration % Math.max(1, Math.floor(duration / 10)) !== 0) {
        labels.push(`${duration} J.`);
    }
    return labels;
}

// Get data points at regular intervals
function getWohnDataPoints(yearlyData, duration, property) {
    const points = [];
    const step = Math.max(1, Math.floor(duration / 10));
    for (let y = 0; y <= duration; y += step) {
        points.push(yearlyData[y]?.[property] || 0);
    }
    if (duration % step !== 0) {
        points.push(yearlyData[duration]?.[property] || 0);
    }
    return points;
}

// Render the overview comparison chart
function renderWohnOverviewChart(canvas, data) {
    const { kaufen, mieten, mietenMax, duration } = data;
    const labels = createWohnChartLabels(duration);

    const ctx = canvas.getContext('2d');
    wohnComparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Kaufen',
                data: getWohnDataPoints(kaufen.yearlyData, duration, 'wealth'),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Mieten',
                data: getWohnDataPoints(mieten.yearlyData, duration, 'wealth'),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Mieten + Sparen',
                data: getWohnDataPoints(mietenMax.yearlyData, duration, 'wealth'),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: getWohnChartOptions('Vermögensentwicklung über Zeit')
    });
}

// Render stacked chart for individual option
function renderWohnStackedChart(canvas, data, option) {
    const { duration } = data;
    const optionData = data[option];
    const labels = createWohnChartLabels(duration);
    const ctx = canvas.getContext('2d');

    let datasets = [];
    let title = '';

    if (option === 'kaufen') {
        title = 'Kaufen - Vermögensaufbau';
        const propertyData = getWohnDataPoints(optionData.yearlyData, duration, 'propertyValue');
        const mortgageData = getWohnDataPoints(optionData.yearlyData, duration, 'mortgage').map(d => -d);

        datasets = [{
            label: 'Immobilienwert',
            data: propertyData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: '#22c55e',
            borderWidth: 2,
            stack: 'positive',
            order: 1
        }, {
            label: 'Hypothek',
            data: mortgageData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: 2,
            stack: 'negative',
            order: 2
        }];
    } else if (option === 'mieten') {
        title = 'Mieten - Portfolio-Entwicklung';
        datasets = [{
            label: 'Portfolio',
            data: getWohnDataPoints(optionData.yearlyData, duration, 'portfolio'),
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: '#f59e0b',
            borderWidth: 2,
            fill: true
        }, {
            label: 'Kumulierte Miete (bezahlt)',
            data: getWohnDataPoints(optionData.yearlyData, duration, 'totalRentPaid'),
            backgroundColor: 'rgba(239, 68, 68, 0.4)',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false
        }];
    } else if (option === 'mietenMax') {
        title = 'Mieten + Sparen - Portfolio-Entwicklung';
        datasets = [{
            label: 'Portfolio',
            data: getWohnDataPoints(optionData.yearlyData, duration, 'portfolio'),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            fill: true
        }, {
            label: 'Davon Extra-Sparrate',
            data: getWohnDataPoints(optionData.yearlyData, duration, 'extraSaved'),
            backgroundColor: 'rgba(34, 197, 94, 0.4)',
            borderColor: '#22c55e',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false
        }];
    }

    const isStacked = option === 'kaufen';

    wohnComparisonChart = new Chart(ctx, {
        type: isStacked ? 'bar' : 'line',
        data: { labels, datasets },
        options: getWohnStackedChartOptions(title, isStacked)
    });
}

// Chart options for overview
function getWohnChartOptions(title) {
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
function getWohnStackedChartOptions(title, isStacked) {
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
                stacked: isStacked,
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
                stacked: isStacked,
                grid: { display: false },
                ticks: { color: '#c9c9d1' }
            }
        }
    };
}

// Destroy chart when navigating away
function destroyWohnChart() {
    if (wohnComparisonChart) {
        wohnComparisonChart.destroy();
        wohnComparisonChart = null;
    }
}
