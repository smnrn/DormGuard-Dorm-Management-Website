import { useEffect, useRef, useState } from 'react';
import { dataStore } from '../lib/dataStore';

interface UseRealTimeSyncOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  onSync?: () => void;
}

/**
 * Hook for real-time data synchronization
 * Automatically polls backend and syncs data across all pages
 */
export function useRealTimeSync(options: UseRealTimeSyncOptions = {}) {
  const {
    enabled = true,
    interval = 5000, // 5 seconds default
    onSync,
  } = options;

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual refresh function
  const refresh = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      await dataStore.refreshAll();
      setLastSyncTime(new Date());
      onSync?.();
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncError(error.message || 'Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial sync
    refresh();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      refresh();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    refresh,
  };
}

/**
 * Get time until next sync
 */
export function useTimeSinceSync(lastSyncTime: Date | null): string {
  const [timeAgo, setTimeAgo] = useState<string>('Never');

  useEffect(() => {
    if (!lastSyncTime) {
      setTimeAgo('Never');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSyncTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);

      if (diffSeconds < 5) {
        setTimeAgo('Just now');
      } else if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}s ago`);
      } else {
        const diffMinutes = Math.floor(diffSeconds / 60);
        setTimeAgo(`${diffMinutes}m ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return timeAgo;
}
