# PurchasingPower Pro: Multi-City Cost of Living, Wage & Tax Tracker

An interactive React + Vite financial comparison platform that calculates **equivalent purchasing power salaries**, **federal/state/local/FICA tax burdens**, **custom 6-category household budgets**, and **minimum vs. median wages** across the **top 3 most populated cities in all 50 U.S. states (150 U.S. metros)** plus **London, UK** and custom international cities.

---

## Live Demo & Zero-Key Architecture (GitHub Pages Teaser)

This repository is pre-configured to run as a **100% client-side application on GitHub Pages with zero bundled API keys**:

1. **Built-in 2026 Economic & Tax Baseline**: Ships with state and metropolitan Regional Price Parity (RPP) indices across 6 expenditure categories (**Housing**, **Food & Groceries**, **Transportation**, **Utilities**, **Healthcare**, and **Miscellaneous**), 2026 U.S. Federal progressive tax brackets (`Single`, `Married Filing Jointly`, `Head of Household`), State and Local municipal wage tax schedules (e.g., NYC, Philadelphia, St. Louis), FICA (Social Security wage cap + Medicare surtaxes), and UK HMRC tax/NI bands.
2. **Keyless Live Public APIs**:
   - **U.S. Census Bureau ACS API** (`/data/2022/acs/acs1`): Fetches official state median earnings and household incomes dynamically with no API key required.
   - **OpenStreetMap Nominatim API**: Geocodes user-added international cities on the fly with no API key required.
3. **Bring Your Own Key (BYOK) Browser Overrides**: Users who want live metropolitan overrides from **APVerve Cost of Living API**, **API Ninjas Income Tax API**, or **BEA Regional Price Parities API** can open the in-app **BYOK APIs & Cache** drawer and paste their personal keys. Keys are stored exclusively in the user's browser `localStorage` and are never transmitted to any backend server.
4. **Persistent `localStorage` Caching**: All API responses are cached locally for 7 days with live cache hit/miss telemetry to protect free-tier rate limits.

---

## Core Features

- **Dual Financial Solver**:
  - **Equivalent Gross Salary Needed**: Uses a fast-converging binary/secant tax-and-COL solver to compute the exact gross salary required in any city to match the after-tax, after-401(k) purchasing power of your Base City salary (e.g., `$150,000` in `St. Louis, MO`).
  - **Fixed Salary Allocation & Net Leftover**: Shows where a fixed salary (e.g., `$150,000`) goes in each city across taxes and 6 budget categories, plus how much discretionary income is left over.
- **Interactive Tax Implications Inspector**: Click any city's **Taxes** cell in the table to open a diagnostic modal with a marginal bracket waterfall, component tax bar chart (vs. Base City), and automated insights explaining where tax implications hit hardest.
- **Zero-Lag 6-Category Budget & Tax Controls**: Hidden by default behind a compact Material Design 3 summary chip bar; expands to offer instant 60fps sliders for **Housing**, **Food**, **Transportation**, **Utilities**, **Healthcare**, and **Misc**, plus **Filing Status**, **Household Size**, **Dependent Tax Credits**, and **Pre-Tax 401(k)/HSA Deductions**.
- **Collapsible Multi-Category Data Table**: Collapses the 6 budget categories into a single **Total COL Basket** column with an inline mini stacked bar by default, and expands into 6 individual sortable category columns on click.
- **Chart.js & OpenStreetMap Toggle**: Switch seamlessly between a stacked Chart.js visualization and an interactive Leaflet / OpenStreetMap geospatial view.

---

## Local Development Setup

### Prerequisites

- **Node.js** `v18+` and **npm**

### Installation & Run

```bash
# 1. Clone the repository
git clone [https://github.com/YOUR_USERNAME/YOUR_REPO.git](https://github.com/YOUR_USERNAME/YOUR_REPO.git)
cd YOUR_REPO

# 2. Install dependencies
npm install

# 3. Start the local Vite development server
npm run dev
```

### Optional Local `.env` Configuration

For local development, you can either enter API keys in the UI drawer (`BYOK APIs & Cache`) or create an untracked `.env` file in the project root:

```env
VITE_APVERVE_API_KEY=your_apiverve_api_key_here
VITE_APININJAS_API_KEY=your_apininjas_api_key_here
VITE_BEA_API_KEY=your_bea_userid_key_here
```

_(Note: `.env` is listed in `.gitignore` and will never be committed.)_

---

## Deploying to GitHub Pages

This project uses `base: './'` in `vite.config.js` and the `gh-pages` package so you can deploy updates in one command:

```bash
npm run deploy
```

This runs `vite build` and pushes the production `dist/` folder to the `gh-pages` branch. In your GitHub repository, navigate to **Settings → Pages** and set the source branch to **`gh-pages` / `(root)`**.

---

## Project Structure

```text
├── src/
│   ├── components/
│   │   ├── CityTable.jsx            # Sortable table with collapsible 6-category budget columns & card mode
│   │   ├── TaxAndBudgetControls.jsx # 60fps debounced budget sliders & household tax profile controls
│   │   ├── TaxBreakdownModal.jsx    # Clickable per-city marginal tax waterfall & diagnostic modal
│   │   └── VisualizationViews.jsx   # Chart.js stacked bar/line chart & OpenStreetMap Leaflet view
│   ├── data/
│   │   └── citiesData.js            # 150 US cities (Top 3 per state) + London + international presets
│   ├── services/
│   │   ├── apiService.js            # Keyless US Census ACS, Nominatim, plus BYOK APVerve/API Ninjas/BEA
│   │   └── cacheService.js          # 7-day localStorage caching layer with hit/miss telemetry
│   ├── utils/
│   │   └── costCalculator.js        # Progressive Federal/State/Local/FICA/UK tax & COL solver
│   ├── App.jsx                      # Main Material Design 3 application controller
│   ├── App.css                      # Responsive M3 dark theme & isolated table scroll styles
│   └── index.css                    # Viewport reset preventing horizontal page overflow
├── vite.config.js                   # Relative base ('./') config for GitHub Pages
└── package.json
```

---

## Contributing & Extending

1. **Adding New Default Cities or Municipal Wage Ordinances**: Edit `RAW_STATE_CITIES` or `CITY_OVERRIDES` in `src/data/citiesData.js`.
2. **Updating Annual Tax Brackets**: Modify `US_STANDARD_DEDUCTIONS` and `US_FEDERAL_BRACKETS` in `src/utils/costCalculator.js`.
3. **Submitting Pull Requests**: Fork the repo, create a feature branch (`git checkout -b feature/my-enhancement`), verify `npm run build` succeeds with zero warnings, and open a Pull Request.
