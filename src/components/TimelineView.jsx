// src/components/TimelineView.jsx
import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  Download,
  Trash2,
  TrendingUp,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  X,
  Landmark
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { parseSnapshotCsv, snapshotService } from '../services/snapshotService';
import {
  MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD,
  buildMockStateLegislativeQuarter
} from '../data/legislationData';

const TIMELINE_QUARTERS = [
  '2024-Q1',
  '2024-Q2',
  '2024-Q3',
  '2024-Q4',
  '2025-Q1', // Pretend quarter with no legislative data (neutral styling, no highlight)
  '2025-Q2',
  '2025-Q3',
  '2025-Q4',
  '2026-Q1',
  '2026-Q2',
  '2026-Q3',
  '2026-Q4'
];

const CITY_PALETTE = [
  '#38bdf8',
  '#10b981',
  '#f59e0b',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#6366f1',
  '#14b8a6'
];

const METRIC_OPTIONS = [
  { key: 'weightedColIndex', label: 'Weighted COL Index', isCurrency: false },
  { key: 'equivalentGrossNeeded', label: 'Equivalent Salary Needed ($/yr)', isCurrency: true },
  { key: 'leftover', label: 'Net Leftover Income ($/yr)', isCurrency: true },
  { key: 'housingSpend', label: 'Annual Housing Spend ($/yr)', isCurrency: true },
  { key: 'totalColExpenses', label: 'Total 6-Category COL Basket ($/yr)', isCurrency: true },
  { key: 'roleMedianSalary', label: 'Career Role Median Salary ($/yr)', isCurrency: true },
  { key: 'hudFmr2BrMonthly', label: 'HUD 2-BR Fair Market Rent ($/mo)', isCurrency: true }
];

const PARTY_BAND_STYLES = {
  D: {
    fill: 'rgba(59, 130, 246, 0.16)',
    border: 'rgba(59, 130, 246, 0.45)'
  },
  R: {
    fill: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.45)'
  },
  I: {
    fill: 'rgba(168, 85, 247, 0.18)',
    border: 'rgba(168, 85, 247, 0.45)'
  },
  Split: {
    fill: 'rgba(168, 85, 247, 0.14)',
    border: 'rgba(168, 85, 247, 0.4)'
  },
  NONE: {
    fill: 'rgba(148, 163, 184, 0.05)',
    border: 'rgba(148, 163, 184, 0.2)'
  }
};

const fmtUSD = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

function dateToQuarterKey(isoDateStr) {
  const d = new Date(`${isoDateStr || '2026-10-01'}T12:00:00Z`);
  const year = Number.isNaN(d.getUTCFullYear()) ? 2026 : d.getUTCFullYear();
  const q = Math.floor((Number.isNaN(d.getUTCMonth()) ? 9 : d.getUTCMonth()) / 3) + 1;
  return `${year}-Q${q}`;
}

function resolveQuarterRecordSafe(qKey) {
  const quartersMap = MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD?.quarters || {};
  if (quartersMap[qKey]) {
    return quartersMap[qKey];
  }
  const is2024 = String(qKey).startsWith('2024');
  return {
    quarter: qKey,
    hasData: qKey !== '2025-Q1',
    noDataReason:
      qKey === '2025-Q1'
        ? 'Simulated gap: No legislative or roll-call records logged for 2025-Q1.'
        : '',
    federalPower: is2024
      ? {
          president: { name: 'Joseph R. Biden Jr.', party: 'D' },
          vicePresident: { name: 'Kamala D. Harris', party: 'D' },
          senate: { dem: 51, rep: 49, ind: 0, control: 'D' },
          house: { dem: 213, rep: 220, ind: 0, control: 'R' }
        }
      : {
          president: { name: 'Donald J. Trump', party: 'R' },
          vicePresident: { name: 'JD Vance', party: 'R' },
          senate: { dem: 45, rep: 53, ind: 2, control: 'R' },
          house: { dem: 214, rep: 218, ind: 0, control: 'R' }
        },
    federalBills: []
  };
}

export function TimelineView({
  trackedCities,
  baseCity,
  snapshots,
  onSnapshotsChange,
  onExportCurrentCsv,
  onInspectQuarter
}) {
  const [selectedMetricKey, setSelectedMetricKey] = useState('weightedColIndex');
  const [backgroundPartyScope, setBackgroundPartyScope] = useState('federal');
  const [includeCurrentLive, setIncludeCurrentLive] = useState(true);
  const [uploadFeedback, setUploadFeedback] = useState('');
  const fileInputRef = useRef(null);

  const activeMetric =
    METRIC_OPTIONS.find((m) => m.key === selectedMetricKey) || METRIC_OPTIONS[0];

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let totalImportedSnapshots = 0;
    let totalCityRows = 0;
    const errors = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const parsedList = parseSnapshotCsv(text, file.name);
        snapshotService.upsertMany(parsedList);
        totalImportedSnapshots += parsedList.length;
        for (const s of parsedList) {
          totalCityRows += Object.keys(s.recordsByCityId).length;
        }
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    onSnapshotsChange(snapshotService.getAll());
    if (errors.length > 0) {
      setUploadFeedback(`Error: ${errors.join(' | ')}`);
    } else {
      setUploadFeedback(
        `Loaded ${totalImportedSnapshots} snapshot(s) covering ${totalCityRows} city records from ${files.length} CSV file(s).`
      );
    }
    e.target.value = '';
  };

  const handleLoadSampleHistory = () => {
    const samples = snapshotService.generateSampleHistoricalSnapshots(trackedCities);
    const updated = snapshotService.upsertMany(samples);
    onSnapshotsChange(updated);
    setUploadFeedback(
      'Saved continuous 2024-Q1 through 2026-Q3 CSV snapshots into localStorage.'
    );
  };

  const focusCity =
    trackedCities.find((c) => c.id !== baseCity?.id) || baseCity || trackedCities[0];

  // Always renders all 12 consecutive quarters (2024-Q1 through 2026-Q4) with zero gaps
  const timelinePoints = useMemo(() => {
    const snapshotByQuarter = new Map();
    for (const snap of snapshots || []) {
      const qk = dateToQuarterKey(snap.date);
      snapshotByQuarter.set(qk, snap);
    }

    const activeQuarters = includeCurrentLive
      ? TIMELINE_QUARTERS
      : TIMELINE_QUARTERS.filter((q) => q !== '2026-Q4');

    const totalCount = activeQuarters.length;

    return activeQuarters.map((qKey, idx) => {
      const matchingSnap = snapshotByQuarter.get(qKey);
      if (matchingSnap) {
        return {
          id: matchingSnap.id,
          quarterKey: qKey,
          shortLabel: qKey,
          dateLabel: matchingSnap.date,
          isFromCsv: true,
          recordsByCityId: matchingSnap.recordsByCityId
        };
      }

      const stepsFromEnd = totalCount - 1 - idx;
      const colFactor = Math.pow(0.993, stepsFromEnd);
      const salFactor = Math.pow(0.992, stepsFromEnd);
      const rentFactor = Math.pow(0.990, stepsFromEnd);

      const recordsByCityId = {};
      for (const c of trackedCities) {
        const f = c.fixedSalary || {};
        const cr = c.career || {};
        const h = c.housing || {};
        const metroTilt = c.weightedColIndex > 105 ? Math.pow(0.999, stepsFromEnd) : 1.0;

        recordsByCityId[c.id] = {
          cityId: c.id,
          cityCode: c.code,
          city: c.city,
          state: c.state,
          weightedColIndex: Number((c.weightedColIndex * colFactor * metroTilt).toFixed(1)),
          equivalentGrossNeeded: Math.round(c.equivalentGrossNeeded * salFactor * metroTilt),
          leftover: Math.round((f.leftover || 0) / Math.max(0.75, colFactor * metroTilt)),
          housingSpend: Math.round((f.housingSpend || 0) * rentFactor * metroTilt),
          totalColExpenses: Math.round((f.totalColExpenses || 0) * colFactor * metroTilt),
          roleMedianSalary: Math.round((cr.roleMedianSalary || 0) * salFactor),
          hudFmr2BrMonthly: Math.round((h.hudFairMarketRents?.br2 || 0) * rentFactor)
        };
      }

      return {
        id: `q_point_${qKey}`,
        quarterKey: qKey,
        shortLabel: qKey,
        dateLabel: qKey === '2026-Q4' ? 'Current Live' : `${qKey} Baseline`,
        isFromCsv: false,
        recordsByCityId
      };
    });
  }, [snapshots, includeCurrentLive, trackedCities]);

  const segmentParties = useMemo(() => {
    return timelinePoints.map((pt) => {
      const qPack = resolveQuarterRecordSafe(pt.quarterKey);
      const statePack = buildMockStateLegislativeQuarter(focusCity, pt.quarterKey);
      const hasData = Boolean(qPack.hasData);

      const federalParty = qPack.federalPower?.president?.party || 'R';
      const stateParty = statePack.governor?.party || 'R';

      const activePartyCode = !hasData
        ? 'NONE'
        : backgroundPartyScope === 'federal'
        ? federalParty
        : stateParty;

      return {
        quarterKey: pt.quarterKey,
        hasData,
        partyCode: activePartyCode,
        federalParty,
        stateParty
      };
    });
  }, [timelinePoints, backgroundPartyScope, focusCity]);

  const chartCities = trackedCities.slice(0, 10);

  const lineChartData = useMemo(() => {
    return {
      labels: timelinePoints.map((pt) => pt.quarterKey),
      datasets: chartCities.map((cityObj, idx) => {
        const color = CITY_PALETTE[idx % CITY_PALETTE.length];
        return {
          label: `${cityObj.city}, ${cityObj.state} (${cityObj.code})`,
          data: timelinePoints.map((pt) => {
            const rec =
              pt.recordsByCityId[cityObj.id] ||
              Object.values(pt.recordsByCityId).find(
                (r) => r.cityCode && r.cityCode.toLowerCase() === cityObj.code.toLowerCase()
              );
            if (!rec) return null;
            const val = Number(rec[selectedMetricKey]);
            return Number.isFinite(val) ? val : null;
          }),
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          spanGaps: true,
          tension: 0.25
        };
      })
    };
  }, [timelinePoints, chartCities, selectedMetricKey]);

  const partyBackgroundPlugin = useMemo(
    () => ({
      id: 'partyBackgroundBands',
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const xScale = scales?.x;
        if (!chartArea || !xScale || segmentParties.length === 0) return;

        const { top, bottom, left, right } = chartArea;
        ctx.save();

        for (let i = 0; i < segmentParties.length; i++) {
          const centerX = xScale.getPixelForTick(i);
          const prevX = i > 0 ? (xScale.getPixelForTick(i - 1) + centerX) / 2 : left;
          const nextX =
            i < segmentParties.length - 1
              ? (centerX + xScale.getPixelForTick(i + 1)) / 2
              : right;

          const bandLeft = Math.max(left, prevX);
          const bandWidth = Math.max(0, Math.min(right, nextX) - bandLeft);
          const seg = segmentParties[i];
          const style = PARTY_BAND_STYLES[seg.partyCode] || PARTY_BAND_STYLES.NONE;

          ctx.fillStyle = style.fill;
          ctx.fillRect(bandLeft, top, bandWidth, bottom - top);

          ctx.fillStyle = style.border;
          ctx.fillRect(bandLeft, top, bandWidth, 4);

          if (bandWidth > 28) {
            ctx.fillStyle = seg.hasData ? '#e2e8f0' : '#94a3b8';
            ctx.font = '600 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            const bandLabel = seg.hasData ? seg.partyCode : '—';
            ctx.fillText(bandLabel, bandLeft + bandWidth / 2, top + 16);
          }
        }

        ctx.restore();
      }
    }),
    [segmentParties]
  );

  const lineChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      onClick: (_event, elements) => {
        if (Array.isArray(elements) && elements.length > 0 && onInspectQuarter) {
          const idx = elements[0].index;
          const pt = timelinePoints[idx];
          if (pt) {
            onInspectQuarter(pt.quarterKey, focusCity);
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#e2e8f0', boxWidth: 12, padding: 12, font: { size: 11 } }
        },
        title: {
          display: true,
          text: `Continuous Quarterly Timeline: ${activeMetric.label} (Background = ${
            backgroundPartyScope === 'federal'
              ? 'Federal Executive Party'
              : `${focusCity?.state || 'State'} Governor Party`
          } • Click Any Quarter for Legislation)`,
          color: '#f8fafc',
          font: { size: 13, weight: '600' }
        },
        tooltip: {
          callbacks: {
            afterTitle: (items) => {
              const idx = items?.[0]?.dataIndex ?? 0;
              const seg = segmentParties[idx];
              if (!seg) return '';
              if (!seg.hasData) {
                return `${seg.quarterKey}: No legislative records logged for this quarter (Click for details)`;
              }
              return `In Power (${seg.quarterKey}): Federal = ${seg.federalParty} | ${
                focusCity?.state || 'State'
              } Gov = ${seg.stateParty} (Click to inspect bills)`;
            },
            label: (ctx) => {
              if (ctx.raw === null || ctx.raw === undefined) return `${ctx.dataset.label}: No data`;
              return activeMetric.isCurrency
                ? `${ctx.dataset.label}: ${fmtUSD(ctx.raw)}`
                : `${ctx.dataset.label}: ${ctx.raw}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11 } },
          grid: { color: 'rgba(148, 163, 184, 0.1)' }
        },
        y: {
          ticks: {
            color: '#94a3b8',
            callback: (value) =>
              activeMetric.isCurrency ? '$' + (Number(value) / 1000).toFixed(0) + 'k' : value
          },
          grid: { color: 'rgba(148, 163, 184, 0.14)' }
        }
      }
    }),
    [activeMetric, backgroundPartyScope, focusCity, onInspectQuarter, timelinePoints, segmentParties]
  );

  const deltaSummaryRows = useMemo(() => {
    if (timelinePoints.length < 2) return [];
    const firstPt = timelinePoints[0];
    const lastPt = timelinePoints[timelinePoints.length - 1];

    return trackedCities.map((c) => {
      const findRec = (pt) =>
        pt.recordsByCityId[c.id] ||
        Object.values(pt.recordsByCityId).find(
          (r) => r.cityCode && r.cityCode.toLowerCase() === c.code.toLowerCase()
        );

      const startRec = findRec(firstPt);
      const endRec = findRec(lastPt);
      const startVal = startRec ? Number(startRec[selectedMetricKey]) : null;
      const endVal = endRec ? Number(endRec[selectedMetricKey]) : null;
      const diff =
        Number.isFinite(startVal) && Number.isFinite(endVal) ? endVal - startVal : null;
      const pctChange =
        diff !== null && startVal !== 0
          ? Number(((diff / Math.abs(startVal)) * 100).toFixed(1))
          : null;

      return {
        city: c,
        startLabel: firstPt.quarterKey,
        endLabel: lastPt.quarterKey,
        startVal,
        endVal,
        diff,
        pctChange
      };
    });
  }, [timelinePoints, trackedCities, selectedMetricKey]);

  const formatMetricValue = (val) => {
    if (!Number.isFinite(val)) return '—';
    return activeMetric.isCurrency ? fmtUSD(val) : Number(val).toFixed(1);
  };

  return (
    <div className="viz-card timeline-card">
      <div className="timeline-toolbar">
        <div className="timeline-controls-left">
          <div className="timeline-select-group">
            <label>
              <TrendingUp size={13} /> Timeline Metric
            </label>
            <select
              value={selectedMetricKey}
              onChange={(e) => setSelectedMetricKey(e.target.value)}
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="timeline-select-group">
            <label>
              <Landmark size={13} /> Background Party Shading
            </label>
            <select
              value={backgroundPartyScope}
              onChange={(e) => setBackgroundPartyScope(e.target.value)}
            >
              <option value="federal">Federal Control (President / Congress)</option>
              <option value="state">
                State Control ({focusCity?.state || 'State'} Governor)
              </option>
            </select>
          </div>

          <label className="timeline-checkbox-label">
            <input
              type="checkbox"
              checked={includeCurrentLive}
              onChange={(e) => setIncludeCurrentLive(e.target.checked)}
            />
            <span>Include 2026-Q4 Live</span>
          </label>
        </div>

        <div className="timeline-actions-right">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            style={{ display: 'none' }}
            onChange={handleFilesSelected}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={15} /> Import CSV Snapshot(s)
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onExportCurrentCsv}
          >
            <Download size={15} /> Export Current CSV
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSampleHistory}
            title="Save sample 2024–2026 CSV snapshots into localStorage"
          >
            <Sparkles size={15} /> Save Sample CSVs
          </button>
        </div>
      </div>

      {/* Party Color Legend + Clickable Continuous Quarters Strip */}
      <div className="power-timeline-strip">
        <div className="power-strip-header">
          <span>
            <Landmark size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Continuous Quarterly Timeline (Click any quarter to inspect legislation):
          </span>
          <div className="party-legend-pills">
            <span className="mini-party p-d">Blue Band = Democrat (D)</span>
            <span className="mini-party p-r">Red Band = Republican (R)</span>
            <span className="mini-party p-i">Purple Band = Independent / Split (I)</span>
          </div>
        </div>
        <div className="power-quarters-row">
          {timelinePoints.map((pt) => {
            const qKey = pt.quarterKey;
            const qPack = resolveQuarterRecordSafe(qKey);
            const statePack = buildMockStateLegislativeQuarter(focusCity, qKey);
            const hasData = Boolean(qPack.hasData);

            const potusParty = qPack.federalPower?.president?.party || 'R';
            const govParty = statePack.governor?.party || 'R';
            const activeParty = backgroundPartyScope === 'federal' ? potusParty : govParty;

            const cardClass = hasData
              ? `quarter-power-btn bg-party-${activeParty.toLowerCase()}`
              : 'quarter-power-btn no-data-quarter';

            return (
              <button
                key={pt.id}
                type="button"
                className={cardClass}
                onClick={() => onInspectQuarter && onInspectQuarter(qKey, focusCity)}
                title={
                  hasData
                    ? `Click to view ${qKey} Federal & ${focusCity?.state || 'State'} political breakdown & cost-of-living legislation`
                    : `${qKey}: No legislative records logged for this quarter (Click to view)`
                }
              >
                <div className="qp-top">
                  <strong>{qKey}</strong>
                  <small>{pt.isFromCsv ? 'CSV' : ''}</small>
                </div>
                {hasData ? (
                  <div className="qp-badges">
                    <span className={`mini-party p-${potusParty.toLowerCase()}`}>
                      US: {potusParty}
                    </span>
                    <span className={`mini-party p-${govParty.toLowerCase()}`}>
                      {focusCity?.state || 'ST'}: {govParty}
                    </span>
                  </div>
                ) : (
                  <div className="qp-badges">
                    <span className="mini-party" style={{ color: '#94a3b8' }}>
                      No Data
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {uploadFeedback && (
        <div className="timeline-feedback-banner">
          <FileSpreadsheet size={15} />
          <span>{uploadFeedback}</span>
          <button
            type="button"
            className="mini-link-btn"
            onClick={() => setUploadFeedback('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="loaded-snapshots-bar">
        <span className="snapshots-bar-label">
          <Calendar size={14} /> Uploaded CSV Snapshots ({snapshots.length}):
        </span>
        {snapshots.length === 0 ? (
          <span className="helper-note" style={{ margin: 0 }}>
            Showing continuous quarterly baseline (2024-Q1 → 2026-Q4). Upload exported CSV snapshots via{' '}
            <strong>Import CSV Snapshot(s)</strong> to override quarters with your saved snapshots.
          </span>
        ) : (
          <div className="snapshot-chips-list">
            {snapshots.map((snap) => (
              <span key={snap.id} className="snapshot-chip">
                <strong>{snap.date}</strong> • {snap.label} (
                {Object.keys(snap.recordsByCityId).length} cities)
                <button
                  type="button"
                  title="Remove snapshot"
                  onClick={() => onSnapshotsChange(snapshotService.remove(snap.id))}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              className="btn-ghost-sm"
              onClick={() => onSnapshotsChange(snapshotService.clearAll())}
            >
              <Trash2 size={12} /> Clear All
            </button>
          </div>
        )}
      </div>

      <div className="chart-wrapper" style={{ marginTop: '0.85rem', cursor: 'pointer' }}>
        <Line
          key={`${backgroundPartyScope}_${timelinePoints.length}_${snapshots.length}`}
          data={lineChartData}
          options={lineChartOptions}
          plugins={[partyBackgroundPlugin]}
        />
      </div>

      {deltaSummaryRows.length > 0 && (
        <div className="timeline-delta-section">
          <h4>
            Period-over-Period Change ({timelinePoints[0].quarterKey} →{' '}
            {timelinePoints[timelinePoints.length - 1].quarterKey})
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="mini-budget-table">
              <thead>
                <tr>
                  <th>Tracked City</th>
                  <th>Earliest ({timelinePoints[0].quarterKey})</th>
                  <th>Latest ({timelinePoints[timelinePoints.length - 1].quarterKey})</th>
                  <th>Net Change</th>
                  <th>% Change</th>
                </tr>
              </thead>
              <tbody>
                {deltaSummaryRows.map((row) => {
                  const isGoodDirection =
                    selectedMetricKey === 'leftover' || selectedMetricKey === 'roleMedianSalary'
                      ? (row.diff || 0) >= 0
                      : (row.diff || 0) <= 0;

                  return (
                    <tr key={row.city.id}>
                      <td>
                        <strong>
                          {row.city.city}, {row.city.state}
                        </strong>{' '}
                        <span className="city-code-badge">{row.city.code}</span>
                      </td>
                      <td>{formatMetricValue(row.startVal)}</td>
                      <td>
                        <strong>{formatMetricValue(row.endVal)}</strong>
                      </td>
                      <td
                        className={
                          row.diff === null
                            ? ''
                            : isGoodDirection
                            ? 'diff-cell-down'
                            : 'diff-cell-up'
                        }
                      >
                        {row.diff === null
                          ? '—'
                          : `${row.diff >= 0 ? '+' : ''}${formatMetricValue(row.diff)}`}
                      </td>
                      <td
                        className={
                          row.pctChange === null
                            ? ''
                            : isGoodDirection
                            ? 'diff-cell-down'
                            : 'diff-cell-up'
                        }
                      >
                        {row.pctChange === null
                          ? '—'
                          : `${row.pctChange >= 0 ? '+' : ''}${row.pctChange}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}