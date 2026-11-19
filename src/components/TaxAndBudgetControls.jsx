// src/components/TaxAndBudgetControls.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Users, Sliders, RotateCcw, X } from 'lucide-react';
import {
  DEFAULT_BUDGET_WEIGHTS,
  DEFAULT_TAX_PROFILE,
  normalizeBudgetWeights
} from '../utils/costCalculator';

const BUDGET_META = [
  { key: 'housing', label: 'Housing & Rent', color: '#3b82f6' },
  { key: 'food', label: 'Food & Groceries', color: '#8b5cf6' },
  { key: 'transportation', label: 'Transportation', color: '#f97316' },
  { key: 'utilities', label: 'Utilities & Energy', color: '#06b6d4' },
  { key: 'healthcare', label: 'Healthcare', color: '#ec4899' },
  { key: 'misc', label: 'Miscellaneous', color: '#a855f7' }
];

export function TaxAndBudgetControls({
  taxProfile,
  onChangeTaxProfile,
  budgetWeights,
  onChangeBudgetWeights,
  onClosePanel
}) {
  // Local state for 60fps zero-lag slider movement
  const [localWeights, setLocalWeights] = useState(budgetWeights);
  const [localTax, setLocalTax] = useState(taxProfile);
  const weightTimerRef = useRef(null);
  const taxTimerRef = useRef(null);

  useEffect(() => {
    setLocalWeights(budgetWeights);
  }, [budgetWeights]);

  useEffect(() => {
    setLocalTax(taxProfile);
  }, [taxProfile]);

  const normalized = normalizeBudgetWeights(localWeights);

  const handleSliderChange = (key, val) => {
    const next = { ...localWeights, [key]: Number(val) };
    setLocalWeights(next);
    if (weightTimerRef.current) clearTimeout(weightTimerRef.current);
    weightTimerRef.current = setTimeout(() => {
      onChangeBudgetWeights(next);
    }, 35);
  };

  const handleTaxChange = (nextTax) => {
    setLocalTax(nextTax);
    if (taxTimerRef.current) clearTimeout(taxTimerRef.current);
    taxTimerRef.current = setTimeout(() => {
      onChangeTaxProfile(nextTax);
    }, 35);
  };

  const applyBudgetPreset = (presetType) => {
    let next = DEFAULT_BUDGET_WEIGHTS;
    if (presetType === 'metro') {
      next = { housing: 46, food: 15, transportation: 10, utilities: 8, healthcare: 9, misc: 12 };
    } else if (presetType === 'family') {
      next = { housing: 32, food: 22, transportation: 16, utilities: 10, healthcare: 13, misc: 7 };
    }
    setLocalWeights(next);
    onChangeBudgetWeights(next);
  };

  return (
    <div className="modal-backdrop" onClick={onClosePanel}>
      <div className="modal-card tax-budget-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>Customize Household Tax Filing &amp; 6-Category Budget Weights</h3>
            <p className="modal-sub">
              Changes apply dynamically to equivalent salary calculations, taxes, and leftover income
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClosePanel}>
            <X size={16} /> Done
          </button>
        </div>

        <div className="advanced-controls-grid">
          {/* Left Card: Filing Status, Household Size & Tax Parameters */}
          <div className="config-card">
            <div className="config-card-header">
              <div className="config-title">
                <Users size={16} />
                <h3>Tax Filing Status &amp; Household Profile</h3>
              </div>
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => {
                  setLocalTax(DEFAULT_TAX_PROFILE);
                  onChangeTaxProfile(DEFAULT_TAX_PROFILE);
                }}
              >
                <RotateCcw size={13} /> Reset Defaults
              </button>
            </div>

            <div className="tax-inputs-grid">
              <div>
                <label>Filing Status</label>
                <select
                  value={localTax.filingStatus}
                  onChange={(e) =>
                    handleTaxChange({ ...localTax, filingStatus: e.target.value })
                  }
                >
                  <option value="single">Single ($15,000 Std Ded.)</option>
                  <option value="married">Married Filing Jointly ($30,000 Std Ded.)</option>
                  <option value="hoh">Head of Household ($22,500 Std Ded.)</option>
                </select>
              </div>

              <div>
                <label>
                  Household Size ({localTax.householdSize}{' '}
                  {localTax.householdSize === 1 ? 'Person' : 'People'})
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={localTax.householdSize}
                  onChange={(e) =>
                    handleTaxChange({
                      ...localTax,
                      householdSize: Math.max(1, Number(e.target.value))
                    })
                  }
                />
              </div>

              <div>
                <label>Qualifying Dependents ($2k Credit/ea)</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={localTax.dependents}
                  onChange={(e) =>
                    handleTaxChange({
                      ...localTax,
                      dependents: Math.max(0, Number(e.target.value))
                    })
                  }
                />
              </div>

              <div>
                <label>Pre-Tax 401(k) / HSA: {localTax.preTaxRetirementPct}%</label>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={localTax.preTaxRetirementPct}
                  onChange={(e) =>
                    handleTaxChange({
                      ...localTax,
                      preTaxRetirementPct: Number(e.target.value)
                    })
                  }
                />
              </div>
            </div>
            <p className="helper-note">
              Click any row&apos;s <strong>Taxes</strong> cell in the table to open the marginal bracket waterfall inspector.
            </p>
          </div>

          {/* Right Card: 6-Category Custom Budget Weight Sliders */}
          <div className="config-card">
            <div className="config-card-header">
              <div className="config-title">
                <Sliders size={16} />
                <h3>Custom Budget Weight Sliders (6 Categories)</h3>
              </div>
              <div className="preset-btn-group">
                <button type="button" className="btn-ghost-sm" onClick={() => applyBudgetPreset('default')}>
                  BLS Balanced
                </button>
                <button type="button" className="btn-ghost-sm" onClick={() => applyBudgetPreset('metro')}>
                  High-Rent Metro
                </button>
                <button type="button" className="btn-ghost-sm" onClick={() => applyBudgetPreset('family')}>
                  Family Household
                </button>
              </div>
            </div>

            <div className="sliders-grid">
              {BUDGET_META.map((cat) => {
                const pct = Math.round(normalized[cat.key] * 100);
                return (
                  <div key={cat.key} className="slider-item">
                    <div className="slider-label-row">
                      <span>
                        <i className="dot" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </span>
                      <strong>{pct}%</strong>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="65"
                      value={localWeights[cat.key]}
                      style={{ accentColor: cat.color }}
                      onChange={(e) => handleSliderChange(cat.key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            <div className="weight-distribution-bar">
              {BUDGET_META.map((cat) => (
                <div
                  key={cat.key}
                  style={{
                    width: `${normalized[cat.key] * 100}%`,
                    backgroundColor: cat.color
                  }}
                  title={`${cat.label}: ${Math.round(normalized[cat.key] * 100)}%`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}