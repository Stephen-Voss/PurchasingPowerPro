// src/services/apiService.js
import { cacheService } from "./cacheService";

const STORAGE_KEY = "cost_tracker_api_keys";

export const getStoredApiKeys = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
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
      adzunaAppId: (
        saved.adzunaAppId ||
        (isDev ? import.meta.env.VITE_ADZUNA_APP_ID : "") ||
        ""
      ).trim(),
      adzunaAppKey: (
        saved.adzunaAppKey ||
        (isDev ? import.meta.env.VITE_ADZUNA_APP_KEY : "") ||
        ""
      ).trim(),
      careerOneStopUserId: (
        saved.careerOneStopUserId ||
        (isDev ? import.meta.env.VITE_CAREERONESTOP_USER_ID : "") ||
        ""
      ).trim(),
      careerOneStopToken: (
        saved.careerOneStopToken ||
        (isDev ? import.meta.env.VITE_CAREERONESTOP_TOKEN : "") ||
        ""
      ).trim(),
      blsApiKey: (
        saved.blsApiKey ||
        (isDev ? import.meta.env.VITE_BLS_API_KEY : "") ||
        ""
      ).trim(),
    };
  } catch {
    return {
      apverve: "",
      apininjas: "",
      bea: "",
      adzunaAppId: "",
      adzunaAppKey: "",
      careerOneStopUserId: "",
      careerOneStopToken: "",
      blsApiKey: "",
    };
  }
};

export const saveApiKeys = (keys) => {
  try {
    const cleaned = Object.fromEntries(
      Object.entries(keys || {}).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : v,
      ]),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
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
  return Boolean(
    keysObj.apverve ||
    keysObj.apininjas ||
    keysObj.bea ||
    (keysObj.adzunaAppId && keysObj.adzunaAppKey) ||
    (keysObj.careerOneStopUserId && keysObj.careerOneStopToken) ||
    keysObj.blsApiKey,
  );
};

/**
 * 1. Free Keyless U.S. Census Bureau ACS API for Dynamic Median Wages & Incomes by State
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
 * 5. Adzuna Job Aggregator API (Vacancies, Salary Histogram, Historical Trend, Top Companies)
 * Docs: https://developer.adzuna.com/docs/search
 */
export async function fetchAdzunaCareerData(
  cityObj,
  careerProfile,
  appId,
  appKey,
) {
  if (!appId || !appKey) return null;
  const countrySlug = cityObj.country === "GB" ? "gb" : "us";
  const whereQuery = cityObj.isInternational
    ? cityObj.city
    : `${cityObj.city}, ${cityObj.state}`;
  const cacheKey = `adzuna_${countrySlug}_${cityObj.id}_${careerProfile.id}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const baseParams = `app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(
    appKey,
  )}&what=${encodeURIComponent(careerProfile.title)}&where=${encodeURIComponent(whereQuery)}`;

  try {
    const [searchRes, histRes, trendRes, topCoRes] = await Promise.allSettled([
      fetch(
        `https://api.adzuna.com/v1/api/jobs/${countrySlug}/search/1?${baseParams}&results_per_page=10`,
      ),
      fetch(
        `https://api.adzuna.com/v1/api/jobs/${countrySlug}/histogram?${baseParams}`,
      ),
      fetch(
        `https://api.adzuna.com/v1/api/jobs/${countrySlug}/history?${baseParams}`,
      ),
      fetch(
        `https://api.adzuna.com/v1/api/jobs/${countrySlug}/top_companies?${baseParams}`,
      ),
    ]);

    const result = { source: "Adzuna Live API" };
    let hasAny = false;

    if (searchRes.status === "fulfilled" && searchRes.value.ok) {
      const sJson = await searchRes.value.json();
      if (typeof sJson.count === "number") {
        result.activeVacancies = sJson.count;
        hasAny = true;
      }
      if (typeof sJson.mean === "number" && sJson.mean > 0) {
        result.roleMedianSalary = Math.round(sJson.mean);
        hasAny = true;
      }
    }

    if (histRes.status === "fulfilled" && histRes.value.ok) {
      const hJson = await histRes.value.json();
      if (hJson?.histogram && typeof hJson.histogram === "object") {
        const sortedEntries = Object.entries(hJson.histogram)
          .map(([salaryKey, count]) => ({
            low: Number(salaryKey),
            high: Number(salaryKey) + 10000,
            rangeLabel: `$${Math.round(Number(salaryKey) / 1000)}k–$${Math.round(
              (Number(salaryKey) + 10000) / 1000,
            )}k`,
            jobCount: Number(count) || 0,
          }))
          .filter((b) => !Number.isNaN(b.low) && b.jobCount > 0)
          .slice(0, 8);
        if (sortedEntries.length > 0) {
          result.salaryHistogram = sortedEntries;
          hasAny = true;
        }
      }
    }

    if (trendRes.status === "fulfilled" && trendRes.value.ok) {
      const tJson = await trendRes.value.json();
      if (tJson?.month && typeof tJson.month === "object") {
        const points = Object.entries(tJson.month)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6)
          .map(([monthKey, avgSal]) => ({
            year: monthKey,
            medianSalary: Math.round(Number(avgSal) || 0),
          }))
          .filter((p) => p.medianSalary > 0);
        if (points.length > 0) {
          result.historicalSalaryTrend = points;
          hasAny = true;
        }
      }
    }

    if (topCoRes.status === "fulfilled" && topCoRes.value.ok) {
      const cJson = await topCoRes.value.json();
      if (cJson?.leaderboard && Array.isArray(cJson.leaderboard)) {
        result.topCompanies = cJson.leaderboard.slice(0, 5).map((item) => ({
          name: item?.canonical_name || item?.name || "Hiring Employer",
          openRoles: Number(item?.count) || 5,
        }));
        hasAny = true;
      }
    }

    if (!hasAny) return null;
    cacheService.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`Adzuna fallback for ${cityObj.city}:`, err.message);
    return null;
  }
}

/**
 * 6. CareerOneStop LMI API (Metro Employment, Openings, Wage Percentiles, Unemployment, Skills)
 * Docs: https://www.careeronestop.org/Developers/WebAPI/web-api.aspx
 */
export async function fetchCareerOneStopData(
  cityObj,
  careerProfile,
  userId,
  token,
) {
  if (!userId || !token || cityObj.isInternational) return null;
  const socClean = careerProfile.socCode.replace("-", "");
  const locationQuery = encodeURIComponent(`${cityObj.city}, ${cityObj.state}`);
  const cacheKey = `cos_lmi_${cityObj.id}_${socClean}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const [occRes, unempRes] = await Promise.allSettled([
      fetch(
        `https://api.careeronestop.org/v1/occupation/${encodeURIComponent(
          userId,
        )}/${socClean}/${locationQuery}?includeWage=true&includeProjection=true&includeSkills=true`,
        { headers },
      ),
      fetch(
        `https://api.careeronestop.org/v1/launemployment/${encodeURIComponent(
          userId,
        )}/${locationQuery}`,
        { headers },
      ),
    ]);

    const result = { source: "CareerOneStop Live API" };
    let hasAny = false;

    if (occRes.status === "fulfilled" && occRes.value.ok) {
      const oJson = await occRes.value.json();
      const occDetail = oJson?.OccupationDetail || oJson;
      const wageInfo =
        occDetail?.Wages?.NationalWagesList?.[0] || occDetail?.Wages || {};
      const projInfo = occDetail?.Projections || {};

      if (wageInfo.Pct50 || wageInfo.Median) {
        const med = Number(wageInfo.Pct50 || wageInfo.Median);
        if (med > 0) {
          result.roleMedianSalary = Math.round(med);
          result.percentiles = {
            p10: Math.round(Number(wageInfo.Pct10) || med * 0.63),
            p25: Math.round(Number(wageInfo.Pct25) || med * 0.79),
            p50: Math.round(med),
            p75: Math.round(Number(wageInfo.Pct75) || med * 1.24),
            p90: Math.round(Number(wageInfo.Pct90) || med * 1.54),
          };
          hasAny = true;
        }
      }
      if (projInfo.ProjectedEmployment || projInfo.Employment) {
        result.totalMetroEmployment = Number(
          projInfo.ProjectedEmployment || projInfo.Employment,
        );
        hasAny = true;
      }
      if (projInfo.AnnualOpenings || projInfo.Openings) {
        result.annualJobOpenings = Number(
          projInfo.AnnualOpenings || projInfo.Openings,
        );
        hasAny = true;
      }
      if (Array.isArray(occDetail?.Skills) && occDetail.Skills.length > 0) {
        result.skills = occDetail.Skills.slice(0, 6).map(
          (s) => s.SkillName || s.Title || String(s),
        );
        hasAny = true;
      }
    }

    if (unempRes.status === "fulfilled" && unempRes.value.ok) {
      const uJson = await unempRes.value.json();
      const rate = parseFloat(
        uJson?.UnemploymentRate ||
          uJson?.AreaData?.[0]?.UnemploymentRate ||
          uJson?.Rate,
      );
      if (!isNaN(rate) && rate > 0) {
        result.unemploymentRate = Number(rate.toFixed(1));
        hasAny = true;
      }
    }

    if (!hasAny) return null;
    cacheService.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`CareerOneStop fallback for ${cityObj.city}:`, err.message);
    return null;
  }
}

/**
 * 7. U.S. Bureau of Labor Statistics (BLS) Public Data API v2 (OEWS & LAUS Raw Time Series)
 * Docs: https://www.bls.gov/developers/
 */
export async function fetchBLSLaborTimeSeries(
  cityObj,
  careerProfile,
  blsApiKey,
  fallbackSeriesId,
) {
  if (cityObj.isInternational) return null;
  const cacheKey = `bls_oews_laus_${cityObj.id}_${careerProfile.socCode}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const seriesIds = [
      fallbackSeriesId,
      `LAUST${cityObj.censusStateFips || "29"}0000000000003`,
    ].filter(Boolean);

    const payload = {
      seriesid: seriesIds,
      startyear: "2022",
      endyear: "2026",
    };
    if (blsApiKey) {
      payload.registrationkey = blsApiKey;
    }

    const res = await fetch(
      "https://api.bls.gov/publicAPI/v2/timeseries/data/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) throw new Error(`BLS HTTP ${res.status}`);
    const json = await res.json();
    const seriesList = json?.Results?.series;
    if (Array.isArray(seriesList) && seriesList.length > 0) {
      const firstSeries = seriesList[0];
      const points = Array.isArray(firstSeries?.data)
        ? firstSeries.data.slice(0, 6).map((pt) => ({
            period: `${pt.year} ${pt.periodName || pt.period}`,
            rawValue: Number(pt.value),
            footnotes: (pt.footnotes || [])
              .map((f) => f.text)
              .filter(Boolean)
              .join("; "),
          }))
        : [];
      const out = {
        seriesId: firstSeries.seriesID,
        points,
        source: blsApiKey ? "BLS API v2 (Registered)" : "BLS Public API v2",
      };
      cacheService.set(cacheKey, out);
      return out;
    }
  } catch (err) {
    console.warn(`BLS API fallback for ${cityObj.city}:`, err.message);
  }
  return null;
}

/**
 * 8. OpenStreetMap Nominatim Geocoding (Keyless Public API)
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
