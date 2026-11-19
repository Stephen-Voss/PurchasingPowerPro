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
  ShieldCheck,
  Share2,
  Check,
  Briefcase
} from 'lucide-react';
import { DEFAULT_CITIES, INTERNATIONAL_PRESETS } from './data/citiesData';
import { CAREER_PROFILES, CAREER_CATEGORIES, buildBaselineCareerMetrics } from './data/careerData';
import {
  evaluateCityMetrics,
  DEFAULT_TAX_PROFILE,
  DEFAULT_BUDGET_WEIGHTS
} from './utils/costCalculator';
import { evaluateCityCareerViability } from './utils/careerCalculator';
import {
  getStoredApiKeys,
  saveApiKeys,
  clearStoredApiKeys,
  hasCustomApiKeys,
  fetchLiveCensusWagesByState,
  fetchAPVerveColIndex,
  fetchAPINinjasTax,
  fetchBEARegionalParity,
  fetchAdzunaCareerData,
  fetchCareerOneStopData,
  fetchBLSLaborTimeSeries,
  geocodeCityNominatim
} from './services/apiService';
import { cacheService } from './services/cacheService';
import { TrackedCitiesSelector } from './components/TrackedCitiesSelector';
import { TaxAndBudgetControls } from './components/TaxAndBudgetControls';
import { TaxBreakdownModal } from './components/TaxBreakdownModal';
import { BudgetBreakdownModal } from './components/BudgetBreakdownModal';
import { CareerViabilityModal } from './components/CareerViabilityModal';
import { RelocationCompareModal } from './components/RelocationCompareModal';
import { CostChartView, CostMapView } from './components/VisualizationViews';
import { CityTable } from './components/CityTable';
import './App.css';

const clampNum = (val, min, max, fallback) => {
  const n = Number(val);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

function parseUrlQueryState(citiesList) {
  const params = new URLSearchParams(window.location.search);

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

  const targetSalary = clampNum(params.get('salary'), 25000, 2000000, 150000);

  const rawRole = (params.get('role') || '').trim().toLowerCase();
  const matchedRole =
    CAREER_PROFILES.find((p) => p.id === rawRole || p.title.toLowerCase() === rawRole) ||
    CAREER_PROFILES[0];

  const rawTracked = (params.get('tracked') || '').trim();
  let initialTrackedIds = null;
  if (rawTracked === 'top1') {
    initialTrackedIds = citiesList
      .filter((c) => c.popRankInState === 1 || c.id === matchedCity.id)
      .map((c) => c.id);
  } else if (rawTracked === 'all') {
    initialTrackedIds = citiesList.map((c) => c.id);
  } else if (rawTracked) {
    const codes = rawTracked.split(',').map((s) => s.trim().toLowerCase());
    const foundIds = citiesList
      .filter((c) => codes.includes(c.code.toLowerCase()) || codes.includes(c.id.toLowerCase()))
      .map((c) => c.id);
    if (foundIds.length > 0) {
      initialTrackedIds = Array.from(new Set([matchedCity.id, ...foundIds]));
    }
  }

  if (!initialTrackedIds) {
    initialTrackedIds = Array.from(
      new Set(
        [
          matchedCity.id,
          citiesList.find((c) => c.code === 'LON')?.id,
          citiesList.find((c) => c.code === 'SEA')?.id,
          citiesList.find((c) => c.code === 'NYC')?.id
        ].filter(Boolean)
      )
    );
  }

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
  }

  const activeView = params.get('view') === 'map' ? 'map' : 'chart';
  const stateFilter = params.get('state') || 'ALL';
  const rankParam = params.get('rank');
  const rankFilter = ['ALL', 'TOP1', 'INTL'].includes(rankParam) ? rankParam : 'ALL';
  const searchFilter = params.get('q') || '';

  const rawInspect = (params.get('inspect') || '').trim().toLowerCase();
  const inspectedMatch = rawInspect
    ? citiesList.find(
        (c) => c.code.toLowerCase() === rawInspect || c.id.toLowerCase() === rawInspect
      )
    : null;

  const rawBudget = (params.get('budget') || '').trim().toLowerCase();
  const budgetMatch = rawBudget
    ? citiesList.find(
        (c) => c.code.toLowerCase() === rawBudget || c.id.toLowerCase() === rawBudget
      )
    : null;

  const rawCareer = (params.get('career') || '').trim().toLowerCase();
  const careerMatch = rawCareer
    ? citiesList.find(
        (c) => c.code.toLowerCase() === rawCareer || c.id.toLowerCase() === rawCareer
      )
    : null;

  return {
    baseCityId: matchedCity.id,
    baseQueryInput: matchedCity.code,
    targetSalary,
    selectedCareerId: matchedRole.id,
    selectedCityIds: initialTrackedIds,
    taxProfile,
    budgetWeights,
    activeView,
    stateFilter,
    rankFilter,
    searchFilter,
    inspectedTaxCityId: inspectedMatch ? inspectedMatch.id : null,
    inspectedBudgetCityId: budgetMatch ? budgetMatch.id : null,
    inspectedCareerCityId: careerMatch ? careerMatch.id : null
  };
}

export default function App() {
  const [cities, setCities] = useState(() => {
    const savedCustom = localStorage.getItem('cost_tracker_custom_cities_v2');
    const customList = savedCustom ? JSON.parse(savedCustom) : [];
    return [...DEFAULT_CITIES, ...customList];
  });

  const initialUrlState = useMemo(() => parseUrlQueryState(cities), []);

  const [baseCityId, setBaseCityId] = useState(initialUrlState.baseCityId);
  const [baseQueryInput, setBaseQueryInput] = useState(initialUrlState.baseQueryInput);
  const [targetSalary, setTargetSalary] = useState(initialUrlState.targetSalary);
  const [selectedCareerId, setSelectedCareerId] = useState(initialUrlState.selectedCareerId);
  const [selectedCityIds, setSelectedCityIds] = useState(initialUrlState.selectedCityIds);

  const [showTaxBudgetModal, setShowTaxBudgetModal] = useState(false);
  const [taxProfile, setTaxProfile] = useState(initialUrlState.taxProfile);
  const [budgetWeights, setBudgetWeights] = useState(initialUrlState.budgetWeights);

  const deferredTaxProfile = useDeferredValue(taxProfile);
  const deferredBudgetWeights = useDeferredValue(budgetWeights);
  const deferredSalary = useDeferredValue(Number(targetSalary) || 150000);
  const deferredCareerId = useDeferredValue(selectedCareerId);

  const [inspectedTaxCityId, setInspectedTaxCityId] = useState(initialUrlState.inspectedTaxCityId);
  const [inspectedBudgetCityId, setInspectedBudgetCityId] = useState(
    initialUrlState.inspectedBudgetCityId
  );
  const [inspectedCareerCityId, setInspectedCareerCityId] = useState(
    initialUrlState.inspectedCareerCityId
  );
  const [compareTargetCityId, setCompareTargetCityId] = useState(null);
  const [activeView, setActiveView] = useState(initialUrlState.activeView);

  const [searchFilter, setSearchFilter] = useState(initialUrlState.searchFilter);
  const [stateFilter, setStateFilter] = useState(initialUrlState.stateFilter);
  const [rankFilter, setRankFilter] = useState(initialUrlState.rankFilter);

  const [linkCopied, setLinkCopied] = useState(false);

  const [showApiDrawer, setShowApiDrawer] = useState(false);
  const [apiKeys, setApiKeys] = useState(getStoredApiKeys);
  const [liveTaxOverrides, setLiveTaxOverrides] = useState({});
  const [liveCareerOverrides, setLiveCareerOverrides] = useState({});
  const [syncStatus, setSyncStatus] = useState(
    'Public Demo Engine Active (2026 BEA RPP + Tax + Keyless US Census ACS + Career LMI)'
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

  const activeCareerProfile = useMemo(
    () => CAREER_PROFILES.find((p) => p.id === deferredCareerId) || CAREER_PROFILES[0],
    [deferredCareerId]
  );

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlQueryState(cities);
      setBaseCityId(parsed.baseCityId);
      setBaseQueryInput(parsed.baseQueryInput);
      setTargetSalary(parsed.targetSalary);
      setSelectedCareerId(parsed.selectedCareerId);
      setSelectedCityIds(parsed.selectedCityIds);
      setTaxProfile(parsed.taxProfile);
      setBudgetWeights(parsed.budgetWeights);
      setActiveView(parsed.activeView);
      setStateFilter(parsed.stateFilter);
      setRankFilter(parsed.rankFilter);
      setSearchFilter(parsed.searchFilter);
      setInspectedTaxCityId(parsed.inspectedTaxCityId);
      setInspectedBudgetCityId(parsed.inspectedBudgetCityId);
      setInspectedCareerCityId(parsed.inspectedCareerCityId);
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
        setSyncStatus('Public Demo Active: Live US Census ACS Wages + 2026 BEA RPP + Career LMI');
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

  const effectiveTrackedIds = useMemo(() => {
    if (selectedCityIds.includes(baseCityRaw.id)) return selectedCityIds;
    return [baseCityRaw.id, ...selectedCityIds];
  }, [selectedCityIds, baseCityRaw.id]);

  // Hydrate any cached API entries from localStorage whenever tracked cities or career/salary change
  // without making outbound network API calls.
  useEffect(() => {
    const trackedSet = new Set(effectiveTrackedIds);
    const trackedObjs = cities.filter((c) => trackedSet.has(c.id));
    const roundedIncome = Math.round((Number(targetSalary) || 150000) / 500) * 500;
    const apiFiling =
      taxProfile.filingStatus === 'married'
        ? 'married'
        : taxProfile.filingStatus === 'hoh'
        ? 'head_of_household'
        : 'single';

    const cachedIndexUpdates = {};
    const cachedTaxUpdates = {};
    const cachedCareerUpdates = {};
    let restoredAny = false;

    for (const cityObj of trackedObjs) {
      const apvCached = cacheService.get(`apverve_col6_${cityObj.id}`);
      const beaCached = cacheService.get(`bea_rpp_${cityObj.state}`);
      if (apvCached) {
        cachedIndexUpdates[cityObj.id] = apvCached;
        restoredAny = true;
      } else if (beaCached?.stateRpp && cityObj.indices?.overall) {
        const ratio = beaCached.stateRpp / cityObj.indices.overall;
        cachedIndexUpdates[cityObj.id] = {
          overall: Number(beaCached.stateRpp.toFixed(1)),
          housing: Number((cityObj.indices.housing * ratio).toFixed(1)),
          food: Number((cityObj.indices.food * ratio).toFixed(1)),
          transportation: Number((cityObj.indices.transportation * ratio).toFixed(1)),
          utilities: Number((cityObj.indices.utilities * ratio).toFixed(1)),
          healthcare: Number((cityObj.indices.healthcare * ratio).toFixed(1)),
          misc: Number((cityObj.indices.misc * ratio).toFixed(1))
        };
        restoredAny = true;
      }

      const taxCached = cacheService.get(
        `apininjas_tax_${cityObj.country}_${cityObj.state}_${roundedIncome}_${apiFiling}`
      );
      if (taxCached) {
        cachedTaxUpdates[cityObj.id] = taxCached;
        restoredAny = true;
      }

      const countrySlug = cityObj.country === 'GB' ? 'gb' : 'us';
      const socClean = activeCareerProfile.socCode.replace('-', '');
      const adzCached = cacheService.get(
        `adzuna_${countrySlug}_${cityObj.id}_${activeCareerProfile.id}`
      );
      const cosCached = cacheService.get(`cos_lmi_${cityObj.id}_${socClean}`);
      const blsCached = cacheService.get(
        `bls_oews_laus_${cityObj.id}_${activeCareerProfile.socCode}`
      );

      if (adzCached || cosCached || blsCached) {
        cachedCareerUpdates[`${cityObj.id}_${activeCareerProfile.id}`] = {
          adzuna: adzCached,
          careerOneStop: cosCached,
          bls: blsCached
        };
        restoredAny = true;
      }
    }

    if (Object.keys(cachedIndexUpdates).length > 0) {
      setCities((prev) =>
        prev.map((c) => (cachedIndexUpdates[c.id] ? { ...c, indices: cachedIndexUpdates[c.id] } : c))
      );
    }
    if (Object.keys(cachedTaxUpdates).length > 0) {
      setLiveTaxOverrides((prev) => ({ ...prev, ...cachedTaxUpdates }));
    }
    if (Object.keys(cachedCareerUpdates).length > 0) {
      setLiveCareerOverrides((prev) => ({ ...prev, ...cachedCareerUpdates }));
    }
    if (restoredAny) {
      setCacheStats(cacheService.getSummary());
    }
  }, [effectiveTrackedIds, cities, targetSalary, taxProfile.filingStatus, activeCareerProfile]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('base', baseCityRaw.code);
    params.set('salary', String(deferredSalary));
    if (deferredCareerId !== CAREER_PROFILES[0].id) {
      params.set('role', deferredCareerId);
    }

    if (effectiveTrackedIds.length === cities.length) {
      params.set('tracked', 'all');
    } else {
      const codes = cities
        .filter((c) => effectiveTrackedIds.includes(c.id))
        .map((c) => c.code)
        .slice(0, 25);
      if (codes.length > 0) params.set('tracked', codes.join(','));
    }

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

    if (inspectedBudgetCityId) {
      const budgetObj = cities.find((c) => c.id === inspectedBudgetCityId);
      if (budgetObj) params.set('budget', budgetObj.code);
    }

    if (inspectedCareerCityId) {
      const careerObj = cities.find((c) => c.id === inspectedCareerCityId);
      if (careerObj) params.set('career', careerObj.code);
    }

    const newRelativeUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newRelativeUrl);
  }, [
    baseCityRaw,
    deferredSalary,
    deferredCareerId,
    effectiveTrackedIds,
    deferredTaxProfile,
    deferredBudgetWeights,
    activeView,
    stateFilter,
    rankFilter,
    searchFilter,
    inspectedTaxCityId,
    inspectedBudgetCityId,
    inspectedCareerCityId,
    cities
  ]);

  const handleShareComparisonLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch {
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
    return cities.map((c) => {
      const costEval = evaluateCityMetrics(
        c,
        baseCityRaw,
        deferredSalary,
        deferredTaxProfile,
        deferredBudgetWeights,
        liveTaxOverrides[c.id]
      );
      const careerKey = `${c.id}_${activeCareerProfile.id}`;
      const careerEval = evaluateCityCareerViability(
        c,
        activeCareerProfile,
        costEval.equivalentGrossNeeded,
        liveCareerOverrides[careerKey]
      );
      return {
        ...costEval,
        career: careerEval
      };
    });
  }, [
    cities,
    baseCityRaw,
    deferredSalary,
    deferredTaxProfile,
    deferredBudgetWeights,
    liveTaxOverrides,
    activeCareerProfile,
    liveCareerOverrides
  ]);

  const baseCityEvaluated = useMemo(
    () => evaluatedCities.find((c) => c.id === baseCityRaw.id) || evaluatedCities[0],
    [evaluatedCities, baseCityRaw]
  );

  // Cities explicitly selected in Tracked Cities selector (used by Chart, Map, and Table)
  const trackedVizCities = useMemo(() => {
    const trackedSet = new Set(effectiveTrackedIds);
    return evaluatedCities.filter((c) => trackedSet.has(c.id));
  }, [evaluatedCities, effectiveTrackedIds]);

  const inspectedTaxCity = useMemo(
    () => (inspectedTaxCityId ? evaluatedCities.find((c) => c.id === inspectedTaxCityId) : null),
    [evaluatedCities, inspectedTaxCityId]
  );

  const inspectedBudgetCity = useMemo(
    () =>
      inspectedBudgetCityId
        ? evaluatedCities.find((c) => c.id === inspectedBudgetCityId)
        : null,
    [evaluatedCities, inspectedBudgetCityId]
  );

  const inspectedCareerCity = useMemo(
    () =>
      inspectedCareerCityId
        ? evaluatedCities.find((c) => c.id === inspectedCareerCityId)
        : null,
    [evaluatedCities, inspectedCareerCityId]
  );

  const compareTargetCity = useMemo(
    () => (compareTargetCityId ? evaluatedCities.find((c) => c.id === compareTargetCityId) : null),
    [evaluatedCities, compareTargetCityId]
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
      setSelectedCityIds((prev) => (prev.includes(match.id) ? prev : [match.id, ...prev]));
    }
  };

  // Table displays ONLY tracked cities (filtered by optional search/state/rank within tracked set)
  const filteredTrackedTableCities = useMemo(() => {
    return trackedVizCities.filter((c) => {
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
  }, [trackedVizCities, stateFilter, rankFilter, searchFilter, baseCityRaw]);

  const handleLiveApiSync = async () => {
    setIsSyncing(true);
    saveApiKeys(apiKeys);

    await applyCensusWages();

    if (!hasCustomApiKeys(apiKeys)) {
      setCacheStats(cacheService.getSummary());
      setSyncStatus('Synced Keyless US Census ACS + Default 2026 BEA RPP & Career LMI');
      setIsSyncing(false);
      return;
    }

    // Only query APIs for user-tracked cities (each fetcher checks cacheService first)
    const batch = trackedVizCities.slice(0, 10);
    let updatedCount = 0;

    const updatedCitiesMap = {};
    const newTaxOverrides = { ...liveTaxOverrides };
    const newCareerOverrides = { ...liveCareerOverrides };

    for (const cityObj of batch) {
      const baselineCareer = buildBaselineCareerMetrics(cityObj, activeCareerProfile);

      const [apvData, beaData, taxData, adzunaData, cosData, blsData] = await Promise.all([
        fetchAPVerveColIndex(cityObj, apiKeys.apverve),
        fetchBEARegionalParity(cityObj, apiKeys.bea),
        fetchAPINinjasTax(cityObj, targetSalary, taxProfile.filingStatus, apiKeys.apininjas),
        fetchAdzunaCareerData(cityObj, activeCareerProfile, apiKeys.adzunaAppId, apiKeys.adzunaAppKey),
        fetchCareerOneStopData(
          cityObj,
          activeCareerProfile,
          apiKeys.careerOneStopUserId,
          apiKeys.careerOneStopToken
        ),
        fetchBLSLaborTimeSeries(
          cityObj,
          activeCareerProfile,
          apiKeys.blsApiKey,
          baselineCareer.blsMeta.oewsSeriesId
        )
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

      if (adzunaData || cosData || blsData) {
        const cKey = `${cityObj.id}_${activeCareerProfile.id}`;
        newCareerOverrides[cKey] = {
          adzuna: adzunaData,
          careerOneStop: cosData,
          bls: blsData
        };
        updatedCount++;
      }
    }

    if (Object.keys(updatedCitiesMap).length > 0) {
      setCities((prev) =>
        prev.map((c) => (updatedCitiesMap[c.id] ? { ...c, indices: updatedCitiesMap[c.id] } : c))
      );
    }
    setLiveTaxOverrides(newTaxOverrides);
    setLiveCareerOverrides(newCareerOverrides);
    setCacheStats(cacheService.getSummary());
    setSyncStatus(
      updatedCount > 0
        ? `BYOK Live Sync (${batch.length} tracked cities): Updated ${updatedCount} results (Cached)`
        : 'Keyless US Census ACS + Default 2026 BEA RPP & Career LMI Active'
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
    setSelectedCityIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
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
    setSelectedCityIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const uniqueStates = useMemo(
    () => Array.from(new Set(trackedVizCities.map((c) => c.state))).sort(),
    [trackedVizCities]
  );

  const usingByok = hasCustomApiKeys(apiKeys);

  return (
    <div className="m3-app-layout">
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
              150 U.S. Cities + London • Cost, Tax, Career Viability (Adzuna, CareerOneStop &amp; BLS)
            </p>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className={linkCopied ? 'btn-primary' : 'btn-secondary'}
              onClick={handleShareComparisonLink}
              title="Copy shareable URL with your current Base City, profession, salary, tax profile, and budget weights"
            >
              {linkCopied ? <Check size={15} /> : <Share2 size={15} />}
              <span>{linkCopied ? 'Copied Share Link!' : 'Share Link'}</span>
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

      <main className="m3-main-container">
        {showApiDrawer && (
          <section className="api-drawer">
            <p className="helper-note" style={{ marginTop: 0, marginBottom: '0.85rem', color: '#cbd5e1' }}>
              <strong>GitHub Pages Public Demo Security:</strong> No API keys are bundled with this site. Keys entered below are saved strictly in your browser&apos;s <code>localStorage</code> and cached for 7 days. See <code>API_KEYS_GUIDE.md</code> for instructions on obtaining each key.
            </p>
            <div className="api-grid">
              <div>
                <label>APVerve Key (Cost of Living)</label>
                <input
                  type="password"
                  placeholder="Optional x-api-key..."
                  value={apiKeys.apverve}
                  onChange={(e) => setApiKeys({ ...apiKeys, apverve: e.target.value })}
                />
              </div>
              <div>
                <label>API Ninjas Key (Income Tax)</label>
                <input
                  type="password"
                  placeholder="Optional X-Api-Key..."
                  value={apiKeys.apininjas}
                  onChange={(e) => setApiKeys({ ...apiKeys, apininjas: e.target.value })}
                />
              </div>
              <div>
                <label>BEA UserID Key (Regional Parities)</label>
                <input
                  type="password"
                  placeholder="Optional 36-char BEA UserID..."
                  value={apiKeys.bea}
                  onChange={(e) => setApiKeys({ ...apiKeys, bea: e.target.value })}
                />
              </div>
              <div>
                <label>Adzuna App ID</label>
                <input
                  type="text"
                  placeholder="Optional Adzuna app_id..."
                  value={apiKeys.adzunaAppId}
                  onChange={(e) => setApiKeys({ ...apiKeys, adzunaAppId: e.target.value })}
                />
              </div>
              <div>
                <label>Adzuna App Key</label>
                <input
                  type="password"
                  placeholder="Optional Adzuna app_key..."
                  value={apiKeys.adzunaAppKey}
                  onChange={(e) => setApiKeys({ ...apiKeys, adzunaAppKey: e.target.value })}
                />
              </div>
              <div>
                <label>CareerOneStop User ID</label>
                <input
                  type="text"
                  placeholder="Optional COS User ID..."
                  value={apiKeys.careerOneStopUserId}
                  onChange={(e) => setApiKeys({ ...apiKeys, careerOneStopUserId: e.target.value })}
                />
              </div>
              <div>
                <label>CareerOneStop API Token</label>
                <input
                  type="password"
                  placeholder="Optional COS Bearer token..."
                  value={apiKeys.careerOneStopToken}
                  onChange={(e) => setApiKeys({ ...apiKeys, careerOneStopToken: e.target.value })}
                />
              </div>
              <div>
                <label>BLS API v2 Key (OEWS &amp; LAUS)</label>
                <input
                  type="password"
                  placeholder="Optional BLS registration key..."
                  value={apiKeys.blsApiKey}
                  onChange={(e) => setApiKeys({ ...apiKeys, blsApiKey: e.target.value })}
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
                  {isSyncing ? 'Syncing...' : 'Save Browser Keys & Sync Tracked'}
                </button>
                <button
                  className="btn-danger"
                  onClick={() => {
                    clearStoredApiKeys();
                    setApiKeys(getStoredApiKeys());
                    setLiveCareerOverrides({});
                    setLiveTaxOverrides({});
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

        {/* Primary Control Surface */}
        <section className="control-panel-v4">
          <div className="control-group">
            <label>
              <Building2 size={14} /> Base City (Code or Select)
            </label>
            <div className="dual-input">
              <input
                type="text"
                value={baseQueryInput}
                onChange={(e) => handleBaseInputCommit(e.target.value)}
                placeholder="STL"
                className="code-input"
              />
              <select
                value={baseCityEvaluated.id}
                onChange={(e) => {
                  setBaseCityId(e.target.value);
                  const found = cities.find((c) => c.id === e.target.value);
                  if (found) setBaseQueryInput(found.code);
                  setSelectedCityIds((prev) =>
                    prev.includes(e.target.value) ? prev : [e.target.value, ...prev]
                  );
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
              <DollarSign size={14} /> Target Base Salary (USD)
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

          <div className="control-group">
            <label>
              <Briefcase size={14} /> Target Career / Profession
            </label>
            <select
              value={selectedCareerId}
              onChange={(e) => setSelectedCareerId(e.target.value)}
              className="career-select"
            >
              {CAREER_CATEGORIES.map((categoryName) => {
                const rolesInCategory = CAREER_PROFILES.filter(
                  (prof) => prof.category === categoryName
                );
                if (rolesInCategory.length === 0) return null;
                return (
                  <optgroup key={categoryName} label={categoryName}>
                    {rolesInCategory.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.title} (SOC {prof.socCode})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <TrackedCitiesSelector
            allCities={cities}
            selectedCityIds={effectiveTrackedIds}
            onChangeSelectedCityIds={setSelectedCityIds}
            baseCityId={baseCityEvaluated.id}
          />

          <div className="control-group customize-trigger-group">
            <label>Tax &amp; Budget Weights</label>
            <button
              type="button"
              className="btn-secondary customize-modal-btn"
              onClick={() => setShowTaxBudgetModal(true)}
            >
              <Sliders size={15} />
              <span>Customize Tax &amp; Budget</span>
            </button>
          </div>
        </section>

        {/* Filter & View Toggle Bar */}
        <section className="toolbar-bar">
          <div className="view-toggle-group">
            <button
              className={activeView === 'chart' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setActiveView('chart')}
            >
              <BarChart3 size={16} /> <span>Chart View ({trackedVizCities.length} Tracked)</span>
            </button>
            <button
              className={activeView === 'map' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setActiveView('map')}
            >
              <MapPin size={16} /> <span>OpenStreetMap ({trackedVizCities.length} Tracked)</span>
            </button>
          </div>

          <div className="filter-controls">
            <div className="search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search tracked cities..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="ALL">Tracked States &amp; UK ({trackedVizCities.length} Cities)</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  State / Region: {st}
                </option>
              ))}
            </select>

            <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
              <option value="ALL">All Tracked Ranks</option>
              <option value="TOP1">#1 Largest City per State</option>
              <option value="INTL">International + Base City</option>
            </select>
          </div>
        </section>

        {/* Chart & Map View Driven by Explicitly Tracked Cities */}
        {activeView === 'chart' ? (
          <CostChartView
            cities={trackedVizCities}
            baseCity={baseCityEvaluated}
            targetSalary={deferredSalary}
          />
        ) : (
          <CostMapView
            cities={trackedVizCities}
            baseCity={baseCityEvaluated}
            targetSalary={deferredSalary}
            onInspectTax={(cityObj) => setInspectedTaxCityId(cityObj.id)}
          />
        )}

        {/* Table Displays ONLY Tracked Cities (Using Cached Data When Tracked Cities Change) */}
        <CityTable
          cities={filteredTrackedTableCities}
          totalTrackedCount={trackedVizCities.length}
          baseCity={baseCityEvaluated}
          targetSalary={deferredSalary}
          onCompareCity={(cityObj) => setCompareTargetCityId(cityObj.id)}
          onInspectTax={(cityObj) => setInspectedTaxCityId(cityObj.id)}
          onInspectBudget={(cityObj) => setInspectedBudgetCityId(cityObj.id)}
          onInspectCareer={(cityObj) => setInspectedCareerCityId(cityObj.id)}
        />
      </main>

      {showTaxBudgetModal && (
        <TaxAndBudgetControls
          taxProfile={taxProfile}
          onChangeTaxProfile={setTaxProfile}
          budgetWeights={budgetWeights}
          onChangeBudgetWeights={setBudgetWeights}
          onClosePanel={() => setShowTaxBudgetModal(false)}
        />
      )}

      {inspectedTaxCity && (
        <TaxBreakdownModal
          city={inspectedTaxCity}
          baseCity={baseCityEvaluated}
          taxProfile={taxProfile}
          onClose={() => setInspectedTaxCityId(null)}
        />
      )}

      {inspectedBudgetCity && (
        <BudgetBreakdownModal
          city={inspectedBudgetCity}
          baseCity={baseCityEvaluated}
          targetSalary={deferredSalary}
          onClose={() => setInspectedBudgetCityId(null)}
        />
      )}

      {inspectedCareerCity && (
        <CareerViabilityModal
          city={inspectedCareerCity}
          onClose={() => setInspectedCareerCityId(null)}
        />
      )}

      {compareTargetCity && (
        <RelocationCompareModal
          allCities={evaluatedCities}
          baseCity={baseCityEvaluated}
          initialTargetCity={compareTargetCity}
          targetSalary={deferredSalary}
          onClose={() => setCompareTargetCityId(null)}
        />
      )}

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