// src/services/cacheService.js

const CACHE_PREFIX = "cost_tracker_v1_";
const STATS_KEY = "cost_tracker_v1_stats";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const getStats = () => {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { hits: 0, misses: 0 };
  } catch {
    return { hits: 0, misses: 0 };
  }
};

const recordStat = (type) => {
  try {
    const stats = getStats();
    stats[type] = (stats[type] || 0) + 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
};

export const cacheService = {
  get(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) {
        recordStat("misses");
        return null;
      }
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(CACHE_PREFIX + key);
        recordStat("misses");
        return null;
      }
      recordStat("hits");
      return parsed.data;
    } catch {
      return null;
    }
  },

  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    try {
      const payload = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
    } catch (err) {
      console.warn("localStorage quota exceeded, pruning oldest entries:", err);
    }
  },

  getSummary() {
    const stats = getStats();
    let count = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX) && k !== STATS_KEY) {
          count++;
        }
      }
    } catch {
      // ignore
    }
    return { ...stats, entries: count };
  },

  clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.error("Error clearing cache:", err);
    }
  },
};
