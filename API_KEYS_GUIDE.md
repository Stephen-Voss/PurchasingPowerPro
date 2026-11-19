# API Keys Retrieval Guide — PurchasingPower Pro

PurchasingPower Pro works out of the box on GitHub Pages with **zero API keys required** using embedded 2026 BEA Regional Price Parities (RPP), progressive U.S./UK tax tables, career labor baselines, and keyless public endpoints (**U.S. Census Bureau ACS** and **OpenStreetMap Nominatim**).

If you want to connect live data from **APVerve**, **API Ninjas**, **BEA**, **Adzuna**, **CareerOneStop**, or **BLS**, follow the steps below to obtain your own keys. Never commit API keys to Git—paste them into the in-app **BYOK APIs & Cache** drawer (stored locally in your browser's `localStorage`) or into a local `.env` file listed in `.gitignore`.

---

## 1. Keyless Public APIs (No Key Required)

### U.S. Census Bureau American Community Survey (ACS) API

- **Purpose**: Dynamic state-level median earnings (`B20017_001E`) and median household income (`B19013_001E`).
- **Key Required?**: **No** (public endpoints work without a token; optional free keys are available at `https://api.census.gov/data/key_signup.html` for high-volume scripts).

### OpenStreetMap Nominatim Geocoding API

- **Purpose**: Geocodes custom international cities added in the **+ International City** modal.
- **Key Required?**: **No**. Please respect Nominatim's usage guidelines (reasonable request volume; results are cached in `localStorage` for 7 days).

---

## 2. Cost of Living & Regional Price Parity APIs

### APVerve Cost of Living API

- **Official Developer Portal**: `https://apiverve.com` (Cost of Living API `/v1/costliving`)
- **How to Retrieve Your Key**:
  1. Create a free account on **APVerve** (`https://apiverve.com`).
  2. Open your **Dashboard / API Keys** section.
  3. Copy your `x-api-key` value.
- **App / `.env` Variable**:
  - UI Field: **APVerve Key (Cost of Living)**
  - `.env` Key: `VITE_APVERVE_API_KEY`

### Bureau of Economic Analysis (BEA) Regional Price Parities (RPP) API

- **Official Developer Portal**: `https://apps.bea.gov/api/signup/`
- **How to Retrieve Your Key**:
  1. Visit `https://apps.bea.gov/api/signup/`.
  2. Fill out your name, organization type, and email address, then submit the form.
  3. Check your email inbox for your **36-character BEA UserID** and activate it via the link in the message.
- **App / `.env` Variable**:
  - UI Field: **BEA UserID Key (Regional Parities)**
  - `.env` Key: `VITE_BEA_API_KEY`

---

## 3. Income Tax API

### API Ninjas Income Tax Calculator API

- **Official Developer Portal**: `https://api-ninjas.com` (Income Tax Calculator API)
- **How to Retrieve Your Key**:
  1. Sign up for a free account at `https://api-ninjas.com/register`.
  2. Go to **My Account / API Key** in your dashboard.
  3. Copy your `X-Api-Key`.
- **App / `.env` Variable**:
  - UI Field: **API Ninjas Key (Income Tax)**
  - `.env` Key: `VITE_APININJAS_API_KEY`

---

## 4. Job Aggregator & Official Labor Market APIs

### Adzuna Job Search & Market Intelligence API

- **Official Developer Portal**: `https://developer.adzuna.com/`
- **How to Retrieve Your Keys**:
  1. Go to `https://developer.adzuna.com/` and sign in or register for an API account.
  2. Create a new application in the Adzuna Developer Dashboard.
  3. Copy both your **`app_id`** and **`app_key`** (both are required for Adzuna search, histogram, history, and top-companies endpoints).
- **App / `.env` Variables**:
  - UI Fields: **Adzuna App ID** & **Adzuna App Key**
  - `.env` Keys: `VITE_ADZUNA_APP_ID` and `VITE_ADZUNA_APP_KEY`

### CareerOneStop Web API (U.S. Department of Labor)

- **Official Developer Portal**: `https://www.careeronestop.org/Developers/WebAPI/web-api.aspx`
- **How to Retrieve Your Credentials**:
  1. Visit `https://www.careeronestop.org/Developers/WebAPI/web-api.aspx` and select **Request API Access / Sign Up**.
  2. Complete the developer registration form to receive your **User ID** and **API Token** (Bearer token) for Occupation, Wage, Projection, Skills, and Unemployment endpoints.
- **App / `.env` Variables**:
  - UI Fields: **CareerOneStop User ID** & **CareerOneStop API Token**
  - `.env` Keys: `VITE_CAREERONESTOP_USER_ID` and `VITE_CAREERONESTOP_TOKEN`

### U.S. Bureau of Labor Statistics (BLS) Public Data API v2

- **Official Developer Portal**: `https://data.bls.gov/registrationEngine/` (Docs: `https://www.bls.gov/developers/`)
- **How to Retrieve Your Key**:
  1. Navigate to `https://data.bls.gov/registrationEngine/`.
  2. Enter your email address and accept the BLS data terms.
  3. Click the activation link sent to your email to receive your **BLS Registration Key** for higher daily query limits and multi-year OEWS/LAUS time series access.
- **App / `.env` Variable**:
  - UI Field: **BLS API v2 Key (OEWS & LAUS)**
  - `.env` Key: `VITE_BLS_API_KEY`

---

## Security Reminder for GitHub Pages

- Keep your local `.env` file untracked (already included in `.gitignore`).
- On public GitHub Pages deployments, visitors can optionally paste their own keys into the **BYOK APIs & Cache** drawer, which writes only to that visitor's local browser storage.
