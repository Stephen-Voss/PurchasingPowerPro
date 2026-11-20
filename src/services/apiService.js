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
      rentcast: (
        saved.rentcast ||
        (isDev ? import.meta.env.VITE_RENTCAST_API_KEY : "") ||
        ""
      ).trim(),
      hudUserToken: (
        saved.hudUserToken ||
        (isDev ? import.meta.env.VITE_HUD_USER_TOKEN : "") ||
        ""
      ).trim(),
      censusApiKey: (
        saved.censusApiKey ||
        (isDev ? import.meta.env.VITE_CENSUS_API_KEY : "") ||
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
      rentcast: "",
      hudUserToken: "",
      censusApiKey: "",
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
    keysObj.blsApiKey ||
    keysObj.rentcast ||
    keysObj.hudUserToken ||
    keysObj.censusApiKey,
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
    )}®ion=${encodeURIComponent(
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
 * 5. Adzuna Job Aggregator API
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
 * 6. CareerOneStop LMI API
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
 * 7. U.S. Bureau of Labor Statistics (BLS) Public Data API v2 (OEWS & LAUS)
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
 * 8. RentCast API (/v1/markets) — Average/Median Rents by Bedroom, Home Sale Prices, DOM, Listings & Trends
 */
export async function fetchRentCastMarketData(cityObj, rentcastKey) {
  if (!rentcastKey || cityObj.isInternational) return null;
  const cacheKey = `rentcast_market_${cityObj.id}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.rentcast.io/v1/markets?city=${encodeURIComponent(
      cityObj.city,
    )}&state=${encodeURIComponent(cityObj.state)}&historyRange=6`;
    const res = await fetch(url, {
      headers: {
        "X-Api-Key": rentcastKey,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`RentCast HTTP ${res.status}`);
    const json = await res.json();
    const rental = json?.rentalData || json?.data?.rentalData || {};
    const sale = json?.saleData || json?.data?.saleData || {};

    const avgRentMonthly = Number(rental.averageRent || rental.medianRent);
    if (!Number.isFinite(avgRentMonthly) || avgRentMonthly <= 0) return null;

    const medianRentMonthly = Math.round(
      Number(rental.medianRent || avgRentMonthly * 0.96),
    );
    const avgHomeSalePrice = Math.round(
      Number(sale.averagePrice || sale.medianPrice || 0),
    );
    const medianHomeSalePrice = Math.round(
      Number(sale.medianPrice || avgHomeSalePrice * 0.94),
    );
    const daysOnMarket = Math.round(
      Number(rental.averageDaysOnMarket || sale.averageDaysOnMarket || 35),
    );
    const activeListingsCount = Math.round(
      Number(rental.totalListings || sale.totalListings || 0),
    );

    const byBed = Array.isArray(rental.dataByBedrooms)
      ? rental.dataByBedrooms
      : [];
    const findBedRent = (beds, mult) => {
      const match = byBed.find((b) => Number(b.bedrooms) === beds);
      const val = Number(match?.medianRent || match?.averageRent);
      return Number.isFinite(val) && val > 0
        ? Math.round(val)
        : Math.round(medianRentMonthly * mult);
    };

    const rentByBedroom = {
      studio: findBedRent(0, 0.75),
      br1: findBedRent(1, 0.85),
      br2: findBedRent(2, 1.0),
      br3: findBedRent(3, 1.28),
      br4: findBedRent(4, 1.54),
    };

    const histEntries =
      rental.history && typeof rental.history === "object"
        ? Object.entries(rental.history)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-5)
            .map(([period, stats]) => ({
              year: period,
              monthlyRent: Math.round(
                Number(
                  stats?.medianRent || stats?.averageRent || medianRentMonthly,
                ),
              ),
              homePrice: Math.round(
                Number(
                  sale.history?.[period]?.medianPrice || medianHomeSalePrice,
                ),
              ),
            }))
        : [];

    const out = {
      avgRentMonthly: Math.round(avgRentMonthly),
      medianRentMonthly,
      avgHomeSalePrice,
      medianHomeSalePrice,
      daysOnMarket,
      activeListingsCount,
      rentByBedroom,
      rentTrendHistory: histEntries.length > 0 ? histEntries : undefined,
      source: "RentCast Live API",
    };

    cacheService.set(cacheKey, out);
    return out;
  } catch (err) {
    console.warn(`RentCast fallback for ${cityObj.city}:`, err.message);
    return null;
  }
}

/**
 * 9. HUD User Fair Market Rents (FMR) & Income Limits API
 * Base: https://www.huduser.gov/hudapi/public/fmr/statedata/{statecode} & /il/statedata/{statecode}
 */
export async function fetchHudFairMarketRents(cityObj, hudBearerToken) {
  if (!hudBearerToken || cityObj.isInternational || !cityObj.state) return null;
  const stateCode = cityObj.state.toUpperCase();
  const cacheKey = `hud_fmr_il_${stateCode}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const headers = {
      Authorization: `Bearer ${hudBearerToken}`,
      Accept: "application/json",
    };
    const [fmrRes, ilRes] = await Promise.allSettled([
      fetch(
        `https://www.huduser.gov/hudapi/public/fmr/statedata/${encodeURIComponent(stateCode)}`,
        { headers },
      ),
      fetch(
        `https://www.huduser.gov/hudapi/public/il/statedata/${encodeURIComponent(stateCode)}`,
        { headers },
      ),
    ]);

    const out = { source: "HUD User Live API" };
    let hasAny = false;

    if (fmrRes.status === "fulfilled" && fmrRes.value.ok) {
      const fJson = await fmrRes.value.json();
      const list =
        fJson?.data?.metroareas ||
        fJson?.data?.counties ||
        (Array.isArray(fJson?.data) ? fJson.data : []);
      const cityLower = cityObj.city.toLowerCase();
      const matched =
        list.find((item) =>
          String(item.area_name || item.county_name || "")
            .toLowerCase()
            .includes(cityLower),
        ) || list[0];

      if (matched) {
        const br0 = Number(matched.Efficiency || matched.fmr_0 || 0);
        const br1 = Number(matched["One-Bedroom"] || matched.fmr_1 || 0);
        const br2 = Number(matched["Two-Bedroom"] || matched.fmr_2 || 0);
        const br3 = Number(matched["Three-Bedroom"] || matched.fmr_3 || 0);
        const br4 = Number(matched["Four-Bedroom"] || matched.fmr_4 || 0);

        if (br2 > 0) {
          out.hudFairMarketRents = {
            br0: br0 > 0 ? Math.round(br0) : Math.round(br2 * 0.74),
            br1: br1 > 0 ? Math.round(br1) : Math.round(br2 * 0.84),
            br2: Math.round(br2),
            br3: br3 > 0 ? Math.round(br3) : Math.round(br2 * 1.29),
            br4: br4 > 0 ? Math.round(br4) : Math.round(br2 * 1.52),
          };
          hasAny = true;
        }
      }
    }

    if (ilRes.status === "fulfilled" && ilRes.value.ok) {
      const iJson = await ilRes.value.json();
      const ilList =
        iJson?.data?.metroareas ||
        iJson?.data?.counties ||
        (Array.isArray(iJson?.data) ? iJson.data : []);
      const medianFam = Number(
        ilList?.[0]?.median_income || ilList?.[0]?.median4 || 0,
      );
      if (medianFam > 0) {
        out.medianFamilyIncomeLimit = Math.round(medianFam);
        hasAny = true;
      }
    }

    if (!hasAny) return null;
    cacheService.set(cacheKey, out);
    return out;
  } catch (err) {
    console.warn(`HUD User fallback for ${cityObj.state}:`, err.message);
    return null;
  }
}

/**
 * 10. U.S. Census Bureau ACS Housing Demographics API
 * Variables: B25064_001E (Median Gross Rent), B25077_001E (Median Home Value),
 * B25003_001E (Total Tenure), B25003_003E (Renter-Occupied),
 * B25002_002E (Occupied Units), B25002_003E (Vacant Units), B08013_001E (Aggregate Travel Time to Work)
 */
export async function fetchCensusHousingDemographics(cityObj, censusApiKey) {
  if (cityObj.isInternational || !cityObj.censusStateFips) return null;
  const cacheKey = `census_housing_${cityObj.censusStateFips}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const keyParam = censusApiKey
      ? `&key=${encodeURIComponent(censusApiKey)}`
      : "";
    const url = `https://api.census.gov/data/2022/acs/acs1?get=NAME,B25064_001E,B25077_001E,B25003_001E,B25003_003E,B25002_002E,B25002_003E,B08013_001E&for=state:${encodeURIComponent(
      cityObj.censusStateFips,
    )}${keyParam}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Census Housing HTTP ${res.status}`);
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 1) {
      const [
        ,
        grossRentRaw,
        homeValRaw,
        totalTenureRaw,
        renterRaw,
        occupiedRaw,
        vacantRaw,
      ] = rows[1];
      const grossRent = parseInt(grossRentRaw, 10);
      const homeVal = parseInt(homeValRaw, 10);
      const totalTenure = parseInt(totalTenureRaw, 10);
      const renterCount = parseInt(renterRaw, 10);
      const occupiedUnits = parseInt(occupiedRaw, 10);
      const vacantUnits = parseInt(vacantRaw, 10);

      const renterPct =
        totalTenure > 0 && !isNaN(renterCount)
          ? Number(((renterCount / totalTenure) * 100).toFixed(1))
          : null;
      const ownerPct =
        renterPct !== null ? Number((100 - renterPct).toFixed(1)) : null;
      const totalUnits = (occupiedUnits || 0) + (vacantUnits || 0);
      const vacancyPct =
        totalUnits > 0 && !isNaN(vacantUnits)
          ? Number(((vacantUnits / totalUnits) * 100).toFixed(1))
          : null;

      const out = {
        medianGrossRent:
          !isNaN(grossRent) && grossRent > 0 ? grossRent : undefined,
        medianHomeValue: !isNaN(homeVal) && homeVal > 0 ? homeVal : undefined,
        renterOccupancyPct: renterPct ?? undefined,
        ownerOccupancyPct: ownerPct ?? undefined,
        vacancyRatePct: vacancyPct ?? undefined,
        source: censusApiKey
          ? "Census ACS Housing API (Key)"
          : "Census ACS Housing API",
      };
      cacheService.set(cacheKey, out);
      return out;
    }
  } catch (err) {
    console.warn(`Census Housing fallback for ${cityObj.state}:`, err.message);
  }
  return null;
}

/**
 * 11. OpenStreetMap Nominatim Geocoding (Keyless Public API)
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

// Append/update in src/services/apiService.js

// Inside getStoredApiKeys():
// congressGovKey: (saved.congressGovKey || (isDev ? import.meta.env.VITE_CONGRESS_GOV_API_KEY : '') || '').trim(),
// openStatesKey: (saved.openStatesKey || (isDev ? import.meta.env.VITE_OPENSTATES_API_KEY : '') || '').trim(),
// legiscanKey: (saved.legiscanKey || (isDev ? import.meta.env.VITE_LEGISCAN_API_KEY : '') || '').trim(),

// Inside hasCustomApiKeys():
// || keysObj.congressGovKey || keysObj.openStatesKey || keysObj.legiscanKey

/**
 * 12. GovTrack / @unitedstates Bulk Roster Data (Keyless Open Source JSON)
 * Repo: https://github.com/unitedstates/congress-legislators
 */
export async function fetchUnitedStatesLegislatorsRoster() {
  const cacheKey = "unitedstates_congress_roster_v1";
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      "https://unitedstates.github.io/congress-legislators/legislators-current.json",
    );
    if (!res.ok) throw new Error(`@unitedstates roster HTTP ${res.status}`);
    const list = await res.json();
    if (Array.isArray(list) && list.length > 0) {
      cacheService.set(cacheKey, list);
      return list;
    }
  } catch (err) {
    console.warn("@unitedstates roster fallback:", err.message);
  }
  return null;
}

/**
 * 13. Congress.gov API v3 (Federal Bills & Roll-Call Context)
 * Docs: https://api.congress.gov/
 */
export async function fetchCongressBillsV3(congressGovKey, congressNum = 119) {
  if (!congressGovKey) return null;
  const cacheKey = `congress_gov_bills_${congressNum}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.congress.gov/v3/bill/${congressNum}?format=json&limit=10&api_key=${encodeURIComponent(
      congressGovKey,
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Congress.gov HTTP ${res.status}`);
    const json = await res.json();
    if (Array.isArray(json?.bills)) {
      cacheService.set(cacheKey, json.bills);
      return json.bills;
    }
  } catch (err) {
    console.warn("Congress.gov fallback:", err.message);
  }
  return null;
}

/**
 * 14. Open States API v3 (State Legislators, Governors & State Bills)
 * Docs: https://docs.openstates.org/api-v3/
 */
export async function fetchOpenStatesJurisdictionData(
  stateCode,
  openStatesKey,
) {
  if (!openStatesKey || !stateCode) return null;
  const jurisdiction = `ocd-jurisdiction/country:us/state:${stateCode.toLowerCase()}/government`;
  const cacheKey = `openstates_v3_${stateCode.toLowerCase()}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const headers = { "X-API-KEY": openStatesKey, Accept: "application/json" };
    const [peopleRes, billsRes] = await Promise.allSettled([
      fetch(
        `https://v3.openstates.org/people?jurisdiction=${encodeURIComponent(jurisdiction)}&per_page=25`,
        { headers },
      ),
      fetch(
        `https://v3.openstates.org/bills?jurisdiction=${encodeURIComponent(jurisdiction)}&per_page=15`,
        { headers },
      ),
    ]);

    const out = { source: "Open States v3 Live API" };
    if (peopleRes.status === "fulfilled" && peopleRes.value.ok) {
      const pJson = await peopleRes.value.json();
      out.people = Array.isArray(pJson?.results) ? pJson.results : [];
    }
    if (billsRes.status === "fulfilled" && billsRes.value.ok) {
      const bJson = await billsRes.value.json();
      out.bills = Array.isArray(bJson?.results) ? bJson.results : [];
    }
    cacheService.set(cacheKey, out);
    return out;
  } catch (err) {
    console.warn(`Open States v3 fallback for ${stateCode}:`, err.message);
    return null;
  }
}

/**
 * 15. LegiScan API (Federal + All 50 States Bills & Roll Calls)
 * Docs: https://legiscan.com/legiscan
 */
export async function fetchLegiScanBillDetail(billId, legiscanKey) {
  if (!legiscanKey || !billId) return null;
  const cacheKey = `legiscan_bill_${billId}`;
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.legiscan.com/?key=${encodeURIComponent(
      legiscanKey,
    )}&op=getBill&id=${encodeURIComponent(billId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LegiScan HTTP ${res.status}`);
    const json = await res.json();
    if (json?.status === "OK" && json?.bill) {
      cacheService.set(cacheKey, json.bill);
      return json.bill;
    }
  } catch (err) {
    console.warn(`LegiScan fallback for bill ${billId}:`, err.message);
  }
  return null;
}
