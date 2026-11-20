// src/components/BudgetBreakdownModal.jsx
import React from 'react';
import { X, PieChart as PieIcon, Wallet, Home, AlertTriangle, Info } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const fmtUSD = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

const CATEGORY_CONFIG = [
  { key: 'housing', label: 'Housing & Rent', spendField: 'housingSpend', indexKey: 'housing', color: '#3b82f6' },
  { key: 'food', label: 'Food & Groceries', spendField: 'foodSpend', indexKey: 'food', color: '#8b5cf6' },
  { key: 'transportation', label: 'Transportation', spendField: 'transportationSpend', indexKey: 'transportation', color: '#f97316' },
  { key: 'utilities', label: 'Utilities & Energy', spendField: 'utilitiesSpend', indexKey: 'utilities', color: '#06b6d4' },
  { key: 'healthcare', label: 'Healthcare', spendField: 'healthcareSpend', indexKey: 'healthcare', color: '#ec4899' },
  { key: 'misc', label: 'Miscellaneous', spendField: 'miscSpend', indexKey: 'misc', color: '#a855f7' }
];

export function BudgetBreakdownModal({ city, baseCity, targetSalary, onClose }) {
  if (!city) return null;

  const f = city.fixedSalary;
  const b = baseCity.fixedSalary;
  const h = city.housing;
  const totalBasket = Math.max(1, f.totalColExpenses);
  const basketDeltaVsBase = f.totalColExpenses - b.totalColExpenses;

  const rows = CATEGORY_CONFIG.map((cat) => {
    const annualSpend = f[cat.spendField] || 0;
    const baseAnnualSpend = b[cat.spendField] || 0;
    const monthlySpend = Math.round(annualSpend / 12);
    const sharePct = ((annualSpend / totalBasket) * 100).toFixed(1);
    const diffVsBase = annualSpend - baseAnnualSpend;
    const rppIndex = city.indices?.[cat.indexKey] ?? city.indices?.overall ?? 100;

    return {
      ...cat,
      annualSpend,
      monthlySpend,
      sharePct,
      diffVsBase,
      rppIndex
    };
  });

  const pieData = {
    labels: rows.map((r) => r.label),
    datasets: [
      {
        label: 'Annual Spend (USD)',
        data: rows.map((r) => r.annualSpend),
        backgroundColor: rows.map((r) => r.color),
        borderColor: '#131b2e',
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
          boxWidth: 12,
          padding: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = Number(ctx.raw || 0);
            const pct = ((val / totalBasket) * 100).toFixed(1);
            return `${ctx.label}: ${fmtUSD(val)}/yr (${pct}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card budget-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>
              Cost-of-Living & Housing Breakdown: {city.city}, {city.state} ({city.code})
            </h3>
            <p className="modal-sub">
              Evaluated on a <strong>{fmtUSD(targetSalary)}</strong> gross salary vs. Base City{' '}
              <strong>
                {baseCity.city} ({baseCity.code})
              </strong>{' '}
              • Weighted COL Index: <strong>{city.weightedColIndex}</strong>
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Under-Budget Housing Warning Banner */}
        {h?.isHousingUnderBudget && (
          <div className="housing-warning-banner">
            <AlertTriangle size={17} />
            <div>
              <strong>Housing Budget Below Benchmark ({fmtUSD(h.housingShortfallAnnual)}/yr gap):</strong>{' '}
              Your allocated housing spend of <strong>{fmtUSD(f.housingSpend)}/yr</strong> (
              {fmtUSD(Math.round(f.housingSpend / 12))}/mo) is below the{' '}
              <strong>{fmtUSD(h.recommendedAnnualHousingBenchmark)}/yr</strong> (
              {fmtUSD(h.recommendedMonthlyFmr)}/mo) HUD Fair Market Rent benchmark for this city & household size.
            </div>
          </div>
        )}

        {/* Unconfigured Housing APIs Notice */}
        {h && !h.apiStatus?.anyLive && (
          <div className="api-unconfigured-banner">
            <Info size={16} />
            <span>
              <strong>Housing APIs Not Configured:</strong> Showing calibrated estimates for RentCast, HUD Fair Market Rents, and Census ACS housing demographics. Add keys in <strong>BYOK APIs & Cache</strong> for live housing feeds.
            </span>
          </div>
        )}

        {/* Top Summary Strip */}
        <div className="budget-kpi-grid">
          <div className="tax-kpi-box">
            <span>Total Annual COL Basket</span>
            <strong className="text-amber">{fmtUSD(f.totalColExpenses)}/yr</strong>
            <small>{fmtUSD(Math.round(f.totalColExpenses / 12))}/mo across 6 categories</small>
          </div>
          <div className="tax-kpi-box">
            <span>Basket Delta vs. {baseCity.code}</span>
            <strong className={basketDeltaVsBase > 0 ? 'text-red' : 'text-green'}>
              {basketDeltaVsBase > 0
                ? `+${fmtUSD(basketDeltaVsBase)}/yr`
                : basketDeltaVsBase < 0
                ? `${fmtUSD(basketDeltaVsBase)}/yr`
                : '$0/yr (Base)'}
            </strong>
            <small>Base ({baseCity.code}) Basket: {fmtUSD(b.totalColExpenses)}/yr</small>
          </div>
          <div className="tax-kpi-box">
            <span>Net Take-Home Pay</span>
            <strong className="text-green">{fmtUSD(f.netTakeHome)}/yr</strong>
            <small>After {fmtUSD(f.totalTax)} taxes & {fmtUSD(f.preTaxDeductions)} pre-tax</small>
          </div>
          <div className="tax-kpi-box">
            <span>Net Leftover / Discretionary</span>
            <strong className={f.leftover >= 0 ? 'text-green' : 'text-red'}>
              {f.leftover >= 0 ? '+' : ''}
              {fmtUSD(f.leftover)}/yr
            </strong>
            <small>{fmtUSD(Math.round(f.leftover / 12))}/mo after COL expenses</small>
          </div>
        </div>

        {/* Circular Pie Chart + Compact Category Table */}
        <div className="budget-modal-split">
          <div className="budget-pie-box">
            <h4>
              <PieIcon size={15} /> Spending Share (Pie Chart)
            </h4>
            <div className="budget-pie-wrapper">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          <div className="budget-table-box">
            <h4>
              <Wallet size={15} /> Category Budget Table
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="mini-budget-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>RPP</th>
                    <th>Annual</th>
                    <th>Monthly</th>
                    <th>Share</th>
                    <th>vs {baseCity.code}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <span className="cat-color-dot" style={{ backgroundColor: r.color }} />
                        <strong>{r.label}</strong>
                      </td>
                      <td>{r.rppIndex}</td>
                      <td>
                        <strong>{fmtUSD(r.annualSpend)}</strong>
                      </td>
                      <td>{fmtUSD(r.monthlySpend)}</td>
                      <td>{r.sharePct}%</td>
                      <td className={r.diffVsBase > 0 ? 'diff-cell-up' : 'diff-cell-down'}>
                        {city.id === baseCity.id
                          ? '—'
                          : r.diffVsBase > 0
                          ? `+${fmtUSD(r.diffVsBase)}`
                          : fmtUSD(r.diffVsBase)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="budget-total-row">
                    <td colSpan={2}>
                      <strong>Total COL Basket</strong>
                    </td>
                    <td>
                      <strong>{fmtUSD(f.totalColExpenses)}</strong>
                    </td>
                    <td>
                      <strong>{fmtUSD(Math.round(f.totalColExpenses / 12))}</strong>
                    </td>
                    <td>
                      <strong>100.0%</strong>
                    </td>
                    <td className={basketDeltaVsBase > 0 ? 'diff-cell-up' : 'diff-cell-down'}>
                      <strong>
                        {city.id === baseCity.id
                          ? 'Base'
                          : basketDeltaVsBase > 0
                          ? `+${fmtUSD(basketDeltaVsBase)}`
                          : fmtUSD(basketDeltaVsBase)}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Extensive Housing Breakdown: HUD Fair Market Rents + RentCast + Census ACS */}
        {h && (
          <div className="housing-deepdive-section">
            <h4>
              <Home size={16} /> Housing Market & Affordability Breakdown (HUD FMR, RentCast & Census ACS)
            </h4>

            <div className="housing-three-col">
              {/* 1. HUD Fair Market Rents (0-4 BR) & Affordability */}
              <div className="housing-subcard">
                <div className="housing-subcard-title">
                  <strong>HUD Fair Market Rents (0–4 BR)</strong>
                  <span className="inline-status-tag">
                    {h.apiStatus.hudLive ? 'HUD Live' : 'No HUD Token (Est.)'}
                  </span>
                </div>
                <p className="housing-meta-line">
                  2-BR Rent-to-Career-Pay Ratio: <strong>{h.rentToIncomeRatioPct}%</strong> • HUD Median Family Income:{' '}
                  <strong>{fmtUSD(h.medianFamilyIncomeLimit)}</strong>
                </p>
                <div className="fmr-bedroom-grid">
                  <div><span>Studio</span><strong>{fmtUSD(h.hudFairMarketRents.br0)}/mo</strong></div>
                  <div><span>1-BR</span><strong>{fmtUSD(h.hudFairMarketRents.br1)}/mo</strong></div>
                  <div><span>2-BR</span><strong>{fmtUSD(h.hudFairMarketRents.br2)}/mo</strong></div>
                  <div><span>3-BR</span><strong>{fmtUSD(h.hudFairMarketRents.br3)}/mo</strong></div>
                  <div><span>4-BR</span><strong>{fmtUSD(h.hudFairMarketRents.br4)}/mo</strong></div>
                </div>
              </div>

              {/* 2. RentCast Market Rents, Home Prices, DOM & Listings */}
              <div className="housing-subcard">
                <div className="housing-subcard-title">
                  <strong>RentCast Market & Listings</strong>
                  <span className="inline-status-tag">
                    {h.apiStatus.rentcastLive ? 'RentCast Live' : 'No RentCast Key (Est.)'}
                  </span>
                </div>
                <ul className="housing-stat-list">
                  <li><span>Avg / Median Monthly Rent:</span><strong>{fmtUSD(h.rentcast.avgRentMonthly)} / {fmtUSD(h.rentcast.medianRentMonthly)}</strong></li>
                  <li><span>Avg / Median Sale Price:</span><strong>{fmtUSD(h.rentcast.avgHomeSalePrice)} / {fmtUSD(h.rentcast.medianHomeSalePrice)}</strong></li>
                  <li><span>Days on Market (DOM):</span><strong>{h.rentcast.daysOnMarket} days</strong></li>
                  <li><span>Active Listings Tracked:</span><strong>{h.rentcast.activeListingsCount.toLocaleString()}</strong></li>
                  <li><span>5-Yr Trend (2022 → 2026):</span><strong>{fmtUSD(h.rentcast.rentTrendHistory?.[0]?.monthlyRent)} → {fmtUSD(h.rentcast.rentTrendHistory?.[4]?.monthlyRent)}/mo</strong></li>
                </ul>
              </div>

              {/* 3. U.S. Census ACS Housing Demographics */}
              <div className="housing-subcard">
                <div className="housing-subcard-title">
                  <strong>Census ACS Housing Demographics</strong>
                  <span className="inline-status-tag">
                    {h.apiStatus.censusLive ? 'Census ACS Live' : 'No Census Key (Est.)'}
                  </span>
                </div>
                <ul className="housing-stat-list">
                  <li><span>Median Gross Rent (B25064):</span><strong>{fmtUSD(h.censusHousing.medianGrossRent)}/mo</strong></li>
                  <li><span>Median Home Value (B25077):</span><strong>{fmtUSD(h.censusHousing.medianHomeValue)}</strong></li>
                  <li><span>Renter vs. Owner Mix (B25003):</span><strong>{h.censusHousing.renterOccupancyPct}% Renter / {h.censusHousing.ownerOccupancyPct}% Owner</strong></li>
                  <li><span>Housing Vacancy Rate (B25002):</span><strong>{h.censusHousing.vacancyRatePct}%</strong></li>
                  <li><span>Median Commute Time:</span><strong>{h.censusHousing.medianCommuteMins} mins</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}