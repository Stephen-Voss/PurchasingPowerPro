// src/components/CareerDropdownSelector.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { CAREER_PROFILES, CAREER_CATEGORIES } from '../data/careerData';

export function CareerDropdownSelector({ selectedCareerId, onChangeCareerId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});
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

  const activeProfile = useMemo(
    () => CAREER_PROFILES.find((p) => p.id === selectedCareerId) || CAREER_PROFILES[0],
    [selectedCareerId]
  );

  const groupedCategories = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return CAREER_CATEGORIES.map((categoryName) => {
      const roles = CAREER_PROFILES.filter((prof) => {
        if (prof.category !== categoryName) return false;
        if (!q) return true;
        const hay = `${prof.title} ${prof.category} ${prof.socCode} ${(prof.skills || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
      return { categoryName, roles };
    }).filter((grp) => grp.roles.length > 0);
  }, [filterText]);

  const toggleCategory = (catName) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleSelectRole = (profId) => {
    onChangeCareerId(profId);
    setIsOpen(false);
    setFilterText('');
  };

  return (
    <div className="control-group custom-dropdown-wrap" ref={wrapperRef}>
      <label>
        <Briefcase size={14} /> Target Career / Profession
      </label>

      <button
        type="button"
        className="m3-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="m3-dropdown-value">
          {activeProfile.title} (SOC {activeProfile.socCode})
        </span>
        <ChevronDown size={16} className={isOpen ? 'm3-caret rotated' : 'm3-caret'} />
      </button>

      {isOpen && (
        <div className="m3-multiselect-popover align-left">
          <div className="m3-popover-search">
            <input
              type="text"
              placeholder="Search profession, industry, or SOC code..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>

          <div className="m3-grouped-list">
            {groupedCategories.map(({ categoryName, roles }) => {
              const isCollapsed = filterText.trim() ? false : Boolean(collapsedCategories[categoryName]);
              return (
                <div key={categoryName} className="m3-state-group">
                  <button
                    type="button"
                    className="m3-state-group-header"
                    onClick={() => toggleCategory(categoryName)}
                    aria-expanded={!isCollapsed}
                  >
                    <span className="group-header-left">
                      {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                      <span>{categoryName}</span>
                    </span>
                    <span className="group-count-badge">{roles.length}</span>
                  </button>

                  {!isCollapsed &&
                    roles.map((prof) => {
                      const isSelected = prof.id === selectedCareerId;
                      return (
                        <button
                          key={prof.id}
                          type="button"
                          className={isSelected ? 'm3-option-row selected' : 'm3-option-row'}
                          onClick={() => handleSelectRole(prof.id)}
                        >
                          <span className={isSelected ? 'm3-radio checked' : 'm3-radio'}>
                            {isSelected && <span className="m3-radio-dot" />}
                          </span>
                          <span className="m3-option-main">
                            <strong>{prof.title}</strong>
                            <small>SOC {prof.socCode}</small>
                          </span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}