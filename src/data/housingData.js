// src/data/housingData.js

const safeNum = (val, fallback) =>
  typeof val === "number" && Number.isFinite(val) ? val : fallback;

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Generates baseline housing metrics (HUD FMR 0-4BR, RentCast market stats,
 * and Census ACS housing/tenure/vacancy/commute metrics) with clear
 * "No API Key Configured" indicators until live keys are synced.
 */
export function buildBaselineHousingMetrics(
  cityObj,
  careerRoleMedianSalary = 95000,
) {
  const safeCity = cityObj || {};
  const seed = hashSeed(`housing_${safeCity.id || "city"}`);

  const housingIdx = safeNum(safeCity.indices?.housing, 100);
  const metroMult = safeNum(safeCity.metroMultiplier, 1.0);
  const overallIdx = safeNum(safeCity.indices?.overall, 100);

  // Baseline 2-Bedroom monthly Fair Market Rent (FMR) anchored around ~$1,380/mo at index 100
  const fmr2BrMonthly = Math.max(
    750,
    Math.round((1380 * (housingIdx / 100)) / 10) * 10,
  );

  const hudFairMarketRents = {
    br0: Math.round(fmr2BrMonthly * 0.74),
    br1: Math.round(fmr2BrMonthly * 0.84),
    br2: fmr2BrMonthly,
    br3: Math.round(fmr2BrMonthly * 1.29),
    br4: Math.round(fmr2BrMonthly * 1.52),
  };

  const medianFamilyIncomeLimit = Math.max(
    55000,
    Math.round((88000 * (0.75 + (overallIdx / 100) * 0.35)) / 500) * 500,
  );

  const safeRolePay = Math.max(24000, safeNum(careerRoleMedianSalary, 95000));
  const annualFmr2Br = fmr2BrMonthly * 12;
  const rentToIncomeRatioPct = Number(
    ((annualFmr2Br / safeRolePay) * 100).toFixed(1),
  );

  // RentCast market metrics baseline
  const avgRentMonthly = Math.round(
    fmr2BrMonthly * (1.04 + ((seed % 11) - 5) * 0.01),
  );
  const medianRentMonthly = Math.round(avgRentMonthly * 0.96);
  const avgHomeSalePrice = Math.max(
    145000,
    Math.round((335000 * Math.pow(housingIdx / 100, 1.25)) / 1000) * 1000,
  );
  const medianHomeSalePrice = Math.round(avgHomeSalePrice * 0.94);
  const daysOnMarket = Math.max(
    14,
    Math.min(
      95,
      Math.round(38 + ((seed % 27) - 10) * (1.15 - (metroMult - 1) * 0.3)),
    ),
  );
  const activeListingsCount = Math.max(
    120,
    Math.round(1450 * metroMult * (safeCity.popRankInState === 1 ? 1.5 : 0.7)),
  );

  const rentByBedroom = {
    studio: Math.round(medianRentMonthly * 0.75),
    br1: Math.round(medianRentMonthly * 0.85),
    br2: medianRentMonthly,
    br3: Math.round(medianRentMonthly * 1.28),
    br4: Math.round(medianRentMonthly * 1.54),
  };

  const rentTrendHistory = ["2022", "2023", "2024", "2025", "2026"].map(
    (yr, idx) => ({
      year: yr,
      monthlyRent: Math.round(medianRentMonthly * Math.pow(1.034, idx - 4)),
      homePrice: Math.round(medianHomeSalePrice * Math.pow(1.042, idx - 4)),
    }),
  );

  // U.S. Census ACS Housing Demographics (B25064, B25077, B25003, B25002, B08013/commute)
  const medianGrossRent = Math.round(fmr2BrMonthly * 0.97);
  const medianHomeValue = Math.round(medianHomeSalePrice * 0.92);
  const renterOccupancyPct = Number(
    Math.max(
      24,
      Math.min(72, 43 + (metroMult - 1) * 35 + ((seed % 9) - 4)),
    ).toFixed(1),
  );
  const ownerOccupancyPct = Number((100 - renterOccupancyPct).toFixed(1));
  const vacancyRatePct = Number(
    Math.max(2.4, Math.min(12.5, 5.8 + ((seed % 15) - 7) * 0.35)).toFixed(1),
  );
  const medianCommuteMins = Math.max(
    16,
    Math.min(46, Math.round(25 + (metroMult - 1) * 22 + ((seed % 7) - 3))),
  );

  return {
    hudFairMarketRents,
    medianFamilyIncomeLimit,
    annualFmr2Br,
    rentToIncomeRatioPct,
    rentcast: {
      avgRentMonthly,
      medianRentMonthly,
      avgHomeSalePrice,
      medianHomeSalePrice,
      daysOnMarket,
      activeListingsCount,
      rentByBedroom,
      rentTrendHistory,
    },
    censusHousing: {
      medianGrossRent,
      medianHomeValue,
      renterOccupancyPct,
      ownerOccupancyPct,
      vacancyRatePct,
      medianCommuteMins,
    },
    apiStatus: {
      rentcastLive: false,
      hudLive: false,
      censusLive: false,
      anyLive: false,
      label: "No Housing API Key Configured — Showing Calibrated Baseline",
    },
    sourcesActive: [
      "RentCast: No API Key (Est.)",
      "HUD FMR: No API Key (Est.)",
      "Census ACS Housing: No API Key (Est.)",
    ],
  };
}
