import { useEffect, useSyncExternalStore } from "react";

const cache = {};
const listeners = new Set();
const loadingState = {};
const errorState = {};

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => cb());
}

/**
 * Fetch and cache budget JSON data for a given fiscal year.
 */
// Track which years have been fetched (or are in-flight)
const fetchedKeys = new Set();

export default function useBudgetData(yearKey = "fy2025") {
  const data = useSyncExternalStore(subscribe, () => cache[yearKey] || null);
  const loading = useSyncExternalStore(subscribe, () => loadingState[yearKey] ?? !cache[yearKey]);
  const error = useSyncExternalStore(subscribe, () => errorState[yearKey] || null);

  useEffect(() => {
    if (cache[yearKey] || fetchedKeys.has(yearKey)) return;
    fetchedKeys.add(yearKey);

    loadingState[yearKey] = true;
    errorState[yearKey] = null;
    notify();

    fetch(`/data/${yearKey}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${yearKey}: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        cache[yearKey] = json;
        loadingState[yearKey] = false;
        notify();
      })
      .catch((err) => {
        errorState[yearKey] = err.message;
        loadingState[yearKey] = false;
        notify();
      });
  }, [yearKey]);

  return { data, loading, error };
}
