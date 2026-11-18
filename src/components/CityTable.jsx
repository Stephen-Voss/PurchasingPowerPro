// src/components/CityTable.jsx
import React, { useState } from 'react';
import {
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

const fmtUSD = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export function CityTable({
  cities,
  baseCity,
  targetSalary,
  onSelectBaseCity,
  onInspectTax
}) {
  const [sortField, setSortField] = useState('equivalentGrossNeeded');
  const [sortAsc, setSortAsc] = useState(false);

  // Budget categories collapsed into 1 column by default
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(false);

  // Optional card view toggle for mobile/tablet users
  const [cardViewMode, setCardViewMode] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getValue = (item, path) => path.split('.').reduce((acc, part) => acc && acc[part], item);

  const sortedCities = [...cities].sort((a, b) => {
    const valA = getValue(a, sortField);
    const valB = getValue(b, sortField);
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const baseLeftover = baseCity?.fixedSalary?.leftover ?? 0;

  return (
    <div className="m3-table-surface">
      {/* Compact M3 Action Bar above table */}
      <div className="table-controls-banner">
        <div className="table-banner-left">
          <button
            type="button"
            className={isBudgetExpanded ? 'btn-expand-budget active' : 'btn-expand-budget'}
            onClick={() => setIsBudgetExpanded(!isBudgetExpanded)}
          >
            {isBudgetExpanded ? (
              <>
                <ChevronLeft size={15} /> Collapse 6 Budget Columns
              </>
            ) : (
              <>
                <ChevronRight size={15} /> Expand COL Basket (6 Categories)
              </>
            )}
          </button>
          <span className="table-hint-pill">
            <Sparkles size={13} /> Click any row&apos;s <strong>Taxes</strong> cell for tax breakdown
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

      {/* Optional Card Grid View */}
      {cardViewMode ? (
        <div className="mobile-cards-container">
          {sortedCities.map((c) => {
            const isBase = c.id === baseCity.id;
            const leftoverPos = c.fixedSalary.leftover >= 0;
            const leftoverDelta = c.fixedSalary.leftover - baseLeftover;

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
                    <button className="make-base-btn" onClick={() => onSelectBaseCity(c.id)}>
                      Set Base
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
                      {fmtUSD(c.fixedSalary.leftover)}
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
                      ${c.minWageHourly.toFixed(2)}/hr • {fmtUSD(c.medianWageAnnual)}
                    </strong>
                  </div>
                  <div onClick={() => onInspectTax(c)} className="mc-tax-clickable">
                    <span className="mc-label">Taxes (Tap to Inspect)</span>
                    <strong>
                      {fmtUSD(c.fixedSalary.totalTax)} ({c.fixedSalary.effectiveTaxRate}%)
                    </strong>
                  </div>
                </div>

                <div className="mc-budget-summary" onClick={() => setIsBudgetExpanded(!isBudgetExpanded)}>
                  <div className="mc-budget-row">
                    <span>Total 6-Category COL Basket:</span>
                    <strong>
                      {fmtUSD(c.fixedSalary.totalColExpenses)}/yr {isBudgetExpanded ? '▲' : '▼'}
                    </strong>
                  </div>
                  {isBudgetExpanded && (
                    <div className="mc-budget-breakdown">
                      <span>Housing: {fmtUSD(c.fixedSalary.housingSpend)}</span>
                      <span>Food: {fmtUSD(c.fixedSalary.foodSpend)}</span>
                      <span>Transit: {fmtUSD(c.fixedSalary.transportationSpend)}</span>
                      <span>Utilities: {fmtUSD(c.fixedSalary.utilitiesSpend)}</span>
                      <span>Health: {fmtUSD(c.fixedSalary.healthcareSpend)}</span>
                      <span>Misc: {fmtUSD(c.fixedSalary.miscSpend)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Isolated Horizontal Scroll Container for the Table */
        <div className="table-scroll-viewport">
          <table className="cost-table">
            <thead>
              <tr>
                <th className="sticky-col" onClick={() => handleSort('city')}>
                  City &amp; Region <ArrowUpDown size={13} />
                </th>
                <th onClick={() => handleSort('weightedColIndex')}>
                  Weighted COL <ArrowUpDown size={13} />
                </th>
                <th onClick={() => handleSort('equivalentGrossNeeded')} className="highlight-col">
                  Salary Needed (Match {baseCity.code}) <ArrowUpDown size={13} />
                </th>
                <th onClick={() => handleSort('medianWageAnnual')}>
                  Min &amp; Median Wage <ArrowUpDown size={13} />
                </th>
                <th onClick={() => handleSort('fixedSalary.totalTax')}>
                  Taxes on {fmtUSD(targetSalary)} (Click) <ArrowUpDown size={13} />
                </th>

                {!isBudgetExpanded ? (
                  <th
                    className="collapsible-budget-header"
                    onClick={() => setIsBudgetExpanded(true)}
                    title="Click to expand into Housing, Food, Transportation, Utilities, Healthcare, and Misc"
                  >
                    <div className="expand-header-inner">
                      <span>Total COL Basket (Click to Expand 6)</span>
                      <ChevronRight size={15} />
                    </div>
                  </th>
                ) : (
                  <>
                    <th
                      className="expanded-cat-header"
                      onClick={() => setIsBudgetExpanded(false)}
                      title="Click to collapse back into 1 column"
                    >
                      <ChevronLeft size={14} /> Housing
                    </th>
                    <th className="expanded-cat-header" onClick={() => handleSort('fixedSalary.foodSpend')}>
                      Food/Groceries <ArrowUpDown size={12} />
                    </th>
                    <th className="expanded-cat-header" onClick={() => handleSort('fixedSalary.transportationSpend')}>
                      Transportation <ArrowUpDown size={12} />
                    </th>
                    <th className="expanded-cat-header" onClick={() => handleSort('fixedSalary.utilitiesSpend')}>
                      Utilities <ArrowUpDown size={12} />
                    </th>
                    <th className="expanded-cat-header" onClick={() => handleSort('fixedSalary.healthcareSpend')}>
                      Healthcare <ArrowUpDown size={12} />
                    </th>
                    <th className="expanded-cat-header" onClick={() => handleSort('fixedSalary.miscSpend')}>
                      Misc <ArrowUpDown size={12} />
                    </th>
                  </>
                )}

                <th onClick={() => handleSort('fixedSalary.leftover')} className="leftover-col">
                  Leftover from {fmtUSD(targetSalary)} <ArrowUpDown size={13} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCities.map((c) => {
                const isBase = c.id === baseCity.id;
                const f = c.fixedSalary;
                const leftoverPos = f.leftover >= 0;
                const leftoverDelta = f.leftover - baseLeftover;
                const tot = Math.max(1, f.totalColExpenses);

                return (
                  <tr key={c.id} className={isBase ? 'base-city-row' : ''}>
                    <td className="sticky-col">
                      <div className="city-cell">
                        <strong>
                          {c.city}, {c.state}
                        </strong>
                        <span className="city-code-badge">{c.code}</span>
                        {c.isInternational && <span className="intl-badge">INTL</span>}
                        {!isBase && (
                          <button
                            className="make-base-btn"
                            title="Set as Base City"
                            onClick={() => onSelectBaseCity(c.id)}
                          >
                            Set Base
                          </button>
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
                        <strong>Min: ${c.minWageHourly.toFixed(2)}/hr</strong>{' '}
                        <span className="wage-annual-sub">({fmtUSD(c.minWageAnnualFullTime)}/yr)</span>
                      </div>
                      <small className="sub-breakdown">
                        Median: <strong>{fmtUSD(c.medianWageAnnual)}</strong> ({c.salaryToMedianRatio}x median)
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

                    {!isBudgetExpanded ? (
                      <td
                        className="collapsed-budget-cell"
                        onClick={() => setIsBudgetExpanded(true)}
                        title="Click to expand into all 6 budget categories"
                      >
                        <div className="collapsed-budget-top">
                          <strong>{fmtUSD(f.totalColExpenses)}/yr</strong>
                          <span className="expand-link">Expand 6 ▸</span>
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
                    ) : (
                      <>
                        <td className="expanded-cat-cell" onClick={() => setIsBudgetExpanded(false)}>
                          <div>{fmtUSD(f.housingSpend)}</div>
                          <small className="sub-breakdown">RPP {c.indices.housing}</small>
                        </td>
                        <td className="expanded-cat-cell" onClick={() => setIsBudgetExpanded(false)}>
                          <div>{fmtUSD(f.foodSpend)}</div>
                          <small className="sub-breakdown">RPP {c.indices.food}</small>
                        </td>
                        <td className="expanded-cat-cell" onClick={() => setIsBudgetExpanded(false)}>
                          <div>{fmtUSD(f.transportationSpend)}</div>
                          <small className="sub-breakdown">RPP {c.indices.transportation}</small>
                        </td>
                        <td className="expanded-cat-cell" onClick={() => setIsBudgetExpanded(false)}>
                          <div>{fmtUSD(f.utilitiesSpend)}</div>
                          <small className="sub-breakdown">RPP {c.indices.utilities}</small>
                        </td>
                        <td className="expanded-cat-cell" onClick={() => setIsBudgetExpanded(false)}>
                          <div>{fmtUSD(f.healthcareSpend)}</div>
                          <small className="sub-breakdown">RPP {c.indices.healthcare}</small>
                        </td>
                        <td className="expanded-cat-cell" onClick={() => setIsBudgetExpanded(false)}>
                          <div>{fmtUSD(f.miscSpend)}</div>
                          <small className="sub-breakdown">RPP {c.indices.misc}</small>
                        </td>
                      </>
                    )}

                    <td className="leftover-col">
                      <span className={leftoverPos ? 'leftover-positive' : 'leftover-negative'}>
                        {leftoverPos ? '+' : ''}
                        {fmtUSD(f.leftover)}
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