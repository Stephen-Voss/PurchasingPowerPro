// src/utils/housingCalculator.js
import { buildBaselineHousingMetrics } from "../data/housingData";

const safeNum = (val, fallback) =>
  typeof val === "number" && Number.isFinite(val) ? val : fallback;

/**
 * Evaluates housing market details and checks whether the user's housing budget
 * allocation (housingSpend) is below what the city requires based on HUD FMR & market rents.
 */
export function evaluateCityHousingMetrics(
  cityObj,
  allocatedHousingSpend,
  householdSize = 1,
  careerRoleMedianSalary = 95000,
  liveHousingOverrides = null,
) {
  const base = buildBaselineHousingMetrics(cityObj, careerRoleMedianSalary);

  const rc = liveHousingOverrides?.rentcast || null;
  const hud = liveHousingOverrides?.hud || null;
  const cen = liveHousingOverrides?.census || null;

  const hudFairMarketRents = {
    br0: Math.round(
      safeNum(hud?.hudFairMarketRents?.br0, base.hudFairMarketRents.br0),
    ),
    br1: Math.round(
      safeNum(hud?.hudFairMarketRents?.br1, base.hudFairMarketRents.br1),
    ),
    br2: Math.round(
      safeNum(hud?.hudFairMarketRents?.br2, base.hudFairMarketRents.br2),
    ),
    br3: Math.round(
      safeNum(hud?.hudFairMarketRents?.br3, base.hudFairMarketRents.br3),
    ),
    br4: Math.round(
      safeNum(hud?.hudFairMarketRents?.br4, base.hudFairMarketRents.br4),
    ),
  };

  // Pick bedroom FMR benchmark based on household size
  const hh = Math.max(1, safeNum(householdSize, 1));
  const recommendedMonthlyFmr =
    hh <= 1
      ? hudFairMarketRents.br1
      : hh === 2
        ? hudFairMarketRents.br2
        : hh <= 4
          ? hudFairMarketRents.br3
          : hudFairMarketRents.br4;

  const recommendedAnnualHousingBenchmark = recommendedMonthlyFmr * 12;
  const annualFmr2Br = hudFairMarketRents.br2 * 12;
  const safeRolePay = Math.max(24000, safeNum(careerRoleMedianSalary, 95000));
  const rentToIncomeRatioPct = Number(
    ((annualFmr2Br / safeRolePay) * 100).toFixed(1),
  );

  const medianRentMonthly = Math.round(
    safeNum(rc?.medianRentMonthly, base.rentcast.medianRentMonthly),
  );
  const avgRentMonthly = Math.round(
    safeNum(rc?.avgRentMonthly, base.rentcast.avgRentMonthly),
  );
  const avgHomeSalePrice = Math.round(
    safeNum(rc?.avgHomeSalePrice, base.rentcast.avgHomeSalePrice),
  );
  const medianHomeSalePrice = Math.round(
    safeNum(rc?.medianHomeSalePrice, base.rentcast.medianHomeSalePrice),
  );
  const daysOnMarket = Math.round(
    safeNum(rc?.daysOnMarket, base.rentcast.daysOnMarket),
  );
  const activeListingsCount = Math.round(
    safeNum(rc?.activeListingsCount, base.rentcast.activeListingsCount),
  );

  const rentcast = {
    avgRentMonthly,
    medianRentMonthly,
    avgHomeSalePrice,
    medianHomeSalePrice,
    daysOnMarket,
    activeListingsCount,
    rentByBedroom: rc?.rentByBedroom || base.rentcast.rentByBedroom,
    rentTrendHistory: rc?.rentTrendHistory || base.rentcast.rentTrendHistory,
  };

  const censusHousing = {
    medianGrossRent: Math.round(
      safeNum(cen?.medianGrossRent, base.censusHousing.medianGrossRent),
    ),
    medianHomeValue: Math.round(
      safeNum(cen?.medianHomeValue, base.censusHousing.medianHomeValue),
    ),
    renterOccupancyPct: Number(
      safeNum(
        cen?.renterOccupancyPct,
        base.censusHousing.renterOccupancyPct,
      ).toFixed(1),
    ),
    ownerOccupancyPct: Number(
      safeNum(
        cen?.ownerOccupancyPct,
        base.censusHousing.ownerOccupancyPct,
      ).toFixed(1),
    ),
    vacancyRatePct: Number(
      safeNum(cen?.vacancyRatePct, base.censusHousing.vacancyRatePct).toFixed(
        1,
      ),
    ),
    medianCommuteMins: Math.round(
      safeNum(cen?.medianCommuteMins, base.censusHousing.medianCommuteMins),
    ),
  };

  // Compare user's annual housing budget against HUD FMR benchmark (with 5% tolerance)
  const userHousingSpend = Math.max(0, safeNum(allocatedHousingSpend, 0));
  const housingShortfallAnnual = Math.round(
    recommendedAnnualHousingBenchmark - userHousingSpend,
  );
  const isHousingUnderBudget =
    userHousingSpend < recommendedAnnualHousingBenchmark * 0.95;

  const rentcastLive = Boolean(rc);
  const hudLive = Boolean(hud);
  const censusLive = Boolean(cen);

  return {
    ...base,
    hudFairMarketRents,
    medianFamilyIncomeLimit: Math.round(
      safeNum(hud?.medianFamilyIncomeLimit, base.medianFamilyIncomeLimit),
    ),
    recommendedMonthlyFmr,
    recommendedAnnualHousingBenchmark,
    annualFmr2Br,
    rentToIncomeRatioPct,
    userHousingSpend,
    housingShortfallAnnual,
    isHousingUnderBudget,
    rentcast,
    censusHousing,
    apiStatus: {
      rentcastLive,
      hudLive,
      censusLive,
      anyLive: rentcastLive || hudLive || censusLive,
      label:
        rentcastLive || hudLive || censusLive
          ? "Live Housing APIs Active"
          : "No Housing API Key Configured (Estimated Baseline)",
    },
    sourcesActive: [
      rentcastLive ? rc.source : "RentCast: No API Key (Est.)",
      hudLive ? hud.source : "HUD FMR: No API Key (Est.)",
      censusLive ? cen.source : "Census ACS Housing: No API Key (Est.)",
    ],
  };
}
