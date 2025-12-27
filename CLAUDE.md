# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A German-language personal finance education website ("PassivErtrag") built as a static SPA targeting Swiss users. Features interactive calculators, financial charts, and educational content about budgeting, investing, retirement planning, and more.

## Development

Run locally with Python:
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080

## Deployment

Pushes to `master` trigger automatic deployment via GitHub Actions:
1. CSS/JS/HTML are minified (csso, terser, html-minifier-terser)
2. Asset version query strings are updated with deploy timestamp
3. Files are deployed to production via rsync over SSH

Manual deployment: GitHub Actions > "Deploy to Webserver" > Run workflow

## Architecture

### SPA Router Pattern
The site uses a client-side hash-based router (`js/router.js`) that:
- Loads page HTML fragments from `pages/*.html` into `#content` container
- Caches fetched pages for performance
- Uses View Transitions API with CSS fallback
- Handles chart lifecycle (destroy before navigation, reinitialize after)

Navigation flow: `#hash` → `Router.loadPage()` → fetch `pages/{hash}.html` → inject into `#content`

### JavaScript Module Organization
Scripts load in order in `index.html` (no bundler):
1. `config.js` - Constants, Chart.js defaults, financial parameters
2. `calculations.js` - Financial math functions (compound interest, savings growth)
3. `storage.js` - localStorage persistence for user settings
4. `charts.js` - Chart.js chart creation/updates (lazy initialization)
5. `modal.js` - Settings modal logic
6. `router.js` - SPA navigation
7. `carCalculator.js` - Car cost calculator (standalone feature)
8. `app.js` - Main initialization, event handlers, global state

### CSS Organization
Modular CSS files loaded via separate `<link>` tags:
- `variables.css` - CSS custom properties (golden finance theme)
- `base.css`, `typography.css`, `layout.css` - Foundation styles
- `components/` - Buttons, cards, modal, sliders, tables
- `sections/` - Hero, chapters section-specific styles
- `router.css` - Page transition animations

### Global State
User settings (savingsRate, monthlySavings, currentAge) are:
- Stored in localStorage via `storage.js`
- Loaded into global variables in `app.js`
- Synchronized with charts via `updateCharts()`
- Configurable via settings modal

### Chart Lifecycle
Charts are lazily initialized by checking for canvas element existence:
- `destroyCharts()` called before page navigation
- `updateCharts()` called after page load to reinitialize
- Each chart has `initAndUpdate*Chart()` function that creates or updates

## Key Patterns

- All page content is in `pages/*.html` as HTML fragments (no `<html>`, `<head>`, `<body>`)
- Charts reference canvas by ID; if canvas doesn't exist on current page, chart init is skipped
- Bank-specific interest rates hardcoded in settings modal for Swiss banks
- Cache busting uses `?v=` query parameters, updated at deploy time
