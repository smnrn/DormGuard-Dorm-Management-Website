import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { dataStore } from './dataStore';

/**
 * Custom hook for optimized dataStore subscription
 * Prevents unnecessary re-renders by managing state efficiently
 */
export function useDataStore() {
  const [, setRefresh] = useState(0);
  
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setRefresh(prev => prev + 1);
    });
    return unsubscribe;
  }, []);
  
  return dataStore;
}

/**
 * Debounced value hook for search inputs
 * Prevents excessive filtering on every keystroke
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for filtered visitors with memoization
 * Prevents expensive filtering operations on every render
 */
export function useFilteredVisitors(searchQuery: string) {
  const store = useDataStore();
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  return useMemo(() => {
    const allVisitors = store.getAllVisitorsWithDetails();
    
    if (!debouncedSearch) {
      return allVisitors;
    }
    
    const search = debouncedSearch.toLowerCase();
    return allVisitors.filter(visitor =>
      visitor.visitor_name?.toLowerCase().includes(search) ||
      visitor.tenant_name?.toLowerCase().includes(search) ||
      visitor.tenant_room_number?.includes(search) ||
      visitor.visitor_contact?.includes(search)
    );
  }, [store, debouncedSearch]);
}

/**
 * Hook for periodic data refresh
 * Automatically refreshes data at specified interval
 */
export function useAutoRefresh(intervalMs: number = 30000) {
  const store = useDataStore();
  
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing data...');
      store.refreshAll();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [store, intervalMs]);
}

/**
 * Hook for throttled function calls
 * Prevents function from being called too frequently
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook for measuring component render performance
 * Logs render time to console in development
 */
export function useRenderTime(componentName: string) {
  const renderStartTime = useRef(performance.now());
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > 16) { // Only log if slower than 60fps (16ms)
      console.warn(`${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
  });
}
