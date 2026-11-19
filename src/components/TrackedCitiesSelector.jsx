// src/components/TrackedCitiesSelector.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, Check, Crown, Layers, XCircle } from 'lucide-react';

export function TrackedCitiesSelector({
  allCities,
  selectedCityIds,
  onChangeSelectedCityIds,
  baseCityId
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const groupedByState = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    const map = new Map();
    for (const c of allCities) {
      if (q) {
        const hay = `${c.city} ${c.state} ${c.stateName} ${c.code}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const key = `${c.state} — ${c.stateName || c.state}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allCities, filterText]);

  const toggleCity = (cityId) => {
    if (cityId === baseCityId) return; // Base city always stays tracked
    if (selectedCityIds.includes(cityId)) {
      onChangeSelectedCityIds(selectedCityIds.filter((id) => id !== cityId));
    } else {
      onChangeSelectedCityIds([...selectedCityIds, cityId]);
    }
  };

  const selectMostPopulatedPerState = () => {
    const top1Ids = allCities
      .filter((c) => c.popRankInState === 1 || c.id === baseCityId)
      .map((c) => c.id);
    onChangeSelectedCityIds(Array.from(new Set(top1Ids)));
  };

  const selectAllCities = () => {
    onChangeSelectedCityIds(allCities.map((c) => c.id));
  };

  const selectMinimalDefault = () => {
    const baseAndLondon = allCities
      .filter((c) => c.id === baseCityId || c.code === 'LON')
      .map((c) => c.id);
    onChangeSelectedCityIds(Array.from(new Set(baseAndLondon)));
  };

  const top1Count = useMemo(
    () => allCities.filter((c) => c.popRankInState === 1 || c.id === baseCityId).length,
    [allCities, baseCityId]
  );

  const allSelected = selectedCityIds.length === allCities.length;
  const top1Selected =
    selectedCityIds.length === top1Count &&
    allCities
      .filter((c) => c.popRankInState === 1 || c.id === baseCityId)
      .every((c) => selectedCityIds.includes(c.id));

  return (
    <div className="control-group tracked-cities-wrap" ref={wrapperRef}>
      <label>
        <MapPin size={14} /> Tracked Cities ({selectedCityIds.length} of {allCities.length} — Chart &amp; Map)
      </label>

      <button
        type="button"
        className="m3-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="m3-dropdown-value">
          {allSelected
            ? `All Cities Selected (${allCities.length})`
            : top1Selected
            ? `#1 Largest City per State (${selectedCityIds.length})`
            : `${selectedCityIds.length} Tracked ${selectedCityIds.length === 1 ? 'City' : 'Cities'}`}
        </span>
        <ChevronDown size={16} className={isOpen ? 'm3-caret rotated' : 'm3-caret'} />
      </button>

      {isOpen && (
        <div className="m3-multiselect-popover">
          {/* Explicit Top-Level Bulk Options */}
          <div className="m3-bulk-options">
            <button
              type="button"
              className={top1Selected ? 'm3-bulk-btn active' : 'm3-bulk-btn'}
              onClick={selectMostPopulatedPerState}
            >
              <Crown size={14} /> #1 Largest City per State ({top1Count})
            </button>
            <button
              type="button"
              className={allSelected ? 'm3-bulk-btn active' : 'm3-bulk-btn'}
              onClick={selectAllCities}
            >
              <Layers size={14} /> All Cities — Top 3/State ({allCities.length})
            </button>
            <button
              type="button"
              className="m3-bulk-btn subtle"
              onClick={selectMinimalDefault}
            >
              <XCircle size={14} /> Reset to Minimal
            </button>
          </div>

          <div className="m3-popover-search">
            <input
              type="text"
              placeholder="Filter state or city name..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="m3-grouped-list">
            {groupedByState.map(([stateLabel, stateCities]) => (
              <div key={stateLabel} className="m3-state-group">
                <div className="m3-state-group-header">{stateLabel}</div>
                {stateCities.map((c) => {
                  const checked = selectedCityIds.includes(c.id);
                  const isBase = c.id === baseCityId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={checked ? 'm3-option-row selected' : 'm3-option-row'}
                      onClick={() => toggleCity(c.id)}
                    >
                      <span className={checked ? 'm3-checkbox checked' : 'm3-checkbox'}>
                        {checked && <Check size={12} />}
                      </span>
                      <span className="m3-option-main">
                        <strong>{c.city}</strong>
                        <small>
                          ({c.code}) • #{c.popRankInState} in {c.state}
                          {isBase ? ' • Base' : ''}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}