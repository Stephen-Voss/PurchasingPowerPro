// src/components/CityDropdownSelector.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Crown,
  Layers,
  XCircle,
  Globe,
} from "lucide-react";

export function CityDropdownSelector({
  mode = "multi", // 'single' | 'multi'
  allCities,
  selectedCityIds = [],
  onChangeSelectedCityIds,
  baseCityId,
  onSelectSingleCity,
  triggerLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Group US states first (alphabetically), followed by International countries (alphabetically)
  const { usStateGroups, intlCountryGroups } = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    const usMap = new Map();
    const intlMap = new Map();

    for (const c of allCities) {
      if (q) {
        const hay =
          `${c.city} ${c.state} ${c.stateName} ${c.country} ${c.code}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }

      if (c.isInternational) {
        const countryLabel = c.stateName || c.country || "International";
        const groupKey = `intl_${countryLabel}`;
        if (!intlMap.has(groupKey)) {
          intlMap.set(groupKey, {
            key: groupKey,
            label: countryLabel,
            isIntl: true,
            cities: [],
          });
        }
        intlMap.get(groupKey).cities.push(c);
      } else {
        const stateLabel = `${c.state} — ${c.stateName || c.state}`;
        const groupKey = `us_${c.state}`;
        if (!usMap.has(groupKey)) {
          usMap.set(groupKey, {
            key: groupKey,
            label: stateLabel,
            isIntl: false,
            cities: [],
          });
        }
        usMap.get(groupKey).cities.push(c);
      }
    }

    const sortedUs = Array.from(usMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    const sortedIntl = Array.from(intlMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );

    return { usStateGroups: sortedUs, intlCountryGroups: sortedIntl };
  }, [allCities, filterText]);

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const setAllIntlCollapsed = (collapsedState) => {
    const next = { ...collapsedGroups };
    for (const grp of intlCountryGroups) {
      next[grp.key] = collapsedState;
    }
    setCollapsedGroups(next);
  };

  const handleCityClick = (cityObj) => {
    if (mode === "single") {
      if (onSelectSingleCity) onSelectSingleCity(cityObj);
      setIsOpen(false);
      setFilterText("");
      return;
    }

    if (cityObj.id === baseCityId) return; // Base city always remains tracked
    if (selectedCityIds.includes(cityObj.id)) {
      onChangeSelectedCityIds(
        selectedCityIds.filter((id) => id !== cityObj.id),
      );
    } else {
      onChangeSelectedCityIds([...selectedCityIds, cityObj.id]);
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
      .filter((c) => c.id === baseCityId || c.code === "LON")
      .map((c) => c.id);
    onChangeSelectedCityIds(Array.from(new Set(baseAndLondon)));
  };

  const top1Count = useMemo(
    () =>
      allCities.filter((c) => c.popRankInState === 1 || c.id === baseCityId)
        .length,
    [allCities, baseCityId],
  );

  const allSelected =
    mode === "multi" && selectedCityIds.length === allCities.length;
  const top1Selected =
    mode === "multi" &&
    selectedCityIds.length === top1Count &&
    allCities
      .filter((c) => c.popRankInState === 1 || c.id === baseCityId)
      .every((c) => selectedCityIds.includes(c.id));

  const baseCityObj = useMemo(
    () => allCities.find((c) => c.id === baseCityId) || allCities[0],
    [allCities, baseCityId],
  );

  const computedTriggerText =
    triggerLabel ||
    (mode === "single"
      ? `${baseCityObj?.city}, ${baseCityObj?.state} (${baseCityObj?.code}) — RPP ${baseCityObj?.indices?.overall}`
      : allSelected
        ? `All Cities Selected (${allCities.length})`
        : top1Selected
          ? `#1 Largest City per State (${selectedCityIds.length})`
          : `${selectedCityIds.length} Tracked ${selectedCityIds.length === 1 ? "City" : "Cities"}`);

  const renderGroupSection = (grp) => {
    const isCollapsed = filterText.trim()
      ? false
      : Boolean(collapsedGroups[grp.key]);
    const selectedInGroupCount =
      mode === "single"
        ? grp.cities.some((c) => c.id === baseCityId)
          ? 1
          : 0
        : grp.cities.filter((c) => selectedCityIds.includes(c.id)).length;

    return (
      <div key={grp.key} className="m3-state-group">
        <button
          type="button"
          className={
            grp.isIntl
              ? "m3-state-group-header intl-group-header"
              : "m3-state-group-header"
          }
          onClick={() => toggleGroupCollapse(grp.key)}
          aria-expanded={!isCollapsed}
        >
          <span className="group-header-left">
            {isCollapsed ? (
              <ChevronRight size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
            {grp.isIntl && <Globe size={12} />}
            <span>{grp.label}</span>
          </span>
          <span className="group-count-badge">
            {mode === "single"
              ? `${grp.cities.length}`
              : `${selectedInGroupCount}/${grp.cities.length}`}
          </span>
        </button>

        {!isCollapsed &&
          grp.cities.map((c) => {
            const isBase = c.id === baseCityId;
            const checked =
              mode === "single" ? isBase : selectedCityIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={checked ? "m3-option-row selected" : "m3-option-row"}
                onClick={() => handleCityClick(c)}
              >
                {mode === "multi" ? (
                  <span
                    className={checked ? "m3-checkbox checked" : "m3-checkbox"}
                  >
                    {checked && <Check size={12} />}
                  </span>
                ) : (
                  <span className={checked ? "m3-radio checked" : "m3-radio"}>
                    {checked && <span className="m3-radio-dot" />}
                  </span>
                )}
                <span className="m3-option-main">
                  <strong>{c.city}</strong>
                  <small>
                    ({c.code}) • RPP {c.indices?.overall}
                    {mode === "multi" && isBase ? " • Base" : ""}
                  </small>
                </span>
              </button>
            );
          })}
      </div>
    );
  };

  return (
    <div className="custom-dropdown-wrap" ref={wrapperRef}>
      <button
        type="button"
        className="m3-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="m3-dropdown-value">{computedTriggerText}</span>
        <ChevronDown
          size={16}
          className={isOpen ? "m3-caret rotated" : "m3-caret"}
        />
      </button>

      {isOpen && (
        <div
          className={
            mode === "single"
              ? "m3-multiselect-popover align-left"
              : "m3-multiselect-popover"
          }
        >
          {mode === "multi" && (
            <div className="m3-bulk-options">
              <button
                type="button"
                className={top1Selected ? "m3-bulk-btn active" : "m3-bulk-btn"}
                onClick={selectMostPopulatedPerState}
              >
                <Crown size={14} /> #1 Largest City per State ({top1Count})
              </button>
              <button
                type="button"
                className={allSelected ? "m3-bulk-btn active" : "m3-bulk-btn"}
                onClick={selectAllCities}
              >
                <Layers size={14} /> All Cities — Top 3/State (
                {allCities.length})
              </button>
              <button
                type="button"
                className="m3-bulk-btn subtle"
                onClick={selectMinimalDefault}
              >
                <XCircle size={14} /> Reset to Minimal
              </button>
            </div>
          )}

          <div className="m3-popover-search">
            <input
              type="text"
              placeholder={
                mode === "single"
                  ? "Search base city, state, or code..."
                  : "Filter state, country, or city name..."
              }
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="m3-grouped-list">
            {usStateGroups.map((grp) => renderGroupSection(grp))}

            {intlCountryGroups.length > 0 && (
              <>
                <div className="m3-intl-divider-bar">
                  <span>
                    <Globe
                      size={12}
                      style={{ verticalAlign: "middle", marginRight: "4px" }}
                    />
                    International Countries ({intlCountryGroups.length})
                  </span>
                  <div className="intl-collapse-actions">
                    <button
                      type="button"
                      className="mini-link-btn"
                      onClick={() => setAllIntlCollapsed(false)}
                    >
                      Expand
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      className="mini-link-btn"
                      onClick={() => setAllIntlCollapsed(true)}
                    >
                      Collapse
                    </button>
                  </div>
                </div>
                {intlCountryGroups.map((grp) => renderGroupSection(grp))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
