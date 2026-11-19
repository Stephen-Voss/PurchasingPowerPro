// src/components/RelocationCompareModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, DollarSign, Briefcase, Wallet, Shield } from 'lucide-react';

const fmtUSD = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

export function RelocationCompareModal({ allCities, baseCity, initialTargetCity, targetSalary, onClose }) {
  const [compareCityId, setCompareCityId] = useState(
    initialTargetCity?.id || allCities.find((c) => c.id !== baseCity.id)?.id || baseCity.id
  );

  useEffect(() => {
    if (initialTargetCity?.id && initialTargetCity.id !== baseCity.id) {
      setCompareCityId(initialTargetCity.id);
    }
  }, [initialTargetCity, baseCity.id]);

  if (!baseCity) return null;

  const targetCity =
    allCities.find((c) => c.id === compareCityId) ||
    allCities.find((c) => c.id !== baseCity.id) ||
    baseCity;

  const bFix = baseCity.fixedSalary;
  const tFix = targetCity.fixedSalary;
  const leftoverDiff = tFix.leftover - bFix.leftover;
  const salaryNeededDiff = targetCity.equivalentGrossNeeded - baseCity.equivalentGrossNeeded;
  const taxDiff = tFix.totalTax - bFix.totalTax;

  const categories = [
    { label: 'Housing & Rent', baseVal: bFix.housingSpend, targetVal: tFix.housingSpend },
    { label: 'Food & Groceries', baseVal: bFix.foodSpend, targetVal: tFix.foodSpend },
    { label: 'Transportation', baseVal: bFix.transportationSpend, targetVal: tFix.transportationSpend },
    { label: 'Utilities & Energy', baseVal: bFix.utilitiesSpend, targetVal: tFix.utilitiesSpend },
    { label: 'Healthcare', baseVal: bFix.healthcareSpend, targetVal: tFix.healthcareSpend },
    { label: 'Miscellaneous', baseVal: bFix.miscSpend, targetVal: tFix.miscSpend }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card compare-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>
              <ArrowLeftRight size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              2-City Relocation Comparison: {baseCity.city} ({baseCity.code}) vs. {targetCity.city} ({targetCity.code})
            </h3>
            <p className="modal-sub">
              Head-to-head purchasing power, tax burden, career viability, and 6-category spend on a{' '}
              <strong>{fmtUSD(targetSalary)}</strong> gross salary
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Comparison City Selector */}
        <div className="compare-selector-bar">
          <div className="compare-city-pill">
            <span>Base City</span>
            <strong>
              {baseCity.city}, {baseCity.state} ({baseCity.code})
            </strong>
          </div>
          <div className="compare-vs-badge">VS</div>
          <div className="compare-city-select-wrap">
            <label>Compare Against City</label>
            <select
              value={targetCity.id}
              onChange={(e) => setCompareCityId(e.target.value)}
            >
              {allCities
                .filter((c) => c.id !== baseCity.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.state} — {c.city} ({c.code}) • COL {c.weightedColIndex}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Head-to-Head Summary Cards */}
        <div className="compare-kpi-grid">
          <div className="tax-kpi-box">
            <span>
              <DollarSign size={13} style={{ verticalAlign: 'middle' }} /> Equivalent Salary Needed
            </span>
            <strong className="text-amber">{fmtUSD(targetCity.equivalentGrossNeeded)}</strong>
            <small className={salaryNeededDiff > 0 ? 'text-red' : 'text-green'}>
              {salaryNeededDiff >= 0 ? `+${fmtUSD(salaryNeededDiff)}` : fmtUSD(salaryNeededDiff)} vs{' '}
              {fmtUSD(baseCity.equivalentGrossNeeded)} in {baseCity.code}
            </small>
          </div>

          <div className="tax-kpi-box">
            <span>
              <Wallet size={13} style={{ verticalAlign: 'middle' }} /> Leftover Income Delta
            </span>
            <strong className={leftoverDiff >= 0 ? 'text-green' : 'text-red'}>
              {leftoverDiff >= 0 ? `+${fmtUSD(leftoverDiff)}/yr` : `${fmtUSD(leftoverDiff)}/yr`}
            </strong>
            <small>
              {targetCity.code}: {fmtUSD(tFix.leftover)} vs {baseCity.code}: {fmtUSD(bFix.leftover)}
            </small>
          </div>

          <div className="tax-kpi-box">
            <span>
              <Shield size={13} style={{ verticalAlign: 'middle' }} /> Annual Tax Difference
            </span>
            <strong className={taxDiff <= 0 ? 'text-green' : 'text-red'}>
              {taxDiff >= 0 ? `+${fmtUSD(taxDiff)}/yr` : `${fmtUSD(taxDiff)}/yr`}
            </strong>
            <small>
              {targetCity.code}: {fmtUSD(tFix.totalTax)} ({tFix.effectiveTaxRate}%) vs {baseCity.code}:{' '}
              {fmtUSD(bFix.totalTax)} ({bFix.effectiveTaxRate}%)
            </small>
          </div>

          <div className="tax-kpi-box">
            <span>
              <Briefcase size={13} style={{ verticalAlign: 'middle' }} /> Career Viability ({targetCity.career?.careerTitle})
            </span>
            <strong className={`text-${targetCity.career?.viabilityTone || 'amber'}`}>
              {targetCity.career?.viabilityScore ?? 60}/100 vs {baseCity.career?.viabilityScore ?? 60}/100
            </strong>
            <small>
              {targetCity.code} Role Med: {fmtUSD(targetCity.career?.roleMedianSalary)} vs {baseCity.code}:{' '}
              {fmtUSD(baseCity.career?.roleMedianSalary)}
            </small>
          </div>
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="budget-table-box">
          <h4>Side-by-Side Breakdown</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="mini-budget-table">
              <thead>
                <tr>
                  <th>Metric / Category</th>
                  <th>
                    {baseCity.city} ({baseCity.code})
                  </th>
                  <th>
                    {targetCity.city} ({targetCity.code})
                  </th>
                  <th>Difference ({targetCity.code} vs {baseCity.code})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Weighted COL Index</strong>
                  </td>
                  <td>{baseCity.weightedColIndex}</td>
                  <td>{targetCity.weightedColIndex}</td>
                  <td className={targetCity.weightedColIndex > baseCity.weightedColIndex ? 'diff-cell-up' : 'diff-cell-down'}>
                    {(targetCity.weightedColIndex - baseCity.weightedColIndex) >= 0 ? '+' : ''}
                    {(targetCity.weightedColIndex - baseCity.weightedColIndex).toFixed(1)} pts
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Equivalent Salary Needed</strong>
                  </td>
                  <td>{fmtUSD(baseCity.equivalentGrossNeeded)}</td>
                  <td>
                    <strong>{fmtUSD(targetCity.equivalentGrossNeeded)}</strong>
                  </td>
                  <td className={salaryNeededDiff > 0 ? 'diff-cell-up' : 'diff-cell-down'}>
                    {salaryNeededDiff >= 0 ? `+${fmtUSD(salaryNeededDiff)}` : fmtUSD(salaryNeededDiff)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Net Take-Home Pay</strong>
                  </td>
                  <td>{fmtUSD(bFix.netTakeHome)}</td>
                  <td>{fmtUSD(tFix.netTakeHome)}</td>
                  <td className={(tFix.netTakeHome - bFix.netTakeHome) >= 0 ? 'diff-cell-down' : 'diff-cell-up'}>
                    {(tFix.netTakeHome - bFix.netTakeHome) >= 0 ? '+' : ''}
                    {fmtUSD(tFix.netTakeHome - bFix.netTakeHome)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Min / Median Wage</strong>
                  </td>
                  <td>
                    ${Number(baseCity.minWageHourly || 0).toFixed(2)}/hr • {fmtUSD(baseCity.medianWageAnnual)}
                  </td>
                  <td>
                    ${Number(targetCity.minWageHourly || 0).toFixed(2)}/hr • {fmtUSD(targetCity.medianWageAnnual)}
                  </td>
                  <td>
                    {(targetCity.medianWageAnnual - baseCity.medianWageAnnual) >= 0 ? '+' : ''}
                    {fmtUSD(targetCity.medianWageAnnual - baseCity.medianWageAnnual)} median
                  </td>
                </tr>
                {categories.map((cat) => {
                  const delta = cat.targetVal - cat.baseVal;
                  return (
                    <tr key={cat.label}>
                      <td>{cat.label}</td>
                      <td>{fmtUSD(cat.baseVal)}/yr</td>
                      <td>{fmtUSD(cat.targetVal)}/yr</td>
                      <td className={delta > 0 ? 'diff-cell-up' : 'diff-cell-down'}>
                        {delta >= 0 ? `+${fmtUSD(delta)}/yr` : `${fmtUSD(delta)}/yr`}
                      </td>
                    </tr>
                  );
                })}
                <tr className="budget-total-row">
                  <td>
                    <strong>Net Leftover on {fmtUSD(targetSalary)}</strong>
                  </td>
                  <td>
                    <strong>{fmtUSD(bFix.leftover)}/yr</strong>
                  </td>
                  <td>
                    <strong>{fmtUSD(tFix.leftover)}/yr</strong>
                  </td>
                  <td className={leftoverDiff >= 0 ? 'diff-cell-down' : 'diff-cell-up'}>
                    <strong>
                      {leftoverDiff >= 0 ? `+${fmtUSD(leftoverDiff)}/yr` : `${fmtUSD(leftoverDiff)}/yr`}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}