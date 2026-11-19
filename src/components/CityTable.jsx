// src/components/CityTable.jsx
import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PieChart,
  Sparkles,
  Briefcase,
  ArrowLeftRight,
  LayoutGrid,
  Table as TableIcon,
  MapPin
} from 'lucide-react';

const fmtUSD = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return 'No API Key';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

export function CityTable({
  cities,
  totalTrackedCount,
  baseCity,
  targetSalary,
  onCompareCity,
  onInspectTax,
  onInspectBudget,
  onInspectCareer
}) {
  const [sortField, setSortField] = useState('equivalentGrossNeeded');
  const [sortAsc, setSortAsc] = useState(false);

  const [cardViewMode, setCardViewMode] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="sort-icon-idle" />;
    }
    return sortAsc ? (
      <ArrowUp size={14} className="sort-icon-active" />
    ) : (
      <ArrowDown size={14} className="sort-icon-active" />
    );
  };

  const getHeaderClass = (field, baseClass = '') => {
    const isSorted = sortField === field;
    return `${baseClass} ${isSorted ? 'sorted-col-header' : ''}`.trim();
  };

  const getValue = (item, path) => path.split('.').reduce((acc, part) => acc && acc[part], item);

  const sortedCities = [...cities].sort((a, b) => {
    const valA = getValue(a, sortField);
    const valB = getValue(b, sortField);
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    const numA = Number.isFinite(Number(valA)) ? Number(valA) : -Infinity;
    const numB = Number.isFinite(Number(valB)) ? Number(valB) : -Infinity;
    return sortAsc ? numA - numB : numB - numA;
  });

  const baseLeftover = Number.isFinite(Number(baseCity?.fixedSalary?.leftover))
    ? Number(baseCity.fixedSalary.leftover)
    : 0;

  return (
    <div className="m3-table-surface">
      <div className="table-controls-banner">
        <div className="table-banner-left">
          <span className="table-hint-pill">
            <MapPin size={13} /> Tracked Cities Shown: <strong>{sortedCities.length}</strong>
            {typeof totalTrackedCount === 'number' && totalTrackedCount !== sortedCities.length
              ? ` of ${totalTrackedCount}`
              : ''}
          </span>
          <span className="table-hint-pill">
            <ArrowLeftRight size={13} /> Click <strong>Compare</strong> for 2-City Side-by-Side
          </span>
          <span className="table-hint-pill">
            <Briefcase size={13} /> Click <strong>Career Viability</strong> for Jobs &amp; BLS
          </span>
          <span className="table-hint-pill">
            <PieChart size={13} /> Click <strong>Total COL Basket</strong> for Pie &amp; Table
          </span>
          <span className="table-hint-pill">
            <Sparkles size={13} /> Click <strong>Taxes</strong> for Tax Inspector
          </span>
          <span className="table-hint-pill">
            Sorted by <strong>{sortField.split('.').pop()}</strong> ({sortAsc ? 'Ascending ↑' : 'Descending ↓'})
          </span>
        </div>

        <div className="table-banner-right">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCardViewMode(!cardViewMode)}
          >
            {cardViewMode ? <TableIcon size={15} /> : <LayoutGrid size={15} />}
            <span>{cardViewMode ? 'Scrollable Table' : 'Card Grid View'}</span>
          </button>
        </div>
      </div>

      {sortedCities.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          No tracked cities match your current filter. Select cities in <strong>Tracked Cities</strong> above or clear your table filter.
        </div>
      ) : cardViewMode ? (
        <div className="mobile-cards-container">
          {sortedCities.map((c) => {
            const isBase = c.id === baseCity.id;
            const leftoverVal = Number(c.fixedSalary.leftover) || 0;
            const leftoverPos = leftoverVal >= 0;
            const leftoverDelta = leftoverVal - baseLeftover;
            const cr = c.career;

            return (
              <div key={c.id} className={isBase ? 'city-mobile-card base-card' : 'city-mobile-card'}>
                <div className="mc-header">
                  <div>
                    <strong>
                      {c.city}, {c.state}
                    </strong>{' '}
                    <span className="city-code-badge">{c.code}</span>
                  </div>
                  {!isBase && (
                    <button
                      type="button"
                      className="compare-row-btn"
                      onClick={() => onCompareCity(c)}
                    >
                      <ArrowLeftRight size={12} /> Compare
                    </button>
                  )}
                </div>

                <div className="mc-grid">
                  <div>
                    <span className="mc-label">Salary Needed (vs {baseCity.code})</span>
                    <strong className="equiv-salary">{fmtUSD(c.equivalentGrossNeeded)}</strong>
                  </div>
                  <div>
                    <span className="mc-label">Leftover on {fmtUSD(targetSalary)}</span>
                    <strong className={leftoverPos ? 'leftover-positive' : 'leftover-negative'}>
                      {leftoverPos ? '+' : ''}
                      {fmtUSD(leftoverVal)}
                    </strong>
                    <small
                      style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        color: isBase
                          ? '#94a3b8'
                          : leftoverDelta >= 0
                          ? '#34d399'
                          : '#f87171'
                      }}
                    >
                      {isBase
                        ? `Base (${baseCity.code}) Benchmark`
                        : leftoverDelta >= 0
                        ? `+${fmtUSD(leftoverDelta)} vs ${baseCity.code}`
                        : `${fmtUSD(leftoverDelta)} vs ${baseCity.code}`}
                    </small>
                  </div>
                  <div>
                    <span className="mc-label">Min / Median Wage</span>
                    <strong>
                      ${Number(c.minWageHourly || 0).toFixed(2)}/hr • {fmtUSD(c.medianWageAnnual)}
                    </strong>
                  </div>
                  <div onClick={() => onInspectCareer(c)} className="mc-career-clickable">
                    <span className="mc-label">Career Viability (Tap)</span>
                    <strong>
                      {cr.viabilityScore}/100 • ~{fmtUSD(cr.roleMedianSalary)}
                    </strong>
                    <small style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>
                      {cr.apiStatus.anyLive ? 'Live API' : 'No API Key (Est.)'}
                    </small>
                  </div>
                  <div onClick={() => onInspectTax(c)} className="mc-tax-clickable">
                    <span className="mc-label">Taxes (Tap to Inspect)</span>
                    <strong>
                      {fmtUSD(f.totalTax)} ({f.effectiveTaxRate}%)
                    </strong>
                  </div>
                </div>

                <div className="mc-budget-summary" onClick={() => onInspectBudget(c)}>
                  <div className="mc-budget-row">
                    <span>Total 6-Category COL Basket (Tap for Pie &amp; Table):</span>
                    <strong>{fmtUSD(f.totalColExpenses)}/yr ▸</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-scroll-viewport">
          <table className="cost-table">
            <thead>
              <tr>
                <th
                  className={getHeaderClass('city', 'sticky-col')}
                  onClick={() => handleSort('city')}
                  title="Tracked city name, state/region code, and comparison action. Click to sort alphabetically; click Compare to open a side-by-side 2-city relocation modal."
                >
                  <span className="th-content">
                    City &amp; Region {renderSortIndicator('city')}
                  </span>
                </th>
                <th
                  className={getHeaderClass('weightedColIndex')}
                  onClick={() => handleSort('weightedColIndex')}
                  title="Custom-weighted Cost of Living index (U.S. baseline ≈ 100) using your 6 budget category weights, plus percentage cost difference vs. your Base City."
                >
                  <span className="th-content">
                    Weighted COL {renderSortIndicator('weightedColIndex')}
                  </span>
                </th>
                <th
                  className={getHeaderClass('equivalentGrossNeeded', 'highlight-col')}
                  onClick={() => handleSort('equivalentGrossNeeded')}
                  title={`Gross annual salary required in this city to match the after-tax purchasing power of ${fmtUSD(
                    targetSalary
                  )} in ${baseCity.code}, along with the dollar raise or savings needed.`}
                >
                  <span className="th-content">
                    Salary Needed (Match {baseCity.code}) {renderSortIndicator('equivalentGrossNeeded')}
                  </span>
                </th>
                <th
                  className={getHeaderClass('medianWageAnnual')}
                  onClick={() => handleSort('medianWageAnnual')}
                  title="Effective hourly/full-time annual minimum wage for the city/state and typical annual median earnings, plus how your target salary compares to the local median."
                >
                  <span className="th-content">
                    Min &amp; Median Wage {renderSortIndicator('medianWageAnnual')}
                  </span>
                </th>
                <th
                  className={getHeaderClass('career.viabilityScore')}
                  onClick={() => handleSort('career.viabilityScore')}
                  title="Career Viability Score (0–100) for your selected profession. Displays calibrated estimates when Adzuna, CareerOneStop, or BLS API keys are not configured. Click any cell to inspect."
                >
                  <span className="th-content">
                    Career Viability (Click) {renderSortIndicator('career.viabilityScore')}
                  </span>
                </th>
                <th
                  className={getHeaderClass('fixedSalary.totalTax')}
                  onClick={() => handleSort('fixedSalary.totalTax')}
                  title={`Total annual income & payroll taxes (Federal, State, Local city wage tax, and FICA) on a ${fmtUSD(
                    targetSalary
                  )} salary. Click to sort or click any city row's tax cell to open the Tax Inspector modal.`}
                >
                  <span className="th-content">
                    Taxes on {fmtUSD(targetSalary)} (Click) {renderSortIndicator('fixedSalary.totalTax')}
                  </span>
                </th>
                <th
                  className={getHeaderClass('fixedSalary.totalColExpenses', 'collapsible-budget-header')}
                  onClick={() => handleSort('fixedSalary.totalColExpenses')}
                  title={`Estimated annual cost of your 6-category living basket (Housing, Food, Transportation, Utilities, Healthcare, Misc) on a ${fmtUSD(
                    targetSalary
                  )} salary. Click to sort or click any city row's basket cell for a Pie Chart & Budget Table.`}
                >
                  <span className="th-content">
                    Total COL Basket (Click for Pie) {renderSortIndicator('fixedSalary.totalColExpenses')}
                  </span>
                </th>
                <th
                  className={getHeaderClass('fixedSalary.leftover', 'leftover-col')}
                  onClick={() => handleSort('fixedSalary.leftover')}
                  title={`Net take-home pay minus your 6-category COL basket on ${fmtUSD(
                    targetSalary
                  )}, plus how much more or less discretionary money you keep compared to ${baseCity.code}.`}
                >
                  <span className="th-content">
                    Leftover from {fmtUSD(targetSalary)} {renderSortIndicator('fixedSalary.leftover')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCities.map((c) => {
                const isBase = c.id === baseCity.id;
                const f = c.fixedSalary;
                const cr = c.career;
                const leftoverVal = Number(f.leftover) || 0;
                const leftoverPos = leftoverVal >= 0;
                const leftoverDelta = leftoverVal - baseLeftover;
                const tot = Math.max(1, Number(f.totalColExpenses) || 1);

                return (
                  <tr key={c.id} className={isBase ? 'base-city-row' : ''}>
                    <td className="sticky-col">
                      <div className="city-cell">
                        <strong>
                          {c.city}, {c.state}
                        </strong>
                        <span className="city-code-badge">{c.code}</span>
                        {c.isInternational && <span className="intl-badge">INTL</span>}
                        {!isBase ? (
                          <button
                            type="button"
                            className="compare-row-btn"
                            title={`Compare ${baseCity.code} vs. ${c.code} side-by-side`}
                            onClick={() => onCompareCity(c)}
                          >
                            <ArrowLeftRight size={11} /> Compare
                          </button>
                        ) : (
                          <span className="base-tag">Base</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="index-pill">{c.weightedColIndex}</span>
                      <small className={c.colDiffPercent > 0 ? 'diff-up' : 'diff-down'}>
                        {c.colDiffPercent > 0 ? `+${c.colDiffPercent}%` : `${c.colDiffPercent}%`} vs {baseCity.code}
                      </small>
                    </td>

                    <td className="highlight-col">
                      <div className="equiv-salary">{fmtUSD(c.equivalentGrossNeeded)}</div>
                      <small className={c.salaryDeltaNeeded > 0 ? 'diff-up' : 'diff-down'}>
                        {c.salaryDeltaNeeded === 0
                          ? 'Base Benchmark'
                          : c.salaryDeltaNeeded > 0
                          ? `Need +${fmtUSD(c.salaryDeltaNeeded)}`
                          : `Save ${fmtUSD(Math.abs(c.salaryDeltaNeeded))}`}
                      </small>
                    </td>

                    <td>
                      <div className="wage-cell-main">
                        <strong>Min: ${Number(c.minWageHourly || 0).toFixed(2)}/hr</strong>{' '}
                        <span className="wage-annual-sub">({fmtUSD(c.minWageAnnualFullTime)}/yr)</span>
                      </div>
                      <small className="sub-breakdown">
                        Median: <strong>{fmtUSD(c.medianWageAnnual)}</strong> ({c.salaryToMedianRatio}x median)
                      </small>
                    </td>

                    <td
                      className="clickable-career-cell"
                      onClick={() => onInspectCareer(c)}
                      title={`Click to inspect ${cr.careerTitle} demand, salary histogram, wage percentiles & BLS series in ${c.city}`}
                    >
                      <div className="tax-cell-top">
                        <strong className={`text-${cr.viabilityTone}`}>{cr.viabilityScore}/100</strong>
                        <span>
                          • {cr.apiStatus.anyLive ? fmtUSD(cr.roleMedianSalary) : `~${fmtUSD(cr.roleMedianSalary)}`}
                        </span>
                        <span className="career-inspect-badge">Jobs</span>
                      </div>
                      <small className="sub-breakdown">
                        {cr.apiStatus.anyLive
                          ? `${cr.activeVacancies.toLocaleString()} open • ${cr.unemploymentRate}% unemp.`
                          : 'No Job/LMI API Key (Est. • Click)'}
                      </small>
                    </td>

                    <td
                      className="clickable-tax-cell"
                      onClick={() => onInspectTax(c)}
                      title="Click to see where salary tax implications exist most"
                    >
                      <div className="tax-cell-top">
                        <strong>{fmtUSD(f.totalTax)}</strong> ({f.effectiveTaxRate}%)
                        <span className="inspect-badge">Inspect</span>
                      </div>
                      <small className="sub-breakdown">
                        Fed: {fmtUSD(f.federalTax)} | St: {fmtUSD(f.stateTax)}
                        {f.localTax > 0 ? ` | Loc: ${fmtUSD(f.localTax)}` : ''} | FICA: {fmtUSD(f.ficaTax)}
                      </small>
                    </td>

                    <td
                      className="collapsed-budget-cell"
                      onClick={() => onInspectBudget(c)}
                      title="Click to view 6-category Pie Chart & Budget Table"
                    >
                      <div className="collapsed-budget-top">
                        <strong>{fmtUSD(f.totalColExpenses)}/yr</strong>
                        <span className="expand-link">Pie &amp; Table ▸</span>
                      </div>
                      <div className="mini-stack-bar">
                        <span style={{ width: `${(f.housingSpend / tot) * 100}%`, background: '#3b82f6' }} />
                        <span style={{ width: `${(f.foodSpend / tot) * 100}%`, background: '#8b5cf6' }} />
                        <span style={{ width: `${(f.transportationSpend / tot) * 100}%`, background: '#f97316' }} />
                        <span style={{ width: `${(f.utilitiesSpend / tot) * 100}%`, background: '#06b6d4' }} />
                        <span style={{ width: `${(f.healthcareSpend / tot) * 100}%`, background: '#ec4899' }} />
                        <span style={{ width: `${(f.miscSpend / tot) * 100}%`, background: '#a855f7' }} />
                      </div>
                      <small className="sub-breakdown">
                        Housing: {fmtUSD(f.housingSpend)} • Food: {fmtUSD(f.foodSpend)} • +4 more
                      </small>
                    </td>

                    <td className="leftover-col">
                      <span className={leftoverPos ? 'leftover-positive' : 'leftover-negative'}>
                        {leftoverPos ? '+' : ''}
                        {fmtUSD(leftoverVal)}
                      </span>
                      <small
                        style={{
                          display: 'block',
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          marginTop: '0.1rem',
                          color: isBase
                            ? '#94a3b8'
                            : leftoverDelta >= 0
                            ? '#34d399'
                            : '#f87171'
                        }}
                      >
                        {isBase
                          ? `Base (${baseCity.code}) Benchmark`
                          : leftoverDelta >= 0
                          ? `Keep +${fmtUSD(leftoverDelta)} vs ${baseCity.code}`
                          : `${fmtUSD(leftoverDelta)} vs ${baseCity.code}`}
                      </small>
                      <small className="sub-breakdown">Net Take-Home: {fmtUSD(f.netTakeHome)}</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}