// Main Application Logic
// Dependencies: All other modules
// This is the main entry point and orchestrator

// Global variables for application state
const settings = loadSettings();
let savingsRate = settings.savingsRate;
let monthlySavings = settings.monthlySavings;
let currentAge = settings.currentAge;

// Toast notification
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
function handleScrollButtons() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (window.scrollY > 500) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
}

// Scroll Animation Observer for Cards
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
        }
    });
}, observerOptions);

// Initialize card observers (called by router after page load)
function initCardObservers() {
    const cards = document.querySelectorAll('#content .card');
    cards.forEach(card => {
        observer.observe(card);
    });
}

// Nav scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Update scroll buttons visibility
    handleScrollButtons();
});

// DOMContentLoaded - Main initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize input fields with saved values
    document.getElementById('savingsRate').value = savingsRate;
    document.getElementById('savingsRateMonthly').value = monthlySavings;
    document.getElementById('currentAge').value = currentAge;
    updateRangeDisplays();

    // Modal controls
    document.getElementById('settingsBtn').addEventListener('click', openModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Scroll to top
    document.getElementById('scrollTopBtn').addEventListener('click', scrollToTop);

    // Close modal when clicking overlay
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            closeModal();
        }
    });

    // Range slider live updates
    const savingsRateInput = document.getElementById('savingsRate');
    const savingsRateMonthlyInput = document.getElementById('savingsRateMonthly');
    const currentAgeInput = document.getElementById('currentAge');

    savingsRateInput.addEventListener('input', updateRangeDisplays);
    savingsRateMonthlyInput.addEventListener('input', updateRangeDisplays);
    currentAgeInput.addEventListener('input', updateRangeDisplays);

    // Bank shortcut buttons
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

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Initialize scroll button visibility
    handleScrollButtons();
});
