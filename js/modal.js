// Modal Management
// Dependencies: None
// Uses: savingsRate, monthlySavings, currentAge global variables
// Uses: updateCharts from charts.js
// Uses: saveSettingsToStorage from storage.js

// Modal Functions
function openModal() {
    // Set current values in modal
    document.getElementById('savingsRate').value = savingsRate;
    document.getElementById('savingsRateMonthly').value = monthlySavings;
    document.getElementById('currentAge').value = currentAge;
    updateRangeDisplays();
    document.getElementById('settingsModal').classList.add('active');
}

function closeModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    updateCharts();
    saveSettingsToStorage();
    closeModal();

    // Show success feedback
    showToast('Einstellungen gespeichert!');
}

// Update display values for range sliders
function updateRangeDisplays() {
    const savingsRateInput = document.getElementById('savingsRate');
    const savingsRateMonthlyInput = document.getElementById('savingsRateMonthly');
    const currentAgeInput = document.getElementById('currentAge');

    document.getElementById('savingsRateDisplay').textContent = `${parseFloat(savingsRateInput.value).toFixed(2)}%`;
    document.getElementById('savingsRateMonthlyDisplay').textContent = `CHF ${savingsRateMonthlyInput.value}`;
    document.getElementById('currentAgeDisplay').textContent = `${currentAgeInput.value} Jahre`;
}

// Bank shortcut button handlers (to be attached in app.js)
function setupBankButtons() {
    const savingsRateInput = document.getElementById('savingsRate');
    const bankButtons = document.querySelectorAll('.bank-btn');

    bankButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const rate = parseFloat(btn.getAttribute('data-rate'));
            savingsRateInput.value = rate;
            updateRangeDisplays();

            // Visual feedback - highlight selected bank
            bankButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
}
