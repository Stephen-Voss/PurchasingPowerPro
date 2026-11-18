// src/services/apiService.js
import { cacheService } from "./cacheService";

const STORAGE_KEY = "cost_tracker_api_keys";

export const getStoredApiKeys = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    // Only read import.meta.env in local development; public GitHub Pages builds use browser localStorage only
    const isDev = import.meta.env.DEV;
    return {
      apverve: (
        saved.apverve ||
        (isDev ? import.meta.env.VITE_APVERVE_API_KEY : "") ||
        ""
      ).trim(),
      apininjas: (
        saved.apininjas ||
        (isDev ? import.meta.env.VITE_APININJAS_API_KEY : "") ||
        ""
      ).trim(),
      bea: (
        saved.bea ||
        (isDev ? import.meta.env.VITE_BEA_API_KEY : "") ||
        ""
      ).trim(),
    };
  } catch {
    return { apverve: "", apininjas: "", bea: "" };
  }
};

export const saveApiKeys = (keys) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        apverve: (keys.apverve || "").trim(),
        apininjas: (keys.apininjas || "").trim(),
        bea: (keys.bea || "").trim(),
      }),
    );
  } catch (err) {
    console.warn("Unable to save API keys to localStorage:", err);
  }
};

export const clearStoredApiKeys = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const hasCustomApiKeys = (keysObj) => {
  if (!keysObj) return false;
  return Boolean(keysObj.apverve || keysObj.apininjas || keysObj.bea);
};

/**
 * 1. Free Keyless U.S. Census Bureau ACS API for Dynamic Median Wages & Incomes by State
 * Works on GitHub Pages with zero API key required and caches in localStorage.
 */
export async function fetchLiveCensusWagesByState() {
  const cacheKey = "census_acs_state_wages_v2";
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url =
      "https://api.census.gov/data/2022/acs/acs1?get=NAME,B20017_001E,B19013_001E&for=state:*";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Census ACS HTTP ${res.status}`);
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 1) {
      const fipsMap = {};
      for (let i = 1; i < rows.length; i++) {
        const [, medianEarningsRaw, medianHouseholdRaw, stateFips] = rows[i];
        const earnings = parseInt(medianEarningsRaw, 10);
        const household = parseInt(medianHouseholdRaw, 10);
        if (!isNaN(earnings) && earnings > 0) {
          fipsMap[stateFips] = {
            medianEarnings: Math.round(earnings * 1.085),
            medianHousehold: !isNaN(household)
              ? Math.round(household * 1.085)
              : null,
            source: "US Census ACS Live API",
          };
        }
      }
      cacheService.set(cacheKey, fipsMap);
      return fipsMap;
    }
  } catch (err) {
    console.warn("Census ACS API fallback to embedded baseline:", err.message);
  }
  return null;
}

/**
 * 2. APVerve Cost of Living API (Optional BYOK Override)
 */
export async function fetchAPVerveColIndex(cityObj, apiKey) {
  if (!apiKey || cityObj.isInternational) return null;
  const queryLocation = `${cityObj.city}, ${cityObj.state}`;
  const cacheKey = `apverve_col6_${cityObj.id}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.apiverve.com/v1/costliving?location=${encodeURIComponent(queryLocation)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`APVerve HTTP ${response.status}`);
    const json = await response.json();
    const costIndex = json?.data?.costIndex || json?.costIndex;
    if (typeof costIndex === "number" && costIndex > 0) {
      const ratio = costIndex / cityObj.indices.overall;
      const enriched = {
        overall: Number(costIndex.toFixed(1)),
        housing: Number((cityObj.indices.housing * ratio).toFixed(1)),
        food: Number((cityObj.indices.food * ratio).toFixed(1)),
        transportation: Number(
          (cityObj.indices.transportation * ratio).toFixed(1),
        ),
        utilities: Number((cityObj.indices.utilities * ratio).toFixed(1)),
        healthcare: Number((cityObj.indices.healthcare * ratio).toFixed(1)),
        misc: Number((cityObj.indices.misc * ratio).toFixed(1)),
        source: "APVerve Live",
      };
      cacheService.set(cacheKey, enriched);
      return enriched;
    }
  } catch (err) {
    console.warn(`APVerve fallback for ${queryLocation}:`, err.message);
  }
  return null;
}

/**
 * 3. Bureau of Economic Analysis (BEA) Regional Price Parities API (Optional BYOK Override)
 */
export async function fetchBEARegionalParity(cityObj, beaKey) {
  if (!beaKey || !cityObj.beaFips || cityObj.isInternational) return null;
  const cacheKey = `bea_rpp_${cityObj.state}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://apps.bea.gov/api/data/?UserID=${encodeURIComponent(
      beaKey,
    )}&method=GetData&datasetname=Regional&TableName=SARPP&LineCode=1&GeoFips=${
      cityObj.beaFips
    }&Year=LAST1&ResultFormat=JSON`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`BEA HTTP ${res.status}`);
    const json = await res.json();
    const dataRows = json?.BEAAPI?.Results?.Data;
    if (Array.isArray(dataRows) && dataRows.length > 0) {
      const val = parseFloat(dataRows[dataRows.length - 1].DataValue);
      if (!isNaN(val) && val > 0) {
        const result = { stateRpp: val, source: "BEA RPP API" };
        cacheService.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn(`BEA RPP fallback for ${cityObj.state}:`, err.message);
  }
  return null;
}

/**
 * 4. API Ninjas Income Tax Calculator API (Optional BYOK Override)
 */
export async function fetchAPINinjasTax(
  cityObj,
  grossIncome,
  filingStatus,
  apiNinjasKey,
) {
  if (!apiNinjasKey || !["US", "CA"].includes(cityObj.country)) return null;
  const roundedIncome = Math.round(grossIncome / 500) * 500;
  const apiFiling =
    filingStatus === "married"
      ? "married"
      : filingStatus === "hoh"
        ? "head_of_household"
        : "single";
  const cacheKey = `apininjas_tax_${cityObj.country}_${cityObj.state}_${roundedIncome}_${apiFiling}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.api-ninjas.com/v1/incometaxcalculator?country=${encodeURIComponent(
      cityObj.country,
    )}&region=${encodeURIComponent(
      cityObj.state,
    )}&income=${roundedIncome}&filing_status=${apiFiling}`;
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiNinjasKey },
    });
    if (!res.ok) throw new Error(`API Ninjas HTTP ${res.status}`);
    const data = await res.json();
    if (data && typeof data.federal_taxes_owed === "number") {
      const result = {
        federalTax: data.federal_taxes_owed,
        stateTax:
          typeof data.region_taxes_owed === "number"
            ? data.region_taxes_owed
            : null,
        ficaTax: typeof data.fica_total === "number" ? data.fica_total : null,
        source: "API Ninjas Live",
      };
      cacheService.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn(`API Ninjas fallback for ${cityObj.state}:`, err.message);
  }
  return null;
}

/**
 * 5. OpenStreetMap Nominatim Geocoding (Keyless Public API)
 */
export async function geocodeCityNominatim(cityName, countryName) {
  const query = `${cityName}, ${countryName}`;
  const cacheKey = `nominatim_${query.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en-US,en" },
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
      cacheService.set(cacheKey, coords);
      return coords;
    }
  } catch (err) {
    console.warn("Nominatim geocoding fallback:", err.message);
  }
  return { lat: 48.8566, lng: 2.3522 };
}
