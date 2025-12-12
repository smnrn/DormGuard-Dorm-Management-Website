import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTimeSinceSync } from '../hooks/useRealTimeSync';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  onRefresh: () => void;
  showTimestamp?: boolean;
}

export function SyncStatusIndicator({
  isSyncing,
  lastSyncTime,
  syncError,
  onRefresh,
  showTimestamp = true,
}: SyncStatusIndicatorProps) {
  const timeAgo = useTimeSinceSync(lastSyncTime);

  return (
    <div className="flex items-center gap-2">
      {/* Sync Status Badge */}
      {syncError ? (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="size-3" />
          <span>Sync Error</span>
        </Badge>
      ) : isSyncing ? (
        <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="size-3 animate-spin" />
          <span>Syncing...</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <Wifi className="size-3" />
          <span>Live</span>
        </Badge>
      )}

      {/* Last Sync Time */}
      {showTimestamp && lastSyncTime && !syncError && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="size-3" />
          {timeAgo}
        </span>
      )}

      {/* Manual Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isSyncing}
        className="h-8 px-2"
      >
        <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
