// src/utils/careerCalculator.js
import { buildBaselineCareerMetrics } from "../data/careerData";

const toFinite = (val, fallback) =>
  typeof val === "number" && Number.isFinite(val) ? val : fallback;

export function evaluateCityCareerViability(
  cityObj,
  careerProfile,
  equivalentGrossNeeded,
  liveOverrides = null,
) {
  const base = buildBaselineCareerMetrics(cityObj, careerProfile);

  const adz = liveOverrides?.adzuna || null;
  const cos = liveOverrides?.careerOneStop || null;
  const bls = liveOverrides?.bls || null;

  const roleMedianSalary = Math.max(
    1,
    Math.round(
      toFinite(
        cos?.roleMedianSalary ?? adz?.roleMedianSalary,
        base.roleMedianSalary,
      ),
    ),
  );
  const roleMedianHourly = Number((roleMedianSalary / 2080).toFixed(2));

  const activeVacancies = Math.max(
    0,
    Math.round(toFinite(adz?.activeVacancies, base.activeVacancies)),
  );
  const annualJobOpenings = Math.max(
    0,
    Math.round(toFinite(cos?.annualJobOpenings, base.annualJobOpenings)),
  );
  const totalMetroEmployment = Math.max(
    1,
    Math.round(toFinite(cos?.totalMetroEmployment, base.totalMetroEmployment)),
  );
  const unemploymentRate = Number(
    toFinite(cos?.unemploymentRate, base.unemploymentRate).toFixed(1),
  );
  const demandRatio = Number(
    toFinite(
      activeVacancies / Math.max(1, totalMetroEmployment / 100),
      base.demandRatio,
    ).toFixed(2),
  );

  const percentiles = {
    p10: Math.round(
      toFinite(cos?.percentiles?.p10, Math.round(roleMedianSalary * 0.63)),
    ),
    p25: Math.round(
      toFinite(cos?.percentiles?.p25, Math.round(roleMedianSalary * 0.79)),
    ),
    p50: roleMedianSalary,
    p75: Math.round(
      toFinite(cos?.percentiles?.p75, Math.round(roleMedianSalary * 1.24)),
    ),
    p90: Math.round(
      toFinite(cos?.percentiles?.p90, Math.round(roleMedianSalary * 1.54)),
    ),
  };

  const eqSalarySafe = Math.max(1, toFinite(equivalentGrossNeeded, 150000));
  const salaryCoverageRatio = roleMedianSalary / eqSalarySafe;
  const salaryCoveragePct = Number(
    Math.max(0, Math.min(999, Math.round(salaryCoverageRatio * 100))),
  );
  const salaryGapVsEquivalent = Math.round(roleMedianSalary - eqSalarySafe);

  const wagePts = Math.max(
    0,
    Math.min(45, Math.round(salaryCoverageRatio * 38)),
  );
  const unempPts = Math.max(
    0,
    Math.min(25, Math.round((8.0 - unemploymentRate) * 4.2)),
  );
  const demandScoreRaw =
    Math.log10(Math.max(10, activeVacancies)) * 9.5 +
    Math.min(10, demandRatio * 3.5);
  const demandPts = Math.max(
    0,
    Math.min(30, Math.round(toFinite(demandScoreRaw, 15))),
  );

  const viabilityScore = Math.max(
    5,
    Math.min(99, toFinite(wagePts + unempPts + demandPts, 60)),
  );

  let viabilityTier = "Moderate";
  let viabilityTone = "amber";
  if (viabilityScore >= 72) {
    viabilityTier = "Strong Viability";
    viabilityTone = "green";
  } else if (viabilityScore < 52) {
    viabilityTier = "Tight / High-Cost";
    viabilityTone = "red";
  }

  const adzunaLive = Boolean(adz);
  const cosLive = Boolean(cos);
  const blsLive = Boolean(bls);

  const sourcesActive = [
    adzunaLive ? adz.source : "Adzuna: No API Key (Est.)",
    cosLive ? cos.source : "CareerOneStop: No API Key (Est.)",
    blsLive ? bls.source : "BLS OEWS/LAUS: No API Key (Est.)",
  ];

  return {
    ...base,
    roleMedianSalary,
    roleMedianHourly,
    percentiles,
    totalMetroEmployment,
    annualJobOpenings,
    activeVacancies,
    demandRatio,
    unemploymentRate,
    topCompanies:
      Array.isArray(adz?.topCompanies) && adz.topCompanies.length > 0
        ? adz.topCompanies
        : base.topCompanies,
    salaryHistogram:
      Array.isArray(adz?.salaryHistogram) && adz.salaryHistogram.length > 0
        ? adz.salaryHistogram
        : base.salaryHistogram,
    historicalSalaryTrend:
      Array.isArray(adz?.historicalSalaryTrend) &&
      adz.historicalSalaryTrend.length > 0
        ? adz.historicalSalaryTrend
        : base.historicalSalaryTrend,
    skills:
      Array.isArray(cos?.skills) && cos.skills.length > 0
        ? cos.skills
        : base.skills,
    blsLiveSeries: bls,
    apiStatus: {
      adzunaLive,
      cosLive,
      blsLive,
      anyLive: adzunaLive || cosLive || blsLive,
      label:
        adzunaLive || cosLive || blsLive
          ? "Live API Data Active"
          : "No API Key Configured (Estimated Baseline)",
    },
    sourcesActive,
    viabilityScore,
    viabilityTier,
    viabilityTone,
    salaryCoveragePct,
    salaryGapVsEquivalent,
  };
}
