// src/components/TaxBreakdownModal.jsx
import React from "react";
import { X, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Bar } from "react-chartjs-2";

const fmtUSD = (val) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);

export function TaxBreakdownModal({ city, baseCity, taxProfile, onClose }) {
  if (!city) return null;

  const t = city.fixedSalary;
  const b = baseCity.fixedSalary;
  const taxDiff = t.totalTax - b.totalTax;

  const chartData = {
    labels: [
      "Federal Income Tax",
      "State Income Tax",
      "Local City Wage Tax",
      "Social Security (6.2%)",
      "Medicare (1.45%+)",
    ],
    datasets: [
      {
        label: `${city.city}, ${city.state} (${city.code})`,
        data: [
          t.federalTax,
          t.stateTax,
          t.localTax,
          t.socialSecurityTax,
          t.medicareTax,
        ],
        backgroundColor: "#ef4444",
        borderRadius: 5,
      },
      {
        label: `Base City: ${baseCity.city}, ${baseCity.state} (${baseCity.code})`,
        data: [
          b.federalTax,
          b.stateTax,
          b.localTax,
          b.socialSecurityTax,
          b.medicareTax,
        ],
        backgroundColor: "#38bdf8",
        borderRadius: 5,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#e2e8f0" } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${fmtUSD(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#cbd5e1",
          callback: (v) => "$" + (v / 1000).toFixed(0) + "k",
        },
        grid: { color: "rgba(148, 163, 184, 0.15)" },
      },
      y: {
        ticks: { color: "#f8fafc" },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card tax-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <div>
            <h3>
              Salary Tax Implications Inspector: {city.city}, {city.state} (
              {city.code})
            </h3>
            <p className="modal-sub">
              Gross Salary: <strong>{fmtUSD(t.gross)}</strong> • Filing:{" "}
              <strong style={{ textTransform: "uppercase" }}>
                {taxProfile.filingStatus}
              </strong>{" "}
              • Household Size: <strong>{taxProfile.householdSize}</strong> (
              {taxProfile.dependents} Dependents)
            </p>
          </div>
          <button className="btn-secondary" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Top KPI Summary Cards */}
        <div className="tax-kpi-grid">
          <div className="tax-kpi-box">
            <span>Total Annual Tax Burden</span>
            <strong className="text-red">{fmtUSD(t.totalTax)}</strong>
            <small>Effective Tax Rate: {t.effectiveTaxRate}% of Gross</small>
          </div>
          <div className="tax-kpi-box">
            <span>Combined Marginal Rate</span>
            <strong className="text-amber">{t.marginalTotalRate}%</strong>
            <small>
              Next $1 earned taxed at {t.marginalTotalRate}¢ (Fed{" "}
              {t.marginalFedRate}%)
            </small>
          </div>
          <div className="tax-kpi-box">
            <span>Tax Delta vs. {baseCity.code}</span>
            <strong className={taxDiff > 0 ? "text-red" : "text-green"}>
              {taxDiff > 0
                ? `+${fmtUSD(taxDiff)} More Tax`
                : `${fmtUSD(Math.abs(taxDiff))} Less Tax`}
            </strong>
            <small>
              Base City ({baseCity.code}) Total Tax: {fmtUSD(b.totalTax)}
            </small>
          </div>
          <div className="tax-kpi-box">
            <span>Net Take-Home Pay</span>
            <strong className="text-green">{fmtUSD(t.netTakeHome)}</strong>
            <small>After {fmtUSD(t.preTaxDeductions)} 401(k)/HSA & Taxes</small>
          </div>
        </div>

        {/* Where Salary Tax Implications Hit Most */}
        <div className="tax-drivers-panel">
          <h4>
            <ShieldAlert size={16} /> Where Salary Tax Implications Hit Most in{" "}
            {city.city}
          </h4>
          <ul>
            {t.primaryTaxDrivers.map((driver, i) => (
              <li key={i}>
                {driver.includes("0% State") || driver.includes("reduce") ? (
                  <CheckCircle2 size={15} className="text-green" />
                ) : (
                  <AlertCircle size={15} className="text-amber" />
                )}
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Side-by-Side Chart & Marginal Bracket Waterfall */}
        <div className="tax-modal-split">
          <div className="tax-chart-box">
            <h4>
              Component Tax Comparison ({city.code} vs. {baseCity.code})
            </h4>
            <div style={{ height: "235px" }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="tax-waterfall-box">
            <h4>
              Federal Marginal Bracket Waterfall (Taxable:{" "}
              {fmtUSD(t.taxableFederalIncome)})
            </h4>
            <table className="mini-bracket-table">
              <thead>
                <tr>
                  <th>Tax Bracket Tier</th>
                  <th>Income in Tier</th>
                  <th>Tax Owed</th>
                </tr>
              </thead>
              <tbody>
                {t.bracketBreakdown.map((tier, idx) => (
                  <tr
                    key={idx}
                    className={
                      tier.taxableInTier > 0 ? "active-tier" : "inactive-tier"
                    }
                  >
                    <td>{tier.label}</td>
                    <td>{fmtUSD(tier.taxableInTier)}</td>
                    <td>{fmtUSD(tier.taxInTier)}</td>
                  </tr>
                ))}
                {t.dependentTaxCredit > 0 && (
                  <tr className="credit-row">
                    <td colSpan={2}>
                      Child / Dependent Tax Credit ({taxProfile.dependents}x)
                    </td>
                    <td>-{fmtUSD(t.dependentTaxCredit)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
