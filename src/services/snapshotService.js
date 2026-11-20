// src/services/snapshotService.js

const SNAPSHOTS_STORAGE_KEY = "cost_tracker_snapshots_v2";

const CSV_HEADERS = [
  "snapshot_date",
  "snapshot_label",
  "base_city_code",
  "target_salary",
  "career_title",
  "city_id",
  "city_code",
  "city",
  "state",
  "weighted_col_index",
  "col_diff_pct",
  "equivalent_salary_needed",
  "total_tax",
  "effective_tax_rate",
  "housing_spend",
  "food_spend",
  "transportation_spend",
  "utilities_spend",
  "healthcare_spend",
  "misc_spend",
  "total_col_basket",
  "leftover_income",
  "min_wage_hourly",
  "median_wage_annual",
  "role_median_salary",
  "career_viability_score",
  "hud_fmr_2br_monthly",
  "rentcast_median_rent_monthly",
];

function escapeCsvCell(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportSnapshotCsv({
  cities,
  baseCity,
  targetSalary,
  careerTitle,
  customLabel = "",
}) {
  const isoDate = new Date().toISOString().slice(0, 10);
  const label = (customLabel || `Snapshot ${isoDate}`).trim();

  const rows = [CSV_HEADERS.join(",")];

  for (const c of cities) {
    const f = c.fixedSalary || {};
    const cr = c.career || {};
    const h = c.housing || {};

    const record = [
      isoDate,
      label,
      baseCity?.code || "STL",
      targetSalary,
      careerTitle || cr.careerTitle || "",
      c.id,
      c.code,
      c.city,
      c.state,
      c.weightedColIndex,
      c.colDiffPercent,
      c.equivalentGrossNeeded,
      f.totalTax,
      f.effectiveTaxRate,
      f.housingSpend,
      f.foodSpend,
      f.transportationSpend,
      f.utilitiesSpend,
      f.healthcareSpend,
      f.miscSpend,
      f.totalColExpenses,
      f.leftover,
      c.minWageHourly,
      c.medianWageAnnual,
      cr.roleMedianSalary,
      cr.viabilityScore,
      h.hudFairMarketRents?.br2 ?? "",
      h.rentcast?.medianRentMonthly ?? "",
    ];

    rows.push(record.map(escapeCsvCell).join(","));
  }

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `purchasing-power-snapshot-${isoDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const toNum = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

export function parseSnapshotCsv(
  csvText,
  fallbackFileName = "Imported Snapshot",
) {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      "CSV file must contain a header row and at least one city row.",
    );
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const colIdx = (name) => headers.indexOf(name);

  const idxDate = colIdx("snapshot_date");
  const idxLabel = colIdx("snapshot_label");
  const idxCityId = colIdx("city_id");
  const idxCode = colIdx("city_code");
  const idxCity = colIdx("city");
  const idxState = colIdx("state");
  const idxWeightedCol = colIdx("weighted_col_index");
  const idxColDiff = colIdx("col_diff_pct");
  const idxEquivSal = colIdx("equivalent_salary_needed");
  const idxTotalTax = colIdx("total_tax");
  const idxHousing = colIdx("housing_spend");
  const idxFood = colIdx("food_spend");
  const idxTransit = colIdx("transportation_spend");
  const idxUtil = colIdx("utilities_spend");
  const idxHealth = colIdx("healthcare_spend");
  const idxMisc = colIdx("misc_spend");
  const idxBasket = colIdx("total_col_basket");
  const idxLeftover = colIdx("leftover_income");
  const idxRoleSal = colIdx("role_median_salary");
  const idxViability = colIdx("career_viability_score");
  const idxFmr2Br = colIdx("hud_fmr_2br_monthly");
  const idxRentCast = colIdx("rentcast_median_rent_monthly");

  if (idxCity === -1 && idxCode === -1 && idxCityId === -1) {
    throw new Error(
      "Invalid CSV format: missing city, city_code, or city_id columns.",
    );
  }

  const cleanFallback = fallbackFileName.replace(/\.csv$/i, "");
  const groupedSnapshots = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 3) continue;

    const snapDate =
      (idxDate !== -1 && cells[idxDate]) ||
      new Date().toISOString().slice(0, 10);
    const snapLabel =
      (idxLabel !== -1 && cells[idxLabel]) || `${cleanFallback} (${snapDate})`;
    const groupKey = `${snapDate}__${snapLabel}`;

    const cityCode = (idxCode !== -1 && cells[idxCode]) || "";
    const cityName =
      (idxCity !== -1 && cells[idxCity]) || cityCode || "Unknown";
    const stateCode = (idxState !== -1 && cells[idxState]) || "";
    const cityId =
      (idxCityId !== -1 && cells[idxCityId]) ||
      `${cityName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${stateCode.toLowerCase()}`;

    if (!groupedSnapshots.has(groupKey)) {
      groupedSnapshots.set(groupKey, {
        id: groupKey.toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
        date: snapDate,
        label: snapLabel,
        importedAt: new Date().toISOString(),
        recordsByCityId: {},
      });
    }

    const snap = groupedSnapshots.get(groupKey);
    snap.recordsByCityId[cityId] = {
      cityId,
      cityCode,
      city: cityName,
      state: stateCode,
      weightedColIndex: toNum(cells[idxWeightedCol], 100),
      colDiffPercent: toNum(cells[idxColDiff], 0),
      equivalentGrossNeeded: toNum(cells[idxEquivSal], 0),
      totalTax: toNum(cells[idxTotalTax], 0),
      housingSpend: toNum(cells[idxHousing], 0),
      foodSpend: toNum(cells[idxFood], 0),
      transportationSpend: toNum(cells[idxTransit], 0),
      utilitiesSpend: toNum(cells[idxUtil], 0),
      healthcareSpend: toNum(cells[idxHealth], 0),
      miscSpend: toNum(cells[idxMisc], 0),
      totalColExpenses: toNum(cells[idxBasket], 0),
      leftover: toNum(cells[idxLeftover], 0),
      roleMedianSalary: toNum(cells[idxRoleSal], 0),
      viabilityScore: toNum(cells[idxViability], 0),
      hudFmr2BrMonthly: toNum(cells[idxFmr2Br], 0),
      rentcastMedianRentMonthly: toNum(cells[idxRentCast], 0),
    };
  }

  return Array.from(groupedSnapshots.values());
}

export const snapshotService = {
  getAll() {
    try {
      const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list)
        ? list.sort((a, b) => String(a.date).localeCompare(String(b.date)))
        : [];
    } catch {
      return [];
    }
  },

  upsertMany(newSnapshots) {
    const existing = this.getAll();
    const map = new Map(existing.map((s) => [s.id, s]));
    for (const snap of newSnapshots) {
      map.set(snap.id, snap);
    }
    const merged = Array.from(map.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(merged));
    } catch (err) {
      console.warn("Unable to save snapshots to localStorage:", err);
    }
    return merged;
  },

  remove(snapshotId) {
    const next = this.getAll().filter((s) => s.id !== snapshotId);
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  clearAll() {
    localStorage.removeItem(SNAPSHOTS_STORAGE_KEY);
    return [];
  },

  generateSampleHistoricalSnapshots(currentCities) {
    const sampleQuarters = [
      {
        date: "2024-02-15",
        label: "2024-Q1 Snapshot",
        colFactor: 0.925,
        salFactor: 0.915,
        rentFactor: 0.9,
      },
      {
        date: "2024-05-15",
        label: "2024-Q2 Snapshot",
        colFactor: 0.935,
        salFactor: 0.925,
        rentFactor: 0.912,
      },
      {
        date: "2024-08-15",
        label: "2024-Q3 Snapshot",
        colFactor: 0.945,
        salFactor: 0.938,
        rentFactor: 0.925,
      },
      {
        date: "2024-11-15",
        label: "2024-Q4 Snapshot",
        colFactor: 0.954,
        salFactor: 0.948,
        rentFactor: 0.938,
      },
      {
        date: "2025-02-15",
        label: "2025-Q1 Snapshot (No Mock Bills)",
        colFactor: 0.96,
        salFactor: 0.955,
        rentFactor: 0.945,
      },
      {
        date: "2025-05-15",
        label: "2025-Q2 Snapshot",
        colFactor: 0.968,
        salFactor: 0.962,
        rentFactor: 0.955,
      },
      {
        date: "2025-08-15",
        label: "2025-Q3 Snapshot",
        colFactor: 0.976,
        salFactor: 0.972,
        rentFactor: 0.966,
      },
      {
        date: "2025-11-15",
        label: "2025-Q4 Snapshot",
        colFactor: 0.983,
        salFactor: 0.98,
        rentFactor: 0.976,
      },
      {
        date: "2026-02-15",
        label: "2026-Q1 Snapshot",
        colFactor: 0.99,
        salFactor: 0.988,
        rentFactor: 0.985,
      },
      {
        date: "2026-05-15",
        label: "2026-Q2 Snapshot",
        colFactor: 0.995,
        salFactor: 0.994,
        rentFactor: 0.992,
      },
      {
        date: "2026-08-15",
        label: "2026-Q3 Snapshot",
        colFactor: 0.998,
        salFactor: 0.998,
        rentFactor: 0.997,
      },
    ];

    return sampleQuarters.map((cfg) => {
      const recordsByCityId = {};
      for (const c of currentCities) {
        const f = c.fixedSalary || {};
        const cr = c.career || {};
        const h = c.housing || {};
        const metroTilt = c.weightedColIndex > 105 ? 0.992 : 1.004;

        recordsByCityId[c.id] = {
          cityId: c.id,
          cityCode: c.code,
          city: c.city,
          state: c.state,
          weightedColIndex: Number(
            (c.weightedColIndex * cfg.colFactor * metroTilt).toFixed(1),
          ),
          colDiffPercent: c.colDiffPercent,
          equivalentGrossNeeded: Math.round(
            c.equivalentGrossNeeded * cfg.salFactor * metroTilt,
          ),
          totalTax: Math.round((f.totalTax || 0) * 0.98),
          housingSpend: Math.round(
            (f.housingSpend || 0) * cfg.rentFactor * metroTilt,
          ),
          foodSpend: Math.round((f.foodSpend || 0) * cfg.colFactor),
          transportationSpend: Math.round(
            (f.transportationSpend || 0) * cfg.colFactor,
          ),
          utilitiesSpend: Math.round((f.utilitiesSpend || 0) * cfg.colFactor),
          healthcareSpend: Math.round((f.healthcareSpend || 0) * cfg.colFactor),
          miscSpend: Math.round((f.miscSpend || 0) * cfg.colFactor),
          totalColExpenses: Math.round(
            (f.totalColExpenses || 0) * cfg.colFactor * metroTilt,
          ),
          leftover: Math.round((f.leftover || 0) / (cfg.colFactor * metroTilt)),
          roleMedianSalary: Math.round(
            (cr.roleMedianSalary || 0) * cfg.salFactor,
          ),
          viabilityScore: cr.viabilityScore || 60,
          hudFmr2BrMonthly: Math.round(
            (h.hudFairMarketRents?.br2 || 0) * cfg.rentFactor,
          ),
          rentcastMedianRentMonthly: Math.round(
            (h.rentcast?.medianRentMonthly || 0) * cfg.rentFactor,
          ),
        };
      }

      return {
        id: `${cfg.date}_${cfg.label}`
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "_"),
        date: cfg.date,
        label: cfg.label,
        importedAt: new Date().toISOString(),
        recordsByCityId,
      };
    });
  },
};
