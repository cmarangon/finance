// Client-side Router for SPA-like navigation
// Uses View Transitions API with fallback

const Router = {
    // Page cache to avoid re-fetching
    cache: new Map(),

    // Current page
    currentPage: null,

    // Content container
    container: null,

    // Page mappings (hash -> file)
    routes: {
        'hero': 'home',
        'home': 'home',
        'budget': 'budget',
        'echtkosten': 'echtkosten',
        'lifestyle': 'lifestyle',
        'schulden': 'schulden',
        'notgroschen': 'notgroschen',
        'zinswueste': 'zinswueste',
        'vorsorge': 'vorsorge',
        'investieren': 'investieren',
        'arten': 'arten',
        'p2p': 'p2p',
        'risiko': 'risiko'
    },

    // Initialize router
    init() {
        this.container = document.getElementById('content');
        if (!this.container) {
            console.error('Router: #content container not found');
            return;
        }

        // Handle initial route
        this.handleRoute();

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());

        // Intercept navigation clicks
        document.addEventListener('click', (e) => this.handleClick(e));

        // Handle browser back/forward
        window.addEventListener('popstate', () => this.handleRoute());
    },

    // Handle link clicks
    handleClick(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;

        const page = hash.substring(1);
        if (this.routes[page]) {
            e.preventDefault();
            this.navigateTo(page);
        }
    },

    // Navigate to a page
    navigateTo(page) {
        if (page === this.currentPage) return;

        // Update URL hash without triggering hashchange
        history.pushState({ page }, '', `#${page}`);

        // Load the page
        this.loadPage(page);
    },

    // Handle route from URL
    handleRoute() {
        const hash = window.location.hash.substring(1) || 'hero';
        const page = this.routes[hash] ? hash : 'hero';
        this.loadPage(page);
    },

    // Load a page
    async loadPage(page) {
        const fileName = this.routes[page] || 'home';

        try {
            // Destroy existing charts before loading new page
            if (typeof destroyCharts === 'function') {
                destroyCharts();
            }

            // Get content (from cache or fetch)
            const content = await this.fetchPage(fileName);

            // Update the page with transition
            await this.updateContent(content, page);

            this.currentPage = page;

            // Update active nav state
            this.updateActiveNav(page);

            // Reinitialize components for new content
            this.reinitComponents();

            // Scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error(`Router: Failed to load page ${page}`, error);
        }
    },

    // Fetch page content
    async fetchPage(fileName) {
        if (this.cache.has(fileName)) {
            return this.cache.get(fileName);
        }

        const response = await fetch(`pages/${fileName}.html`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const content = await response.text();
        this.cache.set(fileName, content);
        return content;
    },

    // Update content with View Transitions API
    async updateContent(content, page) {
        const update = () => {
            this.container.innerHTML = content;
            this.container.setAttribute('data-page', page);
        };

        // Use View Transitions API if available
        if (document.startViewTransition) {
            await document.startViewTransition(update).finished;
        } else {
            // Fallback with CSS transitions
            this.container.classList.add('page-exit');
            await new Promise(r => setTimeout(r, 150));
            update();
            this.container.classList.remove('page-exit');
            this.container.classList.add('page-enter');
            await new Promise(r => setTimeout(r, 150));
            this.container.classList.remove('page-enter');
        }
    },

    // Update active nav link
    updateActiveNav(page) {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${page}` || (page === 'hero' && href === '#hero')) {
                link.classList.add('active');
            }
        });
    },

    // Reinitialize components after page load
    reinitComponents() {
        // Re-observe cards for animation
        const cards = this.container.querySelectorAll('.card');
        cards.forEach(card => {
            if (typeof observer !== 'undefined') {
                observer.observe(card);
            }
            // Trigger visibility for already visible cards
            setTimeout(() => card.classList.add('visible'), 50);
        });

        // Reinitialize charts if on pages that have them
        if (typeof updateCharts === 'function') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                updateCharts();
            }, 100);
        }
    },

    // Preload pages for faster navigation
    preloadPages() {
        const pages = Object.values(this.routes);
        const uniquePages = [...new Set(pages)];
        uniquePages.forEach(page => {
            if (!this.cache.has(page)) {
                this.fetchPage(page).catch(() => {});
            }
        });
    }
};

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Router.init();

    // Preload other pages after initial load
    setTimeout(() => Router.preloadPages(), 1000);
});
