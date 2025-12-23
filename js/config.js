// Configuration and Constants
// Dependencies: None

// Chart.js default configuration
Chart.defaults.color = '#a1a1aa';
Chart.defaults.borderColor = '#27272a';
Chart.defaults.font.family = "'DM Sans', sans-serif";

// Default application settings
const DEFAULT_SETTINGS = {
    savingsRate: 0.50,
    monthlySavings: 200,
    currentAge: 30
};

// Financial constants
const INVESTMENT_RATE = 7;
const RETIREMENT_AGE = 65;
const INFLATION_RATE = 0.02; // 2%
const LOW_INTEREST_RATE = 0.005; // 0.5%

// Chart calculation constants
const COMPOUND_PRINCIPAL = 10000;
const INITIAL_AMOUNT = 10000;

// Age ranges for calculations
const EARLY_START_AGE = 25;
const LATE_START_AGE = 35;

// Observer options for intersection observer
const OBSERVER_OPTIONS = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};
