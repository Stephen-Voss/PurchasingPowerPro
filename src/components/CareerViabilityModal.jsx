// src/components/CareerViabilityModal.jsx
import React, { useState } from 'react';
import {
  X,
  Briefcase,
  TrendingUp,
  Building2,
  Wrench,
  Activity,
  BarChart2,
  Info
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';

const fmtUSD = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return 'No API Key';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

export function CareerViabilityModal({ city, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!city || !city.career) return null;
  const c = city.career;

  const histogramChartData = {
    labels: c.salaryHistogram.map((b) => b.rangeLabel),
    datasets: [
      {
        label: c.apiStatus.adzunaLive
          ? 'Job Postings (Adzuna Live)'
          : 'Est. Job Postings (No Adzuna Key)',
        data: c.salaryHistogram.map((b) => Number(b.jobCount) || 0),
        backgroundColor: '#38bdf8',
        borderRadius: 5
      }
    ]
  };

  const trendChartData = {
    labels: c.historicalSalaryTrend.map((pt) => pt.year),
    datasets: [
      {
        label: `${c.careerTitle} Median Salary ($/yr)`,
        data: c.historicalSalaryTrend.map((pt) => Number(pt.medianSalary) || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#e2e8f0', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ctx.dataset.label.includes('Salary')
              ? `${ctx.dataset.label}: ${fmtUSD(ctx.raw)}`
              : `${ctx.dataset.label}: ${Number(ctx.raw || 0)} roles`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card career-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>
              Career Viability &amp; Labor Market: {c.careerTitle} in {city.city}, {city.state} ({city.code})
            </h3>
            <p className="modal-sub">
              Category: <strong>{c.careerCategory}</strong> • SOC Code: <strong>{c.socCode}</strong> •
              Viability Score:{' '}
              <strong className={`text-${c.viabilityTone}`}>
                {c.viabilityScore}/100 ({c.viabilityTier})
              </strong>
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Clear Notice When Live API Keys Are Not Configured */}
        {!c.apiStatus.anyLive && (
          <div className="api-unconfigured-banner">
            <Info size={16} />
            <span>
              <strong>Live Job/Labor APIs Not Configured:</strong> Showing calibrated baseline estimates because no Adzuna, CareerOneStop, or BLS API key is entered yet. Open <strong>BYOK APIs &amp; Cache</strong> in the header to connect live API keys.
            </span>
          </div>
        )}

        {/* Top 4 KPI Cards */}
        <div className="career-kpi-grid">
          <div className="tax-kpi-box">
            <span>Local Role Median Wage</span>
            <strong className="text-green">{fmtUSD(c.roleMedianSalary)}/yr</strong>
            <small>
              ${Number(c.roleMedianHourly || 0).toFixed(2)}/hr •{' '}
              <span className={c.salaryGapVsEquivalent >= 0 ? 'text-green' : 'text-red'}>
                {c.salaryGapVsEquivalent >= 0
                  ? `+${fmtUSD(c.salaryGapVsEquivalent)} above COL-eq.`
                  : `${fmtUSD(c.salaryGapVsEquivalent)} vs COL-eq.`}
              </span>
            </small>
          </div>

          <div className="tax-kpi-box">
            <span>
              {c.apiStatus.adzunaLive ? 'Active Vacancies (Adzuna)' : 'Est. Vacancies (No Adzuna Key)'}
            </span>
            <strong className="text-amber">
              {c.apiStatus.adzunaLive
                ? `${c.activeVacancies.toLocaleString()} roles`
                : `~${c.activeVacancies.toLocaleString()} (Est.)`}
            </strong>
            <small>
              {c.apiStatus.cosLive
                ? `Annual Openings: ${c.annualJobOpenings.toLocaleString()}/yr`
                : `Openings: ~${c.annualJobOpenings.toLocaleString()}/yr (No COS Key)`}
            </small>
          </div>

          <div className="tax-kpi-box">
            <span>
              {c.apiStatus.cosLive ? 'Metro Employment (COS)' : 'Est. Metro Employment (No COS Key)'}
            </span>
            <strong style={{ color: '#38bdf8' }}>
              {c.apiStatus.cosLive
                ? c.totalMetroEmployment.toLocaleString()
                : `~${c.totalMetroEmployment.toLocaleString()} (Est.)`}
            </strong>
            <small>
              Demand Ratio: <strong>{c.demandRatio}</strong> roles / 100 workers
            </small>
          </div>

          <div className="tax-kpi-box">
            <span>
              {c.apiStatus.cosLive ? 'Unemployment Rate (COS)' : 'Est. Unemployment (No COS/BLS Key)'}
            </span>
            <strong className={c.unemploymentRate <= 4.0 ? 'text-green' : 'text-amber'}>
              {c.apiStatus.cosLive ? `${c.unemploymentRate}%` : `~${c.unemploymentRate}% (Est.)`}
            </strong>
            <small>
              {c.apiStatus.cosLive ? 'Live CareerOneStop / LAUS' : 'Add CareerOneStop/BLS key for live'}
            </small>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="career-subtabs">
          <button
            type="button"
            className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('overview')}
          >
            <Briefcase size={14} /> Demand, Percentiles &amp; Skills
          </button>
          <button
            type="button"
            className={activeTab === 'trends' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('trends')}
          >
            <TrendingUp size={14} /> Salary Histogram &amp; Trend
          </button>
          <button
            type="button"
            className={activeTab === 'bls' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('bls')}
          >
            <Activity size={14} /> BLS OEWS &amp; LAUS Time Series
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="career-modal-split">
            <div className="budget-table-box">
              <h4>
                <BarChart2 size={15} /> Local Wage Percentiles{' '}
                <span className="inline-status-tag">
                  {c.apiStatus.cosLive ? 'CareerOneStop Live' : 'Est. (No COS API Key)'}
                </span>
              </h4>
              <table className="mini-budget-table">
                <thead>
                  <tr>
                    <th>Percentile</th>
                    <th>Annual Salary</th>
                    <th>Est. Hourly</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10th Percentile (Entry)</td>
                    <td>{fmtUSD(c.percentiles.p10)}</td>
                    <td>${(c.percentiles.p10 / 2080).toFixed(2)}/hr</td>
                  </tr>
                  <tr>
                    <td>25th Percentile</td>
                    <td>{fmtUSD(c.percentiles.p25)}</td>
                    <td>${(c.percentiles.p25 / 2080).toFixed(2)}/hr</td>
                  </tr>
                  <tr className="budget-total-row">
                    <td>
                      <strong>50th Percentile (Median)</strong>
                    </td>
                    <td>
                      <strong>{fmtUSD(c.percentiles.p50)}</strong>
                    </td>
                    <td>
                      <strong>${(c.percentiles.p50 / 2080).toFixed(2)}/hr</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>75th Percentile</td>
                    <td>{fmtUSD(c.percentiles.p75)}</td>
                    <td>${(c.percentiles.p75 / 2080).toFixed(2)}/hr</td>
                  </tr>
                  <tr>
                    <td>90th Percentile (Senior)</td>
                    <td>{fmtUSD(c.percentiles.p90)}</td>
                    <td>${(c.percentiles.p90 / 2080).toFixed(2)}/hr</td>
                  </tr>
                </tbody>
              </table>

              <h4 style={{ marginTop: '1rem' }}>
                <Building2 size={15} /> Top Hiring Companies{' '}
                <span className="inline-status-tag">
                  {c.apiStatus.adzunaLive ? 'Adzuna Live' : 'Est. (No Adzuna API Key)'}
                </span>
              </h4>
              <div className="employer-list">
                {c.topCompanies.map((comp, idx) => (
                  <div key={idx} className="employer-row">
                    <span>{comp.name}</span>
                    <span className="m3-chip">
                      {c.apiStatus.adzunaLive
                        ? `${comp.openRoles} openings`
                        : `~${comp.openRoles} est. (No API Key)`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="budget-table-box">
              <h4>
                <Wrench size={15} /> Top Required Skills &amp; Tools
              </h4>
              <p className="helper-note" style={{ marginTop: 0, marginBottom: '0.6rem' }}>
                Core competencies and workplace tools for <strong>{c.careerTitle}</strong>:
              </p>
              <div className="skills-chip-cloud">
                {c.skills.map((sk) => (
                  <span key={sk} className="skill-pill">
                    {sk}
                  </span>
                ))}
              </div>

              <h4 style={{ marginTop: '1rem' }}>Recommended Tools &amp; Platforms</h4>
              <div className="skills-chip-cloud">
                {c.tools.map((tool) => (
                  <span key={tool} className="tool-pill">
                    {tool}
                  </span>
                ))}
              </div>

              <div className="viability-summary-box">
                <strong>Career Viability Assessment ({c.viabilityScore}/100):</strong> Local median pay for{' '}
                {c.careerTitle} covers <strong>{c.salaryCoveragePct}%</strong> of the{' '}
                {fmtUSD(city.equivalentGrossNeeded)} salary needed to match {city.code} buying power.{' '}
                {!c.apiStatus.anyLive &&
                  'Connect Adzuna, CareerOneStop, and BLS keys in BYOK APIs & Cache to replace estimates with live API figures.'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="career-modal-split">
            <div className="budget-pie-box">
              <h4>
                Salary Histogram{' '}
                <span className="inline-status-tag">
                  {c.apiStatus.adzunaLive ? 'Adzuna Live' : 'Est. (No Adzuna Key)'}
                </span>
              </h4>
              <div className="budget-pie-wrapper">
                <Bar data={histogramChartData} options={chartOptions} />
              </div>
            </div>
            <div className="budget-pie-box">
              <h4>
                Historical Role Salary Trend{' '}
                <span className="inline-status-tag">
                  {c.apiStatus.adzunaLive ? 'Adzuna Live' : 'Est. (No Adzuna Key)'}
                </span>
              </h4>
              <div className="budget-pie-wrapper">
                <Line data={trendChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bls' && (
          <div className="budget-table-box">
            <h4>
              BLS OEWS &amp; LAUS Time Series ({c.blsMeta.oewsSeriesId} / {c.blsMeta.lausSeriesId}){' '}
              <span className="inline-status-tag">
                {c.apiStatus.blsLive ? 'BLS API v2 Live' : 'Est. (No BLS Key)'}
              </span>
            </h4>
            <p className="helper-note" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
              {c.apiStatus.blsLive
                ? 'Live time series retrieved from the U.S. Bureau of Labor Statistics Public Data API v2.'
                : 'No BLS API key configured — displaying calibrated OEWS & LAUS time series estimates. Add a BLS API v2 key in BYOK APIs & Cache to pull live time series.'}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="mini-budget-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>OEWS Metro Employment</th>
                    <th>OEWS Mean Annual Wage</th>
                    <th>LAUS Unemployment Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {c.blsMeta.series.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{row.period}</strong>
                      </td>
                      <td>
                        {c.apiStatus.blsLive
                          ? Number(row.oewsEmployment || 0).toLocaleString()
                          : `~${Number(row.oewsEmployment || 0).toLocaleString()} (Est.)`}
                      </td>
                      <td>
                        {c.apiStatus.blsLive
                          ? fmtUSD(row.oewsMeanWage)
                          : `~${fmtUSD(row.oewsMeanWage)} (Est.)`}
                      </td>
                      <td>
                        {c.apiStatus.blsLive
                          ? `${row.lausUnemploymentRate}%`
                          : `~${row.lausUnemploymentRate}% (Est.)`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}