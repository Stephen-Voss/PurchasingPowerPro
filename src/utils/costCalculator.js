// src/utils/costCalculator.js

export const US_STANDARD_DEDUCTIONS = {
  single: 15000,
  married: 30000,
  hoh: 22500,
};

export const US_FEDERAL_BRACKETS = {
  single: [
    { min: 0, max: 11925, rate: 0.1 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 23850, rate: 0.1 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { min: 0, max: 17000, rate: 0.1 },
    { min: 17000, max: 64850, rate: 0.12 },
    { min: 64850, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250500, rate: 0.32 },
    { min: 250500, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
};

const SS_WAGE_CAP = 176100;

export const DEFAULT_TAX_PROFILE = {
  filingStatus: "single",
  householdSize: 1,
  dependents: 0,
  preTaxRetirementPct: 6,
  baseConsumptionRatePct: 68,
};

export const DEFAULT_BUDGET_WEIGHTS = {
  housing: 34,
  food: 16,
  transportation: 15,
  utilities: 9,
  healthcare: 11,
  misc: 15,
};

export function normalizeBudgetWeights(rawWeights) {
  const total =
    Number(rawWeights.housing || 0) +
    Number(rawWeights.food || 0) +
    Number(rawWeights.transportation || 0) +
    Number(rawWeights.utilities || 0) +
    Number(rawWeights.healthcare || 0) +
    Number(rawWeights.misc || 0);

  if (total <= 0) {
    return {
      housing: 0.34,
      food: 0.16,
      transportation: 0.15,
      utilities: 0.09,
      healthcare: 0.11,
      misc: 0.15,
    };
  }

  return {
    housing: Number(rawWeights.housing) / total,
    food: Number(rawWeights.food) / total,
    transportation: Number(rawWeights.transportation) / total,
    utilities: Number(rawWeights.utilities) / total,
    healthcare: Number(rawWeights.healthcare) / total,
    misc: Number(rawWeights.misc) / total,
  };
}

export function calculateTaxes(
  grossIncome,
  cityObj,
  taxProfile = DEFAULT_TAX_PROFILE,
  liveTaxOverride = null,
  skipDetailedBreakdown = false,
) {
  if (grossIncome <= 0) {
    return {
      grossIncome: 0,
      preTaxDeductions: 0,
      standardDeduction: 0,
      taxableFederalIncome: 0,
      federalBeforeCredits: 0,
      dependentTaxCredit: 0,
      federal: 0,
      state: 0,
      local: 0,
      socialSecurity: 0,
      medicare: 0,
      fica: 0,
      totalTax: 0,
      netIncome: 0,
      effectiveRate: 0,
      marginalFedRate: 0,
      marginalTotalRate: 0,
      bracketBreakdown: [],
      primaryTaxDrivers: [],
    };
  }

  const filingStatus = taxProfile?.filingStatus || "single";
  const dependents = Math.max(0, Number(taxProfile?.dependents || 0));
  const preTaxPct =
    Math.max(0, Math.min(50, Number(taxProfile?.preTaxRetirementPct || 0))) /
    100;
  const preTaxDeductions = Math.round(grossIncome * preTaxPct);
  const adjustedGrossIncome = Math.max(0, grossIncome - preTaxDeductions);

  // UK HMRC Tax & National Insurance calculation for London (GB)
  if (cityObj.country === "GB") {
    const personalAllowance = adjustedGrossIncome > 125140 ? 0 : 16000;
    const taxable = Math.max(0, adjustedGrossIncome - personalAllowance);
    const basicBand = Math.min(taxable, 48000);
    const higherBand = Math.max(0, Math.min(taxable - 48000, 112000));
    const additionalBand = Math.max(0, taxable - 160000);

    const ukIncomeTax =
      basicBand * 0.2 + higherBand * 0.4 + additionalBand * 0.45;
    const niTaxable = Math.max(0, Math.min(grossIncome, 64000) - 16000);
    const niUpper = Math.max(0, grossIncome - 64000);
    const ukNI = niTaxable * 0.08 + niUpper * 0.02;
    const totalTax = ukIncomeTax + ukNI;
    const netIncome = Math.round(grossIncome - preTaxDeductions - totalTax);

    if (skipDetailedBreakdown) {
      return { netIncome, totalTax: Math.round(totalTax) };
    }

    const marginalFed =
      additionalBand > 0 ? 45 : higherBand > 0 ? 40 : basicBand > 0 ? 20 : 0;
    return {
      grossIncome,
      preTaxDeductions,
      standardDeduction: personalAllowance,
      taxableFederalIncome: taxable,
      federalBeforeCredits: Math.round(ukIncomeTax),
      dependentTaxCredit: 0,
      federal: Math.round(ukIncomeTax),
      state: 0,
      local: 0,
      socialSecurity: Math.round(ukNI),
      medicare: 0,
      fica: Math.round(ukNI),
      totalTax: Math.round(totalTax),
      netIncome,
      effectiveRate: (totalTax / grossIncome) * 100,
      marginalFedRate: marginalFed,
      marginalTotalRate: marginalFed + 2,
      bracketBreakdown: [
        {
          label: "20% UK Basic Rate",
          rate: 20,
          taxableInTier: Math.round(basicBand),
          taxInTier: Math.round(basicBand * 0.2),
        },
        {
          label: "40% UK Higher Rate",
          rate: 40,
          taxableInTier: Math.round(higherBand),
          taxInTier: Math.round(higherBand * 0.4),
        },
        {
          label: "45% UK Additional Rate",
          rate: 45,
          taxableInTier: Math.round(additionalBand),
          taxInTier: Math.round(additionalBand * 0.45),
        },
      ],
      primaryTaxDrivers: [
        "UK HMRC Higher Rate (40%) applies above ~$64k equivalent",
        adjustedGrossIncome > 125140
          ? "Personal Allowance tapered to $0 above $125,140 (60% effective marginal trap)"
          : "UK Class 1 National Insurance adds 8% on band earnings",
      ],
    };
  }

  // Other custom international cities
  if (cityObj.isInternational && cityObj.country !== "GB") {
    const effRate = cityObj.customEffTaxRate || 0.29;
    const fedShare = adjustedGrossIncome * (effRate * 0.78);
    const ficaShare = grossIncome * (effRate * 0.22);
    const totalTax = fedShare + ficaShare;
    const netIncome = Math.round(grossIncome - preTaxDeductions - totalTax);

    if (skipDetailedBreakdown) {
      return { netIncome, totalTax: Math.round(totalTax) };
    }

    return {
      grossIncome,
      preTaxDeductions,
      standardDeduction: 12000,
      taxableFederalIncome: Math.max(0, adjustedGrossIncome - 12000),
      federalBeforeCredits: Math.round(fedShare),
      dependentTaxCredit: 0,
      federal: Math.round(fedShare),
      state: 0,
      local: 0,
      socialSecurity: Math.round(ficaShare),
      medicare: 0,
      fica: Math.round(ficaShare),
      totalTax: Math.round(totalTax),
      netIncome,
      effectiveRate: (totalTax / grossIncome) * 100,
      marginalFedRate: Math.round(effRate * 115),
      marginalTotalRate: Math.round(effRate * 125),
      bracketBreakdown: [
        {
          label: `${cityObj.country} National Income Tax`,
          rate: Math.round(effRate * 78),
          taxableInTier: adjustedGrossIncome,
          taxInTier: Math.round(fedShare),
        },
        {
          label: `${cityObj.country} Social Contributions`,
          rate: Math.round(effRate * 22),
          taxableInTier: grossIncome,
          taxInTier: Math.round(ficaShare),
        },
      ],
      primaryTaxDrivers: [
        `International effective rate of ${(effRate * 100).toFixed(1)}% applied`,
      ],
    };
  }

  // US Federal Progressive Tax
  const standardDeduction =
    US_STANDARD_DEDUCTIONS[filingStatus] || US_STANDARD_DEDUCTIONS.single;
  const brackets =
    US_FEDERAL_BRACKETS[filingStatus] || US_FEDERAL_BRACKETS.single;
  const taxableFed = Math.max(0, adjustedGrossIncome - standardDeduction);

  let federalBeforeCredits = 0;
  let marginalFedRate = 10;
  const bracketBreakdown = [];

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const amountInBracket =
      taxableFed > b.min ? Math.min(taxableFed, b.max) - b.min : 0;
    const taxInBracket = amountInBracket * b.rate;
    federalBeforeCredits += taxInBracket;
    if (amountInBracket > 0) {
      marginalFedRate = Math.round(b.rate * 100);
    }
    if (!skipDetailedBreakdown) {
      bracketBreakdown.push({
        label: `${Math.round(b.rate * 100)}% Bracket ($${b.min.toLocaleString()}${b.max === Infinity ? "+" : "–$" + b.max.toLocaleString()})`,
        rate: Math.round(b.rate * 100),
        taxableInTier: Math.round(amountInBracket),
        taxInTier: Math.round(taxInBracket),
      });
    }
  }

  const phaseOutThreshold = filingStatus === "married" ? 400000 : 200000;
  const excessAgi = Math.max(0, adjustedGrossIncome - phaseOutThreshold);
  const phaseOutReduction = Math.ceil(excessAgi / 1000) * 50;
  const rawCredit = Math.max(0, dependents * 2000 - phaseOutReduction);
  const dependentTaxCredit = Math.min(federalBeforeCredits, rawCredit);

  let federal = Math.max(0, federalBeforeCredits - dependentTaxCredit);

  const ssTax = Math.min(grossIncome, SS_WAGE_CAP) * 0.062;
  const medicareThreshold = filingStatus === "married" ? 250000 : 200000;
  const medicareBase = grossIncome * 0.0145;
  const medicareAdd = Math.max(0, grossIncome - medicareThreshold) * 0.009;
  const medicare = medicareBase + medicareAdd;
  let fica = ssTax + medicare;

  const baseStateRate = cityObj.stateTaxRate ?? 0.04;
  const householdExemption =
    (filingStatus === "married" ? 14000 : 8000) + dependents * 2500;
  const incomeProgressionFactor =
    adjustedGrossIncome > 150000
      ? 1.06
      : adjustedGrossIncome < 80000
        ? 0.88
        : 1.0;
  let state =
    Math.max(0, adjustedGrossIncome - householdExemption) *
    baseStateRate *
    incomeProgressionFactor;

  const localRate = cityObj.localTaxRate || 0;
  const local = grossIncome * localRate;

  if (liveTaxOverride) {
    if (typeof liveTaxOverride.federalTax === "number") {
      federal = Math.max(0, liveTaxOverride.federalTax - dependentTaxCredit);
    }
    if (typeof liveTaxOverride.stateTax === "number")
      state = liveTaxOverride.stateTax;
    if (typeof liveTaxOverride.ficaTax === "number")
      fica = liveTaxOverride.ficaTax;
  }

  const totalTax = federal + state + local + fica;
  const netIncome = Math.round(grossIncome - preTaxDeductions - totalTax);

  if (skipDetailedBreakdown) {
    return { netIncome, totalTax: Math.round(totalTax) };
  }

  const marginalStatePct = baseStateRate * incomeProgressionFactor * 100;
  const marginalLocalPct = localRate * 100;
  const marginalFicaPct =
    (grossIncome < SS_WAGE_CAP ? 6.2 : 0) +
    1.45 +
    (grossIncome > medicareThreshold ? 0.9 : 0);
  const marginalTotalRate = Number(
    (
      marginalFedRate +
      marginalStatePct +
      marginalLocalPct +
      marginalFicaPct
    ).toFixed(1),
  );

  const primaryTaxDrivers = [];
  if (baseStateRate === 0) {
    primaryTaxDrivers.push(
      `${cityObj.stateName} has 0% State Income Tax — saving ~$${Math.round(adjustedGrossIncome * 0.048).toLocaleString()}/yr vs. national average.`,
    );
  } else if (baseStateRate >= 0.06) {
    primaryTaxDrivers.push(
      `High state income tax in ${cityObj.stateName} (${(baseStateRate * 100).toFixed(1)}% effective tier) adds $${Math.round(state).toLocaleString()}/yr.`,
    );
  } else {
    primaryTaxDrivers.push(
      `Moderate ${cityObj.stateName} state income tax (${(baseStateRate * 100).toFixed(2)}%) costs $${Math.round(state).toLocaleString()}/yr.`,
    );
  }

  if (localRate > 0) {
    primaryTaxDrivers.push(
      `${cityObj.city} levies a ${(localRate * 100).toFixed(2)}% local municipal wage/earnings tax ($${Math.round(local).toLocaleString()}/yr).`,
    );
  }

  if (preTaxDeductions > 0) {
    const taxSavedBy401k = Math.round(
      preTaxDeductions * ((marginalFedRate + marginalStatePct) / 100),
    );
    primaryTaxDrivers.push(
      `Pre-tax 401(k)/HSA contributions ($${preTaxDeductions.toLocaleString()}) reduce Federal + State tax by ~$${taxSavedBy401k.toLocaleString()}/yr.`,
    );
  }

  if (dependentTaxCredit > 0) {
    primaryTaxDrivers.push(
      `${dependents} qualifying dependent(s) directly reduce Federal tax owed by $${dependentTaxCredit.toLocaleString()}/yr.`,
    );
  }

  return {
    grossIncome,
    preTaxDeductions,
    standardDeduction,
    taxableFederalIncome: Math.round(taxableFed),
    federalBeforeCredits: Math.round(federalBeforeCredits),
    dependentTaxCredit: Math.round(dependentTaxCredit),
    federal: Math.round(federal),
    state: Math.round(state),
    local: Math.round(local),
    socialSecurity: Math.round(ssTax),
    medicare: Math.round(medicare),
    fica: Math.round(fica),
    totalTax: Math.round(totalTax),
    netIncome,
    effectiveRate: (totalTax / grossIncome) * 100,
    marginalFedRate,
    marginalTotalRate,
    bracketBreakdown,
    primaryTaxDrivers,
  };
}

export function computeWeightedColIndex(indices, normalizedWeights) {
  return (
    indices.housing * normalizedWeights.housing +
    indices.food * normalizedWeights.food +
    indices.transportation * normalizedWeights.transportation +
    indices.utilities * normalizedWeights.utilities +
    indices.healthcare * normalizedWeights.healthcare +
    indices.misc * normalizedWeights.misc
  );
}

/**
 * Fast-converging Secant/Binary hybrid solver (8 steps instead of 30)
 */
export function solveEquivalentGrossSalary(
  requiredNetIncome,
  cityObj,
  taxProfile,
) {
  let low = requiredNetIncome * 1.02;
  let high = requiredNetIncome * 2.35;
  for (let i = 0; i < 10; i++) {
    const mid = (low + high) * 0.5;
    const taxRes = calculateTaxes(mid, cityObj, taxProfile, null, true);
    if (taxRes.netIncome < requiredNetIncome) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.round((low + high) * 0.5);
}

export function evaluateCityMetrics(
  cityObj,
  baseCityObj,
  targetSalary,
  taxProfile = DEFAULT_TAX_PROFILE,
  rawBudgetWeights = DEFAULT_BUDGET_WEIGHTS,
  liveTaxOverride = null,
) {
  const weights = normalizeBudgetWeights(rawBudgetWeights);
  const baseTax = calculateTaxes(
    targetSalary,
    baseCityObj,
    taxProfile,
    null,
    true,
  );
  const baseWeightedIndex = computeWeightedColIndex(
    baseCityObj.indices,
    weights,
  );
  const cityWeightedIndex = computeWeightedColIndex(cityObj.indices, weights);

  const colMultiplierVsBase = cityWeightedIndex / baseWeightedIndex;

  const requiredNetInTarget = baseTax.netIncome * colMultiplierVsBase;
  const equivalentGrossNeeded =
    cityObj.id === baseCityObj.id
      ? targetSalary
      : solveEquivalentGrossSalary(requiredNetInTarget, cityObj, taxProfile);
  const taxesAtEquivalentGross = calculateTaxes(
    equivalentGrossNeeded,
    cityObj,
    taxProfile,
    null,
    true,
  );

  const fixedSalaryTaxes = calculateTaxes(
    targetSalary,
    cityObj,
    taxProfile,
    liveTaxOverride,
    false,
  );

  const householdSize = Math.max(1, Number(taxProfile?.householdSize || 1));
  const householdScale = 1 + (householdSize - 1) * 0.04;
  const consumptionRate = Math.min(
    0.96,
    ((Number(taxProfile?.baseConsumptionRatePct) || 68) / 100) * householdScale,
  );

  const baseTotalConsumption = baseTax.netIncome * consumptionRate;

  const housingSpend = Math.round(
    baseTotalConsumption *
      weights.housing *
      (cityObj.indices.housing / baseCityObj.indices.housing),
  );
  const foodSpend = Math.round(
    baseTotalConsumption *
      weights.food *
      (cityObj.indices.food / baseCityObj.indices.food),
  );
  const transportationSpend = Math.round(
    baseTotalConsumption *
      weights.transportation *
      (cityObj.indices.transportation / baseCityObj.indices.transportation),
  );
  const utilitiesSpend = Math.round(
    baseTotalConsumption *
      weights.utilities *
      (cityObj.indices.utilities / baseCityObj.indices.utilities),
  );
  const healthcareSpend = Math.round(
    baseTotalConsumption *
      weights.healthcare *
      (cityObj.indices.healthcare / baseCityObj.indices.healthcare),
  );
  const miscSpend = Math.round(
    baseTotalConsumption *
      weights.misc *
      (cityObj.indices.misc / baseCityObj.indices.misc),
  );

  const totalColExpenses =
    housingSpend +
    foodSpend +
    transportationSpend +
    utilitiesSpend +
    healthcareSpend +
    miscSpend;
  const leftoverFromFixedSalary = fixedSalaryTaxes.netIncome - totalColExpenses;

  const minWageAnnualFullTime = Math.round(cityObj.minWageHourly * 2080);
  const salaryToMedianRatio = Number(
    (targetSalary / (cityObj.medianWageAnnual || 58000)).toFixed(2),
  );

  return {
    ...cityObj,
    weightedColIndex: Number(cityWeightedIndex.toFixed(1)),
    colDiffPercent: Number(((colMultiplierVsBase - 1) * 100).toFixed(1)),
    minWageAnnualFullTime,
    salaryToMedianRatio,
    equivalentGrossNeeded,
    equivalentNetNeeded: Math.round(requiredNetInTarget),
    equivalentTotalTax: taxesAtEquivalentGross.totalTax,
    salaryDeltaNeeded: equivalentGrossNeeded - targetSalary,
    fixedSalary: {
      gross: targetSalary,
      preTaxDeductions: fixedSalaryTaxes.preTaxDeductions,
      standardDeduction: fixedSalaryTaxes.standardDeduction,
      taxableFederalIncome: fixedSalaryTaxes.taxableFederalIncome,
      dependentTaxCredit: fixedSalaryTaxes.dependentTaxCredit,
      federalTax: fixedSalaryTaxes.federal,
      stateTax: fixedSalaryTaxes.state,
      localTax: fixedSalaryTaxes.local,
      socialSecurityTax: fixedSalaryTaxes.socialSecurity,
      medicareTax: fixedSalaryTaxes.medicare,
      ficaTax: fixedSalaryTaxes.fica,
      totalTax: fixedSalaryTaxes.totalTax,
      effectiveTaxRate: Number(fixedSalaryTaxes.effectiveRate.toFixed(1)),
      marginalFedRate: fixedSalaryTaxes.marginalFedRate,
      marginalTotalRate: fixedSalaryTaxes.marginalTotalRate,
      bracketBreakdown: fixedSalaryTaxes.bracketBreakdown,
      primaryTaxDrivers: fixedSalaryTaxes.primaryTaxDrivers,
      netTakeHome: fixedSalaryTaxes.netIncome,
      housingSpend,
      foodSpend,
      transportationSpend,
      utilitiesSpend,
      healthcareSpend,
      miscSpend,
      totalColExpenses,
      leftover: leftoverFromFixedSalary,
    },
  };
}
