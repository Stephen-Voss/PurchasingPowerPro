// src/App.jsx
import React, { useState, useMemo, useEffect, useDeferredValue, useCallback } from 'react';
import {
  BarChart3,
  MapPin,
  Database,
  Globe,
  RefreshCw,
  Trash2,
  KeyRound,
  Search,
  DollarSign,
  Building2,
  Sliders,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Share2,
  Check
} from 'lucide-react';
import { DEFAULT_CITIES, INTERNATIONAL_PRESETS } from './data/citiesData';
import {
  evaluateCityMetrics,
  DEFAULT_TAX_PROFILE,
  DEFAULT_BUDGET_WEIGHTS,
  normalizeBudgetWeights
} from './utils/costCalculator';
import {
  getStoredApiKeys,
  saveApiKeys,
  clearStoredApiKeys,
  hasCustomApiKeys,
  fetchLiveCensusWagesByState,
  fetchAPVerveColIndex,
  fetchAPINinjasTax,
  fetchBEARegionalParity,
  geocodeCityNominatim
} from './services/apiService';
import { cacheService } from './services/cacheService';
import { TaxAndBudgetControls } from './components/TaxAndBudgetControls';
import { TaxBreakdownModal } from './components/TaxBreakdownModal';
import { CostChartView, CostMapView } from './components/VisualizationViews';
import { CityTable } from './components/CityTable';
import './App.css';

const clampNum = (val, min, max, fallback) => {
  const n = Number(val);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * Parses URL query parameters (?base=STL&salary=150000&filing=married&w=34,16,15,9,11,15...)
 * Supports both compact comma-separated weights (?w=...) and individual category params.
 */
function parseUrlQueryState(citiesList) {
  const params = new URLSearchParams(window.location.search);

  // 1. Resolve Base City by 3-letter code, id, or city name
  const rawBase = (params.get('base') || '').trim();
  let matchedCity = citiesList.find((c) => c.id === 'st--louis-mo') || citiesList[0];
  if (rawBase) {
    const q = rawBase.toLowerCase();
    matchedCity =
      citiesList.find((c) => c.code.toLowerCase() === q) ||
      citiesList.find((c) => c.id.toLowerCase() === q) ||
      citiesList.find((c) => c.city.toLowerCase() === q) ||
      matchedCity;
  }

  // 2. Target Salary
  const targetSalary = clampNum(params.get('salary'), 25000, 2000000, 150000);

  // 3. Tax & Household Profile
  const rawFiling = (params.get('filing') || '').toLowerCase();
  const filingStatus = ['single', 'married', 'hoh'].includes(rawFiling)
    ? rawFiling
    : DEFAULT_TAX_PROFILE.filingStatus;
  const householdSize = clampNum(params.get('hh'), 1, 10, DEFAULT_TAX_PROFILE.householdSize);
  const dependents = clampNum(params.get('dep'), 0, 8, DEFAULT_TAX_PROFILE.dependents);
  const preTaxRetirementPct = clampNum(
    params.get('retire'),
    0,
    25,
    DEFAULT_TAX_PROFILE.preTaxRetirementPct
  );

  const taxProfile = {
    ...DEFAULT_TAX_PROFILE,
    filingStatus,
    householdSize,
    dependents,
    preTaxRetirementPct
  };

  // 4. Budget Weights (Supports ?w=34,16,15,9,11,15 OR individual ?housing=40&food=15...)
  let budgetWeights = { ...DEFAULT_BUDGET_WEIGHTS };
  const rawW = params.get('w');
  if (rawW) {
    const parts = rawW.split(',').map((n) => Number(n));
    if (parts.length === 6 && parts.every((n) => !Number.isNaN(n) && n >= 0)) {
      budgetWeights = {
        housing: clampNum(parts[0], 2, 65, DEFAULT_BUDGET_WEIGHTS.housing),
        food: clampNum(parts[1], 2, 65, DEFAULT_BUDGET_WEIGHTS.food),
        transportation: clampNum(parts[2], 2, 65, DEFAULT_BUDGET_WEIGHTS.transportation),
        utilities: clampNum(parts[3], 2, 65, DEFAULT_BUDGET_WEIGHTS.utilities),
        healthcare: clampNum(parts[4], 2, 65, DEFAULT_BUDGET_WEIGHTS.healthcare),
        misc: clampNum(parts[5], 2, 65, DEFAULT_BUDGET_WEIGHTS.misc)
      };
    }
  } else {
    budgetWeights = {
      housing: clampNum(params.get('housing'), 2, 65, DEFAULT_BUDGET_WEIGHTS.housing),
      food: clampNum(params.get('food'), 2, 65, DEFAULT_BUDGET_WEIGHTS.food),
      transportation: clampNum(params.get('transit'), 2, 65, DEFAULT_BUDGET_WEIGHTS.transportation),
      utilities: clampNum(params.get('utilities'), 2, 65, DEFAULT_BUDGET_WEIGHTS.utilities),
      healthcare: clampNum(params.get('health'), 2, 65, DEFAULT_BUDGET_WEIGHTS.healthcare),
      misc: clampNum(params.get('misc'), 2, 65, DEFAULT_BUDGET_WEIGHTS.misc)
    };
  }

  // 5. View & Filter State
  const activeView = params.get('view') === 'map' ? 'map' : 'chart';
  const stateFilter = params.get('state') || 'ALL';
  const rankParam = params.get('rank');
  const rankFilter = ['ALL', 'TOP1', 'INTL'].includes(rankParam) ? rankParam : 'ALL';
  const searchFilter = params.get('q') || '';

  // 6. Optional Inspected City Modal (?inspect=SEA)
  const rawInspect = (params.get('inspect') || '').trim().toLowerCase();
  const inspectedMatch = rawInspect
    ? citiesList.find(
        (c) => c.code.toLowerCase() === rawInspect || c.id.toLowerCase() === rawInspect
      )
    : null;

  return {
    baseCityId: matchedCity.id,
    baseQueryInput: matchedCity.code,
    targetSalary,
    taxProfile,
    budgetWeights,
    activeView,
    stateFilter,
    rankFilter,
    searchFilter,
    inspectedTaxCityId: inspectedMatch ? inspectedMatch.id : null
  };
}

export default function App() {
  const [cities, setCities] = useState(() => {
    const savedCustom = localStorage.getItem('cost_tracker_custom_cities_v2');
    const customList = savedCustom ? JSON.parse(savedCustom) : [];
    return [...DEFAULT_CITIES, ...customList];
  });

  // Hydrate initial state from URL query parameters
  const initialUrlState = useMemo(() => parseUrlQueryState(cities), []);

  const [baseCityId, setBaseCityId] = useState(initialUrlState.baseCityId);
  const [baseQueryInput, setBaseQueryInput] = useState(initialUrlState.baseQueryInput);
  const [targetSalary, setTargetSalary] = useState(initialUrlState.targetSalary);

  // Hidden by default; uses default or URL-supplied tax & budget inputs unless expanded
  const [showSlidersPanel, setShowSlidersPanel] = useState(false);
  const [taxProfile, setTaxProfile] = useState(initialUrlState.taxProfile);
  const [budgetWeights, setBudgetWeights] = useState(initialUrlState.budgetWeights);

  const deferredTaxProfile = useDeferredValue(taxProfile);
  const deferredBudgetWeights = useDeferredValue(budgetWeights);
  const deferredSalary = useDeferredValue(Number(targetSalary) || 150000);

  const [inspectedTaxCityId, setInspectedTaxCityId] = useState(initialUrlState.inspectedTaxCityId);
  const [activeView, setActiveView] = useState(initialUrlState.activeView);

  const [searchFilter, setSearchFilter] = useState(initialUrlState.searchFilter);
  const [stateFilter, setStateFilter] = useState(initialUrlState.stateFilter);
  const [rankFilter, setRankFilter] = useState(initialUrlState.rankFilter);

  const [linkCopied, setLinkCopied] = useState(false);

  const [showApiDrawer, setShowApiDrawer] = useState(false);
  const [apiKeys, setApiKeys] = useState(getStoredApiKeys);
  const [liveTaxOverrides, setLiveTaxOverrides] = useState({});
  const [syncStatus, setSyncStatus] = useState(
    'Public Demo Engine Active (2026 BEA RPP + IRS/State/UK Tax + Keyless US Census ACS)'
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheStats, setCacheStats] = useState(() => cacheService.getSummary());

  const [showIntlModal, setShowIntlModal] = useState(false);
  const [newIntl, setNewIntl] = useState({
    city: '',
    country: '',
    code: '',
    overall: 112,
    housing: 135,
    food: 105,
    transportation: 108,
    utilities: 102,
    healthcare: 98,
    misc: 106,
    customEffTaxRate: 30,
    minWageHourly: 14.5,
    medianWageAnnual: 58000
  });

  // Listen to browser Back / Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlQueryState(cities);
      setBaseCityId(parsed.baseCityId);
      setBaseQueryInput(parsed.baseQueryInput);
      setTargetSalary(parsed.targetSalary);
      setTaxProfile(parsed.taxProfile);
      setBudgetWeights(parsed.budgetWeights);
      setActiveView(parsed.activeView);
      setStateFilter(parsed.stateFilter);
      setRankFilter(parsed.rankFilter);
      setSearchFilter(parsed.searchFilter);
      setInspectedTaxCityId(parsed.inspectedTaxCityId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [cities]);

  const applyCensusWages = async () => {
    const censusMap = await fetchLiveCensusWagesByState();
    if (!censusMap) return false;
    setCities((prevCities) =>
      prevCities.map((c) => {
        if (c.isInternational || !c.censusStateFips || !censusMap[c.censusStateFips]) return c;
        const stateCensus = censusMap[c.censusStateFips];
        const mult = c.metroMultiplier || 1.0;
        return {
          ...c,
          medianWageAnnual: Math.round(stateCensus.medianEarnings * (1 + (mult - 1) * 0.9)),
          wageSource: 'US Census ACS Live API + DOL'
        };
      })
    );
    setCacheStats(cacheService.getSummary());
    return true;
  };

  useEffect(() => {
    let mounted = true;
    applyCensusWages().then((ok) => {
      if (!mounted) return;
      if (ok) {
        setSyncStatus('Public Demo Active: Live US Census ACS Wages + 2026 BEA RPP Baseline');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const baseCityRaw = useMemo(
    () => cities.find((c) => c.id === baseCityId) || cities.find((c) => c.code === 'STL') || cities[0],
    [cities, baseCityId]
  );

  // Sync active state to URL query parameters without reloading the page
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('base', baseCityRaw.code);
    params.set('salary', String(deferredSalary));

    if (deferredTaxProfile.filingStatus !== DEFAULT_TAX_PROFILE.filingStatus) {
      params.set('filing', deferredTaxProfile.filingStatus);
    }
    if (deferredTaxProfile.householdSize !== DEFAULT_TAX_PROFILE.householdSize) {
      params.set('hh', String(deferredTaxProfile.householdSize));
    }
    if (deferredTaxProfile.dependents !== DEFAULT_TAX_PROFILE.dependents) {
      params.set('dep', String(deferredTaxProfile.dependents));
    }
    if (deferredTaxProfile.preTaxRetirementPct !== DEFAULT_TAX_PROFILE.preTaxRetirementPct) {
      params.set('retire', String(deferredTaxProfile.preTaxRetirementPct));
    }

    const isDefaultWeights =
      deferredBudgetWeights.housing === DEFAULT_BUDGET_WEIGHTS.housing &&
      deferredBudgetWeights.food === DEFAULT_BUDGET_WEIGHTS.food &&
      deferredBudgetWeights.transportation === DEFAULT_BUDGET_WEIGHTS.transportation &&
      deferredBudgetWeights.utilities === DEFAULT_BUDGET_WEIGHTS.utilities &&
      deferredBudgetWeights.healthcare === DEFAULT_BUDGET_WEIGHTS.healthcare &&
      deferredBudgetWeights.misc === DEFAULT_BUDGET_WEIGHTS.misc;

    if (!isDefaultWeights) {
      params.set(
        'w',
        [
          deferredBudgetWeights.housing,
          deferredBudgetWeights.food,
          deferredBudgetWeights.transportation,
          deferredBudgetWeights.utilities,
          deferredBudgetWeights.healthcare,
          deferredBudgetWeights.misc
        ].join(',')
      );
    }

    if (activeView !== 'chart') params.set('view', activeView);
    if (stateFilter !== 'ALL') params.set('state', stateFilter);
    if (rankFilter !== 'ALL') params.set('rank', rankFilter);
    if (searchFilter.trim()) params.set('q', searchFilter.trim());

    if (inspectedTaxCityId) {
      const inspectedObj = cities.find((c) => c.id === inspectedTaxCityId);
      if (inspectedObj) params.set('inspect', inspectedObj.code);
    }

    const newRelativeUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newRelativeUrl);
  }, [
    baseCityRaw,
    deferredSalary,
    deferredTaxProfile,
    deferredBudgetWeights,
    activeView,
    stateFilter,
    rankFilter,
    searchFilter,
    inspectedTaxCityId,
    cities
  ]);

  // Copy Shareable Comparison URL to Clipboard
  const handleShareComparisonLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    }
  }, []);

  const evaluatedCities = useMemo(() => {
    return cities.map((c) =>
      evaluateCityMetrics(
        c,
        baseCityRaw,
        deferredSalary,
        deferredTaxProfile,
        deferredBudgetWeights,
        liveTaxOverrides[c.id]
      )
    );
  }, [cities, baseCityRaw, deferredSalary, deferredTaxProfile, deferredBudgetWeights, liveTaxOverrides]);

  const baseCityEvaluated = useMemo(
    () => evaluatedCities.find((c) => c.id === baseCityRaw.id) || evaluatedCities[0],
    [evaluatedCities, baseCityRaw]
  );

  const inspectedTaxCity = useMemo(
    () => (inspectedTaxCityId ? evaluatedCities.find((c) => c.id === inspectedTaxCityId) : null),
    [evaluatedCities, inspectedTaxCityId]
  );

  const handleBaseInputCommit = (val) => {
    setBaseQueryInput(val);
    const q = val.trim().toLowerCase();
    if (!q) return;
    const match =
      cities.find((c) => c.code.toLowerCase() === q) ||
      cities.find((c) => c.city.toLowerCase() === q) ||
      cities.find((c) => `${c.city}, ${c.state}`.toLowerCase().includes(q));
    if (match) {
      setBaseCityId(match.id);
    }
  };

  const filteredCities = useMemo(() => {
    return evaluatedCities.filter((c) => {
      if (stateFilter !== 'ALL' && c.state !== stateFilter) return false;
      if (rankFilter === 'TOP1' && c.popRankInState !== 1 && c.id !== baseCityRaw.id) return false;
      if (rankFilter === 'INTL' && !c.isInternational && c.id !== baseCityRaw.id) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchName = `${c.city} ${c.state} ${c.stateName} ${c.code}`.toLowerCase().includes(q);
        if (!matchName) return false;
      }
      return true;
    });
  }, [evaluatedCities, stateFilter, rankFilter, searchFilter, baseCityRaw]);

  const handleLiveApiSync = async () => {
    setIsSyncing(true);
    saveApiKeys(apiKeys);

    await applyCensusWages();

    if (!hasCustomApiKeys(apiKeys)) {
      setCacheStats(cacheService.getSummary());
      setSyncStatus('Synced Keyless US Census ACS + Default 2026 BEA RPP & Tax Engine');
      setIsSyncing(false);
      return;
    }

    const batch = filteredCities.slice(0, 12);
    let updatedCount = 0;

    const updatedCitiesMap = {};
    const newTaxOverrides = { ...liveTaxOverrides };

    for (const cityObj of batch) {
      const [apvData, beaData, taxData] = await Promise.all([
        fetchAPVerveColIndex(cityObj, apiKeys.apverve),
        fetchBEARegionalParity(cityObj, apiKeys.bea),
        fetchAPINinjasTax(cityObj, targetSalary, taxProfile.filingStatus, apiKeys.apininjas)
      ]);

      if (apvData) {
        updatedCitiesMap[cityObj.id] = apvData;
        updatedCount++;
      } else if (beaData) {
        const ratio = beaData.stateRpp / cityObj.indices.overall;
        updatedCitiesMap[cityObj.id] = {
          overall: Number(beaData.stateRpp.toFixed(1)),
          housing: Number((cityObj.indices.housing * ratio).toFixed(1)),
          food: Number((cityObj.indices.food * ratio).toFixed(1)),
          transportation: Number((cityObj.indices.transportation * ratio).toFixed(1)),
          utilities: Number((cityObj.indices.utilities * ratio).toFixed(1)),
          healthcare: Number((cityObj.indices.healthcare * ratio).toFixed(1)),
          misc: Number((cityObj.indices.misc * ratio).toFixed(1))
        };
        updatedCount++;
      }

      if (taxData) {
        newTaxOverrides[cityObj.id] = taxData;
        updatedCount++;
      }
    }

    if (Object.keys(updatedCitiesMap).length > 0) {
      setCities((prev) =>
        prev.map((c) => (updatedCitiesMap[c.id] ? { ...c, indices: updatedCitiesMap[c.id] } : c))
      );
    }
    setLiveTaxOverrides(newTaxOverrides);
    setCacheStats(cacheService.getSummary());
    setSyncStatus(
      updatedCount > 0
        ? `BYOK Live Sync Complete: Updated ${updatedCount} endpoints (Cached in localStorage)`
        : 'Keyless US Census ACS + Default 2026 BEA RPP Engine Active'
    );
    setIsSyncing(false);
  };

  const handleAddInternationalCity = async (e) => {
    e.preventDefault();
    if (!newIntl.city || !newIntl.country) return;
    const coords = await geocodeCityNominatim(newIntl.city, newIntl.country);
    const id = `${newIntl.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newIntl.country
      .toLowerCase()
      .slice(0, 3)}`;

    const created = {
      id,
      code: (newIntl.code || newIntl.city.slice(0, 3)).toUpperCase(),
      city: newIntl.city,
      state: newIntl.country.toUpperCase().slice(0, 3),
      stateName: newIntl.country,
      country: newIntl.country.toUpperCase().slice(0, 2),
      isInternational: true,
      popRankInState: 1,
      lat: coords.lat,
      lng: coords.lng,
      beaFips: null,
      stateTaxRate: 0,
      localTaxRate: 0,
      customEffTaxRate: Number(newIntl.customEffTaxRate) / 100,
      minWageHourly: Number(newIntl.minWageHourly) || 14.0,
      medianWageAnnual: Number(newIntl.medianWageAnnual) || 55000,
      wageSource: 'Custom International Entry',
      indices: {
        overall: Number(newIntl.overall),
        housing: Number(newIntl.housing),
        food: Number(newIntl.food),
        transportation: Number(newIntl.transportation),
        utilities: Number(newIntl.utilities),
        healthcare: Number(newIntl.healthcare),
        misc: Number(newIntl.misc)
      }
    };

    setCities((prev) => {
      const updated = [...prev.filter((item) => item.id !== created.id), created];
      const customOnly = updated.filter((c) => !DEFAULT_CITIES.some((d) => d.id === c.id));
      localStorage.setItem('cost_tracker_custom_cities_v2', JSON.stringify(customOnly));
      return updated;
    });
    setShowIntlModal(false);
  };

  const handleQuickPresetIntl = (preset) => {
    const id = `${preset.city.toLowerCase()}-${preset.country.toLowerCase()}`;
    const created = {
      id,
      code: preset.code,
      city: preset.city,
      state: preset.state,
      stateName: preset.country,
      country: preset.country,
      isInternational: true,
      popRankInState: 1,
      lat: preset.lat,
      lng: preset.lng,
      beaFips: null,
      stateTaxRate: 0,
      localTaxRate: 0,
      customEffTaxRate: preset.effTaxRate,
      minWageHourly: preset.minWageHourly,
      medianWageAnnual: preset.medianWageAnnual,
      wageSource: 'OECD / National Wage Baseline',
      indices: {
        overall: preset.overall,
        housing: preset.housing,
        food: preset.food,
        transportation: preset.transportation,
        utilities: preset.utilities,
        healthcare: preset.healthcare,
        misc: preset.misc
      }
    };
    setCities((prev) => {
      if (prev.some((c) => c.id === id)) return prev;
      const updated = [...prev, created];
      const customOnly = updated.filter((c) => !DEFAULT_CITIES.some((d) => d.id === c.id));
      localStorage.setItem('cost_tracker_custom_cities_v2', JSON.stringify(customOnly));
      return updated;
    });
  };

  const seattleSpotlight = evaluatedCities.find((c) => c.code === 'SEA');
  const londonSpotlight = evaluatedCities.find((c) => c.code === 'LON');
  const nycSpotlight = evaluatedCities.find((c) => c.code === 'NYC');

  const fmtUSD = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const uniqueStates = useMemo(
    () => Array.from(new Set(cities.map((c) => c.state))).sort(),
    [cities]
  );

  const normWeights = normalizeBudgetWeights(budgetWeights);
  const usingByok = hasCustomApiKeys(apiKeys);

  return (
    <div className="m3-app-layout">
      {/* Material Design 3 Top App Bar */}
      <header className="m3-app-bar">
        <div className="m3-app-bar-inner">
          <div className="brand-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1>PurchasingPower Pro</h1>
              <span className="sync-badge" title="No secret API keys are bundled in this public build">
                <ShieldCheck size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {usingByok ? 'BYOK Live Override Mode' : 'Public Demo (Zero-Key Engine)'}
              </span>
            </div>
            <p className="subtitle">
              150 U.S. Cities + London • Built-in 2026 BEA RPP &amp; Tax Engine + Keyless US Census ACS API
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className={linkCopied ? 'btn-primary' : 'btn-secondary'}
              onClick={handleShareComparisonLink}
              title="Copy shareable URL with your current Base City, salary, tax profile, and budget weights"
            >
              {linkCopied ? <Check size={15} /> : <Share2 size={15} />}
              <span>{linkCopied ? 'Copied Share Link!' : 'Share Link'}</span>
            </button>
            <button
              type="button"
              className={showSlidersPanel ? 'btn-secondary active-outline' : 'btn-secondary'}
              onClick={() => setShowSlidersPanel(!showSlidersPanel)}
            >
              <Sliders size={15} />
              <span>Tax &amp; Budget Sliders</span>
              {showSlidersPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowIntlModal(true)}>
              <Globe size={15} /> <span>+ International City</span>
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowApiDrawer(!showApiDrawer)}>
              <KeyRound size={15} /> <span>BYOK APIs &amp; Cache ({cacheStats.entries})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Fluid Content Container */}
      <main className="m3-main-container">
        {/* BYOK API Keys & Cache Drawer */}
        {showApiDrawer && (
          <section className="api-drawer">
            <p className="helper-note" style={{ marginTop: 0, marginBottom: '0.85rem', color: '#cbd5e1' }}>
              <strong>GitHub Pages Public Demo Security:</strong> No API keys are bundled with this site. The app runs out-of-the-box using our embedded 2026 BEA Regional Price Parities, progressive US/UK tax tables, and keyless US Census ACS &amp; OpenStreetMap APIs. Optionally enter your own personal keys below (stored exclusively in your browser&apos;s <code>localStorage</code>).
            </p>
            <div className="api-grid">
              <div>
                <label>Optional: APVerve Key (Cost of Living API)</label>
                <input
                  type="password"
                  placeholder="Local browser x-api-key..."
                  value={apiKeys.apverve}
                  onChange={(e) => setApiKeys({ ...apiKeys, apverve: e.target.value })}
                />
              </div>
              <div>
                <label>Optional: API Ninjas Key (Income Tax API)</label>
                <input
                  type="password"
                  placeholder="Local browser X-Api-Key..."
                  value={apiKeys.apininjas}
                  onChange={(e) => setApiKeys({ ...apiKeys, apininjas: e.target.value })}
                />
              </div>
              <div>
                <label>Optional: BEA UserID Key (Regional Parities)</label>
                <input
                  type="password"
                  placeholder="Local browser 36-char UserID..."
                  value={apiKeys.bea}
                  onChange={(e) => setApiKeys({ ...apiKeys, bea: e.target.value })}
                />
              </div>
            </div>
            <div className="api-drawer-footer">
              <div className="cache-telemetry">
                <Database size={15} />
                <span>
                  Hits: <strong>{cacheStats.hits}</strong> | Misses: <strong>{cacheStats.misses}</strong> | Cached:{' '}
                  <strong>{cacheStats.entries}</strong>
                </span>
                <span className="sync-badge">{syncStatus}</span>
              </div>
              <div className="api-btns">
                <button className="btn-primary" onClick={handleLiveApiSync} disabled={isSyncing}>
                  <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />{' '}
                  {isSyncing ? 'Syncing...' : 'Save Browser Keys & Sync'}
                </button>
                <button
                  className="btn-danger"
                  onClick={() => {
                    clearStoredApiKeys();
                    setApiKeys({ apverve: '', apininjas: '', bea: '' });
                    cacheService.clearAll();
                    setCacheStats(cacheService.getSummary());
                    setSyncStatus('Reset to Public Demo Defaults (Zero-Key Engine)');
                  }}
                >
                  <Trash2 size={15} /> Clear Keys &amp; Cache
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Primary Control Surface: Base City + Target Salary + Benchmark Callouts */}
        <section className="control-panel">
          <div className="control-group">
            <label>
              <Building2 size={15} /> Base City Code or Name (e.g., STL, SEA, NYC)
            </label>
            <div className="dual-input">
              <input
                type="text"
                value={baseQueryInput}
                onChange={(e) => handleBaseInputCommit(e.target.value)}
                placeholder="STL, SEA..."
                className="code-input"
              />
              <select
                value={baseCityEvaluated.id}
                onChange={(e) => {
                  setBaseCityId(e.target.value);
                  const found = cities.find((c) => c.id === e.target.value);
                  if (found) setBaseQueryInput(found.code);
                }}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city}, {c.state} ({c.code}) — RPP {c.indices.overall}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="control-group">
            <label>
              <DollarSign size={15} /> Target Base Salary (USD)
            </label>
            <input
              type="number"
              step="5000"
              min="25000"
              max="2000000"
              value={targetSalary}
              onChange={(e) => setTargetSalary(Number(e.target.value))}
              className="salary-input"
            />
          </div>

          <div className="spotlight-cards">
            {seattleSpotlight && (
              <div className="spotlight-card" onClick={() => setInspectedTaxCityId(seattleSpotlight.id)}>
                <span className="spot-label">Match {baseCityEvaluated.code} in Seattle (SEA)</span>
                <strong className="spot-value">{fmtUSD(seattleSpotlight.equivalentGrossNeeded)}</strong>
                <small>Leftover on {fmtUSD(targetSalary)}: {fmtUSD(seattleSpotlight.fixedSalary.leftover)}</small>
              </div>
            )}
            {nycSpotlight && (
              <div className="spotlight-card" onClick={() => setInspectedTaxCityId(nycSpotlight.id)}>
                <span className="spot-label">Match {baseCityEvaluated.code} in New York (NYC)</span>
                <strong className="spot-value">{fmtUSD(nycSpotlight.equivalentGrossNeeded)}</strong>
                <small>Leftover on {fmtUSD(targetSalary)}: {fmtUSD(nycSpotlight.fixedSalary.leftover)}</small>
              </div>
            )}
            {londonSpotlight && (
              <div className="spotlight-card" onClick={() => setInspectedTaxCityId(londonSpotlight.id)}>
                <span className="spot-label">Match {baseCityEvaluated.code} in London (LON)</span>
                <strong className="spot-value">{fmtUSD(londonSpotlight.equivalentGrossNeeded)}</strong>
                <small>Leftover on {fmtUSD(targetSalary)}: {fmtUSD(londonSpotlight.fixedSalary.leftover)}</small>
              </div>
            )}
          </div>
        </section>

        {/* Collapsed-by-Default M3 Summary Strip OR Expanded Tax & Budget Sliders */}
        {!showSlidersPanel ? (
          <div className="m3-collapsed-summary-bar" onClick={() => setShowSlidersPanel(true)}>
            <div className="summary-chips-wrap">
              <span className="summary-bar-title">
                <Sliders size={14} /> Active Profile:
              </span>
              <span className="m3-chip">
                Filing: <strong style={{ textTransform: 'capitalize' }}>{taxProfile.filingStatus}</strong>
              </span>
              <span className="m3-chip">
                Household: <strong>{taxProfile.householdSize}</strong> ({taxProfile.dependents} Dep.)
              </span>
              <span className="m3-chip">
                401(k)/HSA: <strong>{taxProfile.preTaxRetirementPct}%</strong>
              </span>
              <span className="m3-chip">
                Budget: <strong>{Math.round(normWeights.housing * 100)}% Housing</strong> •{' '}
                <strong>{Math.round(normWeights.food * 100)}% Food</strong> •{' '}
                <strong>{Math.round(normWeights.transportation * 100)}% Transit</strong> (+3 more)
              </span>
            </div>
            <button type="button" className="btn-tonal-sm">
              Customize Tax &amp; Budget <ChevronDown size={14} />
            </button>
          </div>
        ) : (
          <TaxAndBudgetControls
            taxProfile={taxProfile}
            onChangeTaxProfile={setTaxProfile}
            budgetWeights={budgetWeights}
            onChangeBudgetWeights={setBudgetWeights}
            onClosePanel={() => setShowSlidersPanel(false)}
          />
        )}

        {/* Filter & View Toggle Bar */}
        <section className="toolbar-bar">
          <div className="view-toggle-group">
            <button
              className={activeView === 'chart' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setActiveView('chart')}
            >
              <BarChart3 size={16} /> <span>Chart View</span>
            </button>
            <button
              className={activeView === 'map' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setActiveView('map')}
            >
              <MapPin size={16} /> <span>OpenStreetMap ({filteredCities.length})</span>
            </button>
          </div>

          <div className="filter-controls">
            <div className="search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search city, state, or code..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="ALL">All States &amp; UK ({cities.length})</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  State / Region: {st}
                </option>
              ))}
            </select>

            <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
              <option value="ALL">All Top 3 Cities / State</option>
              <option value="TOP1">#1 Largest City per State</option>
              <option value="INTL">International + Base City</option>
            </select>
          </div>
        </section>

        {/* Active Chart or Map View */}
        {activeView === 'chart' ? (
          <CostChartView
            cities={filteredCities}
            baseCity={baseCityEvaluated}
            targetSalary={deferredSalary}
          />
        ) : (
          <CostMapView
            cities={filteredCities}
            baseCity={baseCityEvaluated}
            targetSalary={deferredSalary}
            onInspectTax={(cityObj) => setInspectedTaxCityId(cityObj.id)}
          />
        )}

        {/* Collapsible 6-Category Table + Min/Median Wage + Clickable Tax Inspector */}
        <CityTable
          cities={filteredCities}
          baseCity={baseCityEvaluated}
          targetSalary={deferredSalary}
          onSelectBaseCity={(id) => {
            setBaseCityId(id);
            const found = cities.find((c) => c.id === id);
            if (found) setBaseQueryInput(found.code);
          }}
          onInspectTax={(cityObj) => setInspectedTaxCityId(cityObj.id)}
        />
      </main>

      {/* Interactive Tax Implications Modal */}
      {inspectedTaxCity && (
        <TaxBreakdownModal
          city={inspectedTaxCity}
          baseCity={baseCityEvaluated}
          taxProfile={taxProfile}
          onClose={() => setInspectedTaxCityId(null)}
        />
      )}

      {/* Modal for Adding International Cities */}
      {showIntlModal && (
        <div className="modal-backdrop" onClick={() => setShowIntlModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add International City</h3>
            <p className="modal-sub">
              Quick-add a global hub or enter custom international indices and wage baselines below:
            </p>
            <div className="preset-chips">
              {INTERNATIONAL_PRESETS.map((p) => (
                <button key={p.code} type="button" className="chip-btn" onClick={() => handleQuickPresetIntl(p)}>
                  + {p.city}, {p.country} ({p.code})
                </button>
              ))}
            </div>

            <form onSubmit={handleAddInternationalCity} className="intl-form">
              <div className="form-row">
                <div>
                  <label>City Name</label>
                  <input
                    required
                    placeholder="e.g., Berlin"
                    value={newIntl.city}
                    onChange={(e) => setNewIntl({ ...newIntl, city: e.target.value })}
                  />
                </div>
                <div>
                  <label>Country</label>
                  <input
                    required
                    placeholder="e.g., Germany"
                    value={newIntl.country}
                    onChange={(e) => setNewIntl({ ...newIntl, country: e.target.value })}
                  />
                </div>
                <div>
                  <label>3-Letter Code</label>
                  <input
                    placeholder="e.g., BER"
                    maxLength={4}
                    value={newIntl.code}
                    onChange={(e) => setNewIntl({ ...newIntl, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label>Housing Index (US=100)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newIntl.housing}
                    onChange={(e) => setNewIntl({ ...newIntl, housing: e.target.value })}
                  />
                </div>
                <div>
                  <label>Min Wage (USD/hr)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={newIntl.minWageHourly}
                    onChange={(e) => setNewIntl({ ...newIntl, minWageHourly: e.target.value })}
                  />
                </div>
                <div>
                  <label>Median Wage (USD/yr)</label>
                  <input
                    type="number"
                    step="1000"
                    value={newIntl.medianWageAnnual}
                    onChange={(e) => setNewIntl({ ...newIntl, medianWageAnnual: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowIntlModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Geocode &amp; Add City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}