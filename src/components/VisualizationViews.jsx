// src/components/VisualizationViews.jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend
);

const fmtUSD = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export function CostChartView({ cities, baseCity, targetSalary }) {
  const displayCities = cities.slice(0, 18);
  const labels = displayCities.map((c) => `${c.city}, ${c.state}`);

  const data = {
    labels,
    datasets: [
      {
        type: 'line',
        label: `Salary Needed (vs ${baseCity.code})`,
        data: displayCities.map((c) => c.equivalentGrossNeeded),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        borderWidth: 2.5,
        pointRadius: 4,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Taxes',
        data: displayCities.map((c) => c.fixedSalary.totalTax),
        backgroundColor: '#ef4444',
        stack: 'salaryAllocation'
      },
      {
        type: 'bar',
        label: 'Housing',
        data: displayCities.map((c) => c.fixedSalary.housingSpend),
        backgroundColor: '#3b82f6',
        stack: 'salaryAllocation'
      },
      {
        type: 'bar',
        label: 'Food',
        data: displayCities.map((c) => c.fixedSalary.foodSpend),
        backgroundColor: '#8b5cf6',
        stack: 'salaryAllocation'
      },
      {
        type: 'bar',
        label: 'Transit',
        data: displayCities.map((c) => c.fixedSalary.transportationSpend),
        backgroundColor: '#f97316',
        stack: 'salaryAllocation'
      },
      {
        type: 'bar',
        label: 'Utilities',
        data: displayCities.map((c) => c.fixedSalary.utilitiesSpend),
        backgroundColor: '#06b6d4',
        stack: 'salaryAllocation'
      },
      {
        type: 'bar',
        label: 'Healthcare',
        data: displayCities.map((c) => c.fixedSalary.healthcareSpend),
        backgroundColor: '#ec4899',
        stack: 'salaryAllocation'
      },
      {
        type: 'bar',
        label: 'Misc',
        data: displayCities.map((c) => c.fixedSalary.miscSpend),
        backgroundColor: '#a855f7',
        stack: 'salaryAllocation'
      },
      {
        type: 'bar',
        label: `Leftover on ${fmtUSD(targetSalary)}`,
        data: displayCities.map((c) => Math.max(0, c.fixedSalary.leftover)),
        backgroundColor: '#10b981',
        stack: 'salaryAllocation'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 220 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#cbd5e1', boxWidth: 12, padding: 12, font: { size: 11 } }
      },
      title: {
        display: true,
        text: `Where ${fmtUSD(targetSalary)} Goes per City (Stacked Bars) vs. Equivalent Salary Needed (Amber Line)`,
        color: '#f8fafc',
        font: { size: 13, weight: '600' }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${fmtUSD(ctx.raw)}`
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 25, font: { size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.08)' }
      },
      y: {
        stacked: true,
        ticks: {
          color: '#94a3b8',
          callback: (value) => '$' + (value / 1000).toFixed(0) + 'k'
        },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      }
    }
  };

  return (
    <div className="viz-card">
      <div className="chart-wrapper">
        <Chart type="bar" data={data} options={options} />
      </div>
    </div>
  );
}

export function CostMapView({ cities, baseCity, targetSalary, onInspectTax }) {
  /**
   * Colors each city marker dynamically relative to the Base City & Target Salary:
   * - Cyan (#38bdf8): Base City
   * - Green (#10b981): Stronger/Equal Buying Power (Equivalent salary needed <= Target Salary + 2%)
   * - Amber (#f59e0b): Moderately Pricier (Needs +2% to +15% more salary than Base City)
   * - Red (#ef4444): Significantly Pricier (Needs >15% more salary than Base City, or negative leftover)
   */
  const getMarkerColor = (city) => {
    if (city.id === baseCity.id) return '#38bdf8';
    if (city.fixedSalary.leftover < 0) return '#ef4444';

    const salaryRatio = city.equivalentGrossNeeded / Math.max(1, targetSalary);
    if (salaryRatio <= 1.02) return '#10b981'; // Cheaper or equal to Base City (e.g. Arkansas vs STL)
    if (salaryRatio <= 1.15) return '#f59e0b'; // Up to 15% more expensive than Base City
    return '#ef4444'; // Over 15% more expensive than Base City
  };

  const moderateCutoff = Math.round(targetSalary * 1.15);

  return (
    <div className="viz-card">
      <div className="map-legend">
        <span>
          <i className="dot" style={{ background: '#38bdf8' }} /> Base City ({baseCity.city})
        </span>
        <span>
          <i className="dot" style={{ background: '#10b981' }} /> Cheaper / Equal vs. {baseCity.code} (Need &le; {fmtUSD(targetSalary)})
        </span>
        <span>
          <i className="dot" style={{ background: '#f59e0b' }} /> Moderately Pricier (Need up to {fmtUSD(moderateCutoff)})
        </span>
        <span>
          <i className="dot" style={{ background: '#ef4444' }} /> High Cost (Need over {fmtUSD(moderateCutoff)})
        </span>
      </div>
      <div className="map-wrapper">
        <MapContainer center={[39.5, -96.5]} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cities.map((city) => {
            const leftoverDiffVsBase = city.fixedSalary.leftover - baseCity.fixedSalary.leftover;
            return (
              <CircleMarker
                key={city.id}
                center={[city.lat, city.lng]}
                radius={city.id === baseCity.id ? 10 : 7}
                pathOptions={{
                  color: '#0f172a',
                  weight: 1.5,
                  fillColor: getMarkerColor(city),
                  fillOpacity: 0.88
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <h4>
                      {city.city}, {city.state} ({city.code})
                    </h4>
                    <p>
                      <strong>Salary Needed (vs {baseCity.code}):</strong> {fmtUSD(city.equivalentGrossNeeded)}
                    </p>
                    <p>
                      <strong>Leftover on {fmtUSD(targetSalary)}:</strong>{' '}
                      <span style={{ color: city.fixedSalary.leftover >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                        {fmtUSD(city.fixedSalary.leftover)}/yr
                      </span>{' '}
                      {city.id !== baseCity.id && (
                        <small style={{ color: leftoverDiffVsBase >= 0 ? '#059669' : '#dc2626' }}>
                          ({leftoverDiffVsBase >= 0 ? `+${fmtUSD(leftoverDiffVsBase)}` : fmtUSD(leftoverDiffVsBase)} vs {baseCity.code})
                        </small>
                      )}
                    </p>
                    <p>
                      <strong>Min Wage:</strong> ${city.minWageHourly.toFixed(2)}/hr • <strong>Median:</strong> {fmtUSD(city.medianWageAnnual)}
                    </p>
                    <button
                      type="button"
                      className="popup-tax-btn"
                      onClick={() => onInspectTax(city)}
                    >
                      Inspect {city.code} Taxes ({city.fixedSalary.effectiveTaxRate}%)
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}