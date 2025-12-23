// Storage Management
// Dependencies: None
// Uses: DEFAULT_SETTINGS from config.js

// Load settings from localStorage or use defaults
function loadSettings() {
    const saved = localStorage.getItem('financeSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        return {
            savingsRate: settings.savingsRate || 0.50,
            monthlySavings: settings.monthlySavings || 200,
            currentAge: settings.currentAge || 30
        };
    }
    return {
        savingsRate: 0.50,
        monthlySavings: 200,
        currentAge: 30
    };
}

// Save settings to localStorage
function saveSettingsToStorage() {
    const settingsData = {
        savingsRate: savingsRate,
        monthlySavings: monthlySavings,
        currentAge: currentAge
    };
    localStorage.setItem('financeSettings', JSON.stringify(settingsData));
}
