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
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';

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

const fmtUSD = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Builds a custom SVG House + Alert DivIcon colored with the city's buying-power fill color
 */
function createLowHousingDivIcon(fillColor, isBase) {
  const size = isBase ? 30 : 26;
  return divIcon({
    className: 'low-housing-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.65));
      ">
        <svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 3L3 12.2H6.5V24H21.5V12.2H25L14 3Z" fill="${fillColor}" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
          <path d="M14 10.5V16" stroke="#0f172a" stroke-width="2.3" stroke-linecap="round"/>
          <circle cx="14" cy="19.5" r="1.4" fill="#0f172a"/>
        </svg>
      </div>
    `
  });
}

export function CostChartView({ cities, baseCity, targetSalary }) {
  const displayCities = cities.slice(0, 18);
  const labels = displayCities.map(
    (c) => `${c.city}, ${c.state}${c.housing?.isHousingUnderBudget ? ' ⚠ Low Housing' : ''}`
  );

  const underBudgetCount = displayCities.filter((c) => c.housing?.isHousingUnderBudget).length;

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
      {underBudgetCount > 0 && (
        <p className="viz-caption" style={{ color: '#fbbf24' }}>
          ⚠ {underBudgetCount} shown {underBudgetCount === 1 ? 'city has' : 'cities have'} a housing budget allocation below the HUD Fair Market Rent / housing benchmark.
        </p>
      )}
    </div>
  );
}

export function CostMapView({ cities, baseCity, targetSalary, onInspectTax, onInspectBudget }) {
  const getMarkerColor = (city) => {
    if (city.id === baseCity.id) return '#38bdf8';
    if (city.fixedSalary.leftover < 0) return '#ef4444';

    const salaryRatio = city.equivalentGrossNeeded / Math.max(1, targetSalary);
    if (salaryRatio <= 1.02) return '#10b981';
    if (salaryRatio <= 1.15) return '#f59e0b';
    return '#ef4444';
  };

  const moderateCutoff = Math.round(targetSalary * 1.15);

  const renderPopupContent = (city, lowHousing) => {
    const leftoverDiffVsBase = city.fixedSalary.leftover - baseCity.fixedSalary.leftover;
    const h = city.housing;

    return (
      <Popup>
        <div className="map-popup">
          <h4>
            {city.city}, {city.state} ({city.code})
          </h4>
          {lowHousing && (
            <p style={{ color: '#b45309', fontWeight: 700, margin: '0.2rem 0' }}>
              ⚠ Housing budget ({fmtUSD(city.fixedSalary.housingSpend)}/yr) is below{' '}
              {fmtUSD(h?.recommendedAnnualHousingBenchmark)}/yr FMR benchmark!
            </p>
          )}
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
          {h && (
            <>
              <p>
                <strong>HUD 2-BR FMR:</strong> {fmtUSD(h.hudFairMarketRents?.br2)}/mo •{' '}
                <strong>RentCast Med:</strong> {fmtUSD(h.rentcast?.medianRentMonthly)}/mo
              </p>
              <p>
                <strong>Census Gross Rent / Home Val:</strong> {fmtUSD(h.censusHousing?.medianGrossRent)}/mo •{' '}
                {fmtUSD(h.censusHousing?.medianHomeValue)}
              </p>
            </>
          )}
          <p>
            <strong>Min Wage:</strong> ${Number(city.minWageHourly || 0).toFixed(2)}/hr •{' '}
            <strong>Median:</strong> {fmtUSD(city.medianWageAnnual)}
          </p>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
            {onInspectBudget && (
              <button
                type="button"
                className="popup-tax-btn"
                onClick={() => onInspectBudget(city)}
              >
                Housing & Budget
              </button>
            )}
            <button
              type="button"
              className="popup-tax-btn"
              onClick={() => onInspectTax(city)}
            >
              Taxes ({city.fixedSalary.effectiveTaxRate}%)
            </button>
          </div>
        </div>
      </Popup>
    );
  };

  return (
    <div className="viz-card">
      <div className="map-legend">
        <span>
          <i className="dot" style={{ background: '#38bdf8' }} /> Base City ({baseCity.city})
        </span>
        <span>
          <i className="dot" style={{ background: '#10b981' }} /> Cheaper / Equal vs. {baseCity.code} (Need ≤ {fmtUSD(targetSalary)})
        </span>
        <span>
          <i className="dot" style={{ background: '#f59e0b' }} /> Moderately Pricier (Need up to {fmtUSD(moderateCutoff)})
        </span>
        <span>
          <i className="dot" style={{ background: '#ef4444' }} /> High Cost (Need over {fmtUSD(moderateCutoff)})
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <svg width="15" height="15" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 3L3 12.2H6.5V24H21.5V12.2H25L14 3Z" fill="#94a3b8" stroke="#0f172a" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M14 10.5V16" stroke="#0f172a" strokeWidth="2.3" strokeLinecap="round" />
            <circle cx="14" cy="19.5" r="1.4" fill="#0f172a" />
          </svg>
          <strong>House Alert Icon</strong> = Housing Budget Below FMR (Same Color Scale)
        </span>
      </div>
      <div className="map-wrapper">
        <MapContainer center={[39.5, -96.5]} zoom={4} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cities.map((city) => {
            const isBase = city.id === baseCity.id;
            const lowHousing = Boolean(city.housing?.isHousingUnderBudget);
            const markerColor = getMarkerColor(city);

            if (lowHousing) {
              return (
                <Marker
                  key={city.id}
                  position={[city.lat, city.lng]}
                  icon={createLowHousingDivIcon(markerColor, isBase)}
                >
                  {renderPopupContent(city, true)}
                </Marker>
              );
            }

            return (
              <CircleMarker
                key={city.id}
                center={[city.lat, city.lng]}
                radius={isBase ? 10 : 7}
                pathOptions={{
                  color: '#0f172a',
                  weight: 1.5,
                  fillColor: markerColor,
                  fillOpacity: 0.88
                }}
              >
                {renderPopupContent(city, false)}
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}