// Financial Calculation Functions
// Dependencies: None

// Calculate compound interest
function calculateCompoundInterest(principal, rate, years) {
    return principal * Math.pow(1 + rate / 100, years);
}

// Calculate savings growth with monthly contributions
function calculateSavingsGrowth(monthlyContribution, rate, years) {
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;
    if (monthlyRate === 0) {
        return monthlyContribution * months;
    }
    return monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}
