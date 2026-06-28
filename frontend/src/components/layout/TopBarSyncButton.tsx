import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { Badge, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useCallback } from 'react';

import {
  useCheckNewActivities,
  useSyncRecent,
  useSyncStatus,
} from '@/hooks/useAnalytics';

interface TopBarSyncButtonProps {
  /** Called after successful sync to invalidate dashboard queries */
  onSyncComplete?: () => void;
}

/**
 * Compact sync button for the TopBar floating cluster.
 * Shows a badge with the count of new activities and triggers syncRecent on click.
 */
export default function TopBarSyncButton({ onSyncComplete }: TopBarSyncButtonProps) {
  const { data: checkData } = useCheckNewActivities();
  const { data: syncStatus } = useSyncStatus();
  const syncRecent = useSyncRecent();

  const isSyncing = syncStatus?.status === 'in_progress' || syncRecent.isPending;
  const isRateLimited = syncStatus?.status === 'rate_limited';
  const hasNew = checkData?.hasNew ?? false;
  const newCount = checkData?.count ?? 0;

  const handleSync = useCallback(() => {
    syncRecent.mutate(undefined, {
      onSuccess: () => onSyncComplete?.(),
    });
  }, [syncRecent, onSyncComplete]);

  const tooltip = isSyncing
    ? 'Synchronizacja w toku...'
    : isRateLimited
      ? 'API Strava zablokowane'
      : hasNew
        ? `Sync: ${newCount} nowych aktywności`
        : 'Sync ostatnich treningów';

  return (
    <Tooltip title={tooltip} arrow>
      <Badge
        badgeContent={hasNew ? newCount : 0}
        color="error"
        invisible={!hasNew || isSyncing}
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.65rem',
            fontWeight: 800,
            minWidth: 18,
            height: 18,
          },
        }}
      >
        <IconButton
          onClick={handleSync}
          disabled={isSyncing || isRateLimited}
          size="small"
          aria-label="Sync ostatnich treningów"
          sx={{
            position: 'relative',
            zIndex: 1,
            opacity: isRateLimited ? 0.4 : 1,
            transition: 'opacity 0.2s',
            '@keyframes syncPulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
            animation: isSyncing ? 'syncPulse 1.2s ease-in-out infinite' : 'none',
          }}
        >
          {isSyncing ? (
            <CircularProgress size={20} sx={{ color: 'primary.main' }} />
          ) : (
            <CloudSyncIcon
              sx={{
                fontSize: 22,
                color: hasNew ? 'primary.main' : 'text.secondary',
              }}
            />
          )}
        </IconButton>
      </Badge>
    </Tooltip>
  );
}
