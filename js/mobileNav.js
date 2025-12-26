// Mobile Navigation - Hamburger Menu Controller
// Dependencies: None
// This handles the mobile navigation drawer open/close functionality

const MobileNav = {
    // Elements
    hamburgerBtn: null,
    navCloseBtn: null,
    navOverlay: null,
    navbar: null,
    body: null,

    // State
    isOpen: false,

    // Initialize mobile navigation
    init() {
        // Get elements
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.navCloseBtn = document.getElementById('navCloseBtn');
        this.navOverlay = document.getElementById('navOverlay');
        this.navbar = document.getElementById('navbar');
        this.body = document.body;

        // Exit if elements don't exist (desktop view)
        if (!this.hamburgerBtn || !this.navbar) return;

        // Bind event listeners
        this.bindEvents();
    },

    // Bind all event listeners
    bindEvents() {
        // Hamburger button click
        this.hamburgerBtn.addEventListener('click', () => this.toggle());

        // Close button click
        if (this.navCloseBtn) {
            this.navCloseBtn.addEventListener('click', () => this.close());
        }

        // Overlay click
        if (this.navOverlay) {
            this.navOverlay.addEventListener('click', () => this.close());
        }

        // Nav link clicks - close nav after selection
        const navLinks = this.navbar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Small delay to allow the click to register before closing
                setTimeout(() => this.close(), 150);
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Handle resize - close nav if switching to desktop
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && this.isOpen) {
                    this.close();
                }
            }, 100);
        });

        // Prevent scrolling on nav when open
        this.navbar.addEventListener('touchmove', (e) => {
            if (this.isOpen) {
                e.stopPropagation();
            }
        }, { passive: true });
    },

    // Toggle navigation
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    // Open navigation
    open() {
        this.isOpen = true;
        this.body.classList.add('nav-open');
        this.hamburgerBtn.setAttribute('aria-expanded', 'true');
        this.hamburgerBtn.setAttribute('aria-label', 'Navigation schliessen');

        // Focus trap - focus the close button when nav opens
        if (this.navCloseBtn) {
            setTimeout(() => this.navCloseBtn.focus(), 100);
        }
    },

    // Close navigation
    close() {
        this.isOpen = false;
        this.body.classList.remove('nav-open');
        this.hamburgerBtn.setAttribute('aria-expanded', 'false');
        this.hamburgerBtn.setAttribute('aria-label', 'Navigation öffnen');

        // Return focus to hamburger button
        this.hamburgerBtn.focus();
    }
};

// Desktop Navigation - Collapsible Sidebar Controller
const DesktopNav = {
    // Elements
    toggleBtn: null,
    navbar: null,
    body: null,

    // State
    isCollapsed: false,
    storageKey: 'navCollapsed',

    // Initialize desktop navigation
    init() {
        this.toggleBtn = document.getElementById('navToggleBtn');
        this.navbar = document.getElementById('navbar');
        this.body = document.body;

        // Exit if toggle button doesn't exist
        if (!this.toggleBtn || !this.navbar) return;

        // Load saved state from localStorage
        this.loadState();

        // Bind event listeners
        this.bindEvents();
    },

    // Load saved collapse state
    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved === 'true') {
            this.collapse();
        }
    },

    // Save collapse state
    saveState() {
        localStorage.setItem(this.storageKey, this.isCollapsed.toString());
    },

    // Bind event listeners
    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggle());

        // Keyboard shortcut: Ctrl+B to toggle (like VS Code)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b' && window.innerWidth > 768) {
                e.preventDefault();
                this.toggle();
            }
        });

        // Handle resize - restore state when switching back to desktop
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Only apply collapsed state on desktop
                if (window.innerWidth > 768 && this.isCollapsed) {
                    this.navbar.classList.add('collapsed');
                    this.body.classList.add('nav-collapsed');
                } else if (window.innerWidth <= 768) {
                    // Remove collapsed classes on mobile
                    this.navbar.classList.remove('collapsed');
                    this.body.classList.remove('nav-collapsed');
                }
            }, 100);
        });
    },

    // Toggle navigation
    toggle() {
        if (this.isCollapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    },

    // Collapse navigation
    collapse() {
        this.isCollapsed = true;
        this.navbar.classList.add('collapsed');
        this.body.classList.add('nav-collapsed');
        this.toggleBtn.setAttribute('aria-expanded', 'false');
        this.toggleBtn.setAttribute('aria-label', 'Navigation ausklappen');
        this.saveState();
    },

    // Expand navigation
    expand() {
        this.isCollapsed = false;
        this.navbar.classList.remove('collapsed');
        this.body.classList.remove('nav-collapsed');
        this.toggleBtn.setAttribute('aria-expanded', 'true');
        this.toggleBtn.setAttribute('aria-label', 'Navigation einklappen');
        this.saveState();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    MobileNav.init();
    DesktopNav.init();
});
