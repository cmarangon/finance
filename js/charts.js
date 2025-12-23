// Chart Management
// Dependencies: Chart.js library
// Uses: calculateCompoundInterest, calculateSavingsGrowth from calculations.js
// Uses: savingsRate, monthlySavings, currentAge global variables

// Global variables for charts (lazy initialized)
let compoundChart = null;
let lifestyleChart = null;
let allocationChart = null;
let riskChart = null;
let interestLossChart = null;

// Update all charts based on settings
function updateCharts() {
    const savingsRateInput = document.getElementById('savingsRate');
    const savingsRateMonthlyInput = document.getElementById('savingsRateMonthly');
    const currentAgeInput = document.getElementById('currentAge');

    if (savingsRateInput) savingsRate = parseFloat(savingsRateInput.value);
    if (savingsRateMonthlyInput) monthlySavings = parseFloat(savingsRateMonthlyInput.value);
    if (currentAgeInput) currentAge = parseInt(currentAgeInput.value);

    // Update text elements if they exist
    const savingsRateText = document.getElementById('savingsRateText');
    if (savingsRateText) savingsRateText.textContent = `~${savingsRate.toFixed(2)}%`;

    const savingsRateTable = document.getElementById('savingsRateTable');
    if (savingsRateTable) savingsRateTable.textContent = `~${savingsRate.toFixed(2)}%`;

    // Update compound example text if it exists
    const compoundExampleText = document.getElementById('compoundExampleText');
    if (compoundExampleText) {
        const investmentRate = 7;
        const retirementAge = 65;
        const earlyAge = 25;
        const lateAge = 35;

        const earlyTotal = Math.round(calculateSavingsGrowth(monthlySavings, investmentRate, retirementAge - earlyAge) / 1000);
        const lateTotal = Math.round(calculateSavingsGrowth(monthlySavings, investmentRate, retirementAge - lateAge) / 1000);

        compoundExampleText.innerHTML =
            `<strong>Beispiel:</strong> CHF ${monthlySavings}/Monat ab ${earlyAge} Jahren = CHF ${earlyTotal}'000 mit ${retirementAge}<br>
            Dieselbe Summe ab ${lateAge} Jahren = nur CHF ${lateTotal}'000`;
    }

    // Initialize and update charts only if their canvas exists
    initAndUpdateCompoundChart();
    initAndUpdateLifestyleChart();
    initAndUpdateAllocationChart();
    initAndUpdateRiskChart();
    initAndUpdateInterestLossChart();
}

// Compound Interest Chart
function initAndUpdateCompoundChart() {
    const canvas = document.getElementById('compoundChart');
    if (!canvas) return;

    const principal = 10000;
    const investmentRate = 7;

    const investmentData = [5, 10, 15, 20, 25, 30].map(years =>
        Math.round(calculateCompoundInterest(principal, investmentRate, years))
    );

    const savingsData = [5, 10, 15, 20, 25, 30].map(years =>
        Math.round(calculateCompoundInterest(principal, savingsRate, years))
    );

    if (!compoundChart) {
        const ctx = canvas.getContext('2d');
        compoundChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Start', '5', '10', '15', '20', '25', '30 Jahre'],
                datasets: [{
                    label: 'Mit Zinseszins (7%)',
                    data: [principal, ...investmentData],
                    borderColor: '#d4a574',
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: `Sparkonto (${savingsRate.toFixed(2)}%)`,
                    data: [principal, ...savingsData],
                    borderColor: '#71717a',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20 } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#1f1f23' },
                        ticks: { callback: value => 'CHF ' + value.toLocaleString() }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    } else {
        compoundChart.data.datasets[0].data = [principal, ...investmentData];
        compoundChart.data.datasets[1].data = [principal, ...savingsData];
        compoundChart.data.datasets[1].label = `Sparkonto (${savingsRate.toFixed(2)}%)`;
        compoundChart.update();
    }
}

// Lifestyle Chart
function initAndUpdateLifestyleChart() {
    const canvas = document.getElementById('lifestyleChart');
    if (!canvas) return;

    const retirementAge = 65;
    const startAge = Math.max(currentAge, 25);
    const ageStep = 5;

    const ages = [];
    for (let age = startAge; age <= retirementAge; age += ageStep) {
        ages.push(age);
    }
    if (ages[ages.length - 1] !== retirementAge) {
        ages.push(retirementAge);
    }

    const highSavingsRate = monthlySavings * 1.5;
    const lowSavingsRate = monthlySavings * 0.5;
    const investmentRate = 7;

    const highSavingsData = ages.map(age => {
        const years = age - currentAge;
        if (years < 0) return 0;
        return Math.round(calculateSavingsGrowth(highSavingsRate, investmentRate, years));
    });

    const lowSavingsData = ages.map(age => {
        const years = age - currentAge;
        if (years < 0) return 0;
        return Math.round(calculateSavingsGrowth(lowSavingsRate, investmentRate, years));
    });

    if (!lifestyleChart) {
        const ctx = canvas.getContext('2d');
        lifestyleChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ages.map(age => age === retirementAge ? `${age} Jahre` : `${age}`),
                datasets: [{
                    label: `Hohe Sparrate (CHF ${Math.round(highSavingsRate)}/Mt)`,
                    data: highSavingsData,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: `Niedrige Sparrate (CHF ${Math.round(lowSavingsRate)}/Mt)`,
                    data: lowSavingsData,
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20 } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#1f1f23' },
                        ticks: { callback: value => 'CHF ' + (value / 1000000).toFixed(1) + 'M' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    } else {
        lifestyleChart.data.labels = ages.map(age => age === retirementAge ? `${age} Jahre` : `${age}`);
        lifestyleChart.data.datasets[0].data = highSavingsData;
        lifestyleChart.data.datasets[0].label = `Hohe Sparrate (CHF ${Math.round(highSavingsRate)}/Mt)`;
        lifestyleChart.data.datasets[1].data = lowSavingsData;
        lifestyleChart.data.datasets[1].label = `Niedrige Sparrate (CHF ${Math.round(lowSavingsRate)}/Mt)`;
        lifestyleChart.update();
    }
}

// Asset Allocation Chart
function initAndUpdateAllocationChart() {
    const canvas = document.getElementById('allocationChart');
    if (!canvas) return;

    const baseAges = [25, 35, 45, 55, 65];
    const ages = [];

    if (!baseAges.includes(currentAge) && currentAge >= 25 && currentAge <= 65) {
        const allAges = [...baseAges, currentAge].sort((a, b) => a - b);
        const currentIndex = allAges.indexOf(currentAge);
        const start = Math.max(0, currentIndex - 2);
        const end = Math.min(allAges.length, start + 5);
        ages.push(...allAges.slice(start, end));
    } else {
        ages.push(...baseAges);
    }

    const stockAllocation = ages.map(age => Math.max(100 - age, 20));
    const bondAllocation = stockAllocation.map(stocks => 100 - stocks);

    const labels = ages.map(age => {
        if (age === currentAge) return `${age} Jahre ★`;
        return `${age} Jahre`;
    });

    if (!allocationChart) {
        const ctx = canvas.getContext('2d');
        allocationChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Aktien',
                    data: stockAllocation,
                    backgroundColor: '#d4a574'
                }, {
                    label: 'Obligationen',
                    data: bondAllocation,
                    backgroundColor: '#52525b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20 } }
                },
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: {
                        stacked: true,
                        max: 100,
                        grid: { color: '#1f1f23' },
                        ticks: { callback: value => value + '%' }
                    }
                }
            }
        });
    } else {
        allocationChart.data.labels = labels;
        allocationChart.data.datasets[0].data = stockAllocation;
        allocationChart.data.datasets[1].data = bondAllocation;
        allocationChart.update();
    }
}

// Risk-Return Chart
function initAndUpdateRiskChart() {
    const canvas = document.getElementById('riskChart');
    if (!canvas) return;

    const data = [
        { x: 0.5, y: savingsRate, label: 'Sparkonto' },
        { x: 3, y: 3, label: 'Obligationen' },
        { x: 5, y: 5, label: 'Immobilien' },
        { x: 9, y: 8, label: 'P2P-Kredite' },
        { x: 12, y: 7, label: 'Aktien' },
        { x: 8, y: 4, label: 'Gold' },
        { x: 30, y: 15, label: 'Crypto' }
    ];

    if (!riskChart) {
        const ctx = canvas.getContext('2d');
        riskChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Anlageklassen',
                    data: data,
                    backgroundColor: '#d4a574',
                    pointRadius: 10,
                    pointHoverRadius: 14
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const point = context.raw;
                                return `${point.label}: Risiko ${point.x}%, Rendite ${point.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Risiko (Volatilität %)', color: '#a1a1aa' },
                        grid: { color: '#1f1f23' },
                        min: 0,
                        max: 35
                    },
                    y: {
                        title: { display: true, text: 'Erwartete Rendite (%)', color: '#a1a1aa' },
                        grid: { color: '#1f1f23' },
                        min: 0,
                        max: 20
                    }
                }
            }
        });
    } else {
        riskChart.data.datasets[0].data = data;
        riskChart.update();
    }
}

// Interest Loss Chart - Purchasing Power Erosion
function initAndUpdateInterestLossChart() {
    const canvas = document.getElementById('interestLossChart');
    if (!canvas) return;

    const years = [];
    const noInterestReal = [];
    const lowInterestReal = [];
    const initialAmount = 10000;
    const inflation = 0.02;
    const lowInterest = 0.005;

    for (let year = 0; year <= 20; year++) {
        years.push(year);
        const noInterestNominal = initialAmount;
        const noInterestPurchasingPower = noInterestNominal / Math.pow(1 + inflation, year);
        noInterestReal.push(Math.round(noInterestPurchasingPower));

        const lowInterestNominal = initialAmount * Math.pow(1 + lowInterest, year);
        const lowInterestPurchasingPower = lowInterestNominal / Math.pow(1 + inflation, year);
        lowInterestReal.push(Math.round(lowInterestPurchasingPower));
    }

    if (!interestLossChart) {
        const ctx = canvas.getContext('2d');
        interestLossChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => y === 0 ? 'Start' : `${y} J.`),
                datasets: [{
                    label: '0.00% Zins (typische Grossbank)',
                    data: noInterestReal,
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }, {
                    label: '0.50% Zins (Alternative Bank)',
                    data: lowInterestReal,
                    borderColor: '#d4a574',
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }, {
                    label: 'Nominaler Wert (ohne Inflation)',
                    data: years.map(() => initialAmount),
                    borderColor: '#71717a',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { color: '#a1a1aa', padding: 15, font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const value = context.parsed.y;
                                const loss = initialAmount - value;
                                return `${context.dataset.label}: CHF ${value.toLocaleString('de-CH')} (Verlust: CHF ${loss.toLocaleString('de-CH')})`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { color: '#1f1f23' }, ticks: { color: '#a1a1aa' } },
                    y: {
                        title: { display: true, text: 'Reale Kaufkraft (CHF)', color: '#a1a1aa' },
                        grid: { color: '#1f1f23' },
                        ticks: { color: '#a1a1aa', callback: value => `CHF ${value.toLocaleString('de-CH')}` },
                        min: 6000,
                        max: 11000
                    }
                }
            }
        });
    } else {
        interestLossChart.update();
    }
}

// Reset chart references when navigating away (called by router)
function destroyCharts() {
    if (compoundChart) { compoundChart.destroy(); compoundChart = null; }
    if (lifestyleChart) { lifestyleChart.destroy(); lifestyleChart = null; }
    if (allocationChart) { allocationChart.destroy(); allocationChart = null; }
    if (riskChart) { riskChart.destroy(); riskChart = null; }
    if (interestLossChart) { interestLossChart.destroy(); interestLossChart = null; }
}
