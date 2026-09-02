import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { Badge, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useCreateImportJob, useProcessingJob } from '@/features/data/useDataJobs';
import { invalidateAfterTrainingSync } from '@/hooks/queryInvalidation';
import { useCheckNewActivities, useSyncStatus } from '@/hooks/useAnalytics';

import type { Theme } from '@mui/material/styles';

/**
 * Round white action button matching the TopBar floating cluster style.
 * Stays opaque on hover; the token overlay only tints the surface slightly.
 */
const roundButtonSx = (theme: Theme) => ({
  width: 40,
  height: 40,
  bgcolor: theme.tokens.searchPill,
  color: theme.palette.text.primary,
  boxShadow: theme.tokens.cardShadow,
  transition: theme.tokens.transition,
  '&:hover': {
    bgcolor: theme.tokens.searchPill,
    backgroundImage: `linear-gradient(${theme.tokens.hoverOverlay}, ${theme.tokens.hoverOverlay})`,
    boxShadow: theme.tokens.cardShadowHover,
  },
  '&.Mui-disabled': {
    bgcolor: theme.tokens.searchPill,
    color: theme.palette.text.secondary,
    boxShadow: theme.tokens.cardShadow,
  },
});

interface TopBarSyncButtonProps {
  /** Called after successful sync to invalidate dashboard queries */
  onSyncComplete?: () => void;
}

/**
 * Compact sync button for the TopBar floating cluster.
 * Shows a badge with the count of new activities and triggers syncRecent on click.
 */
export default function TopBarSyncButton({ onSyncComplete }: TopBarSyncButtonProps) {
  const queryClient = useQueryClient();
  const { data: checkData } = useCheckNewActivities();
  const { data: syncStatus } = useSyncStatus();
  const createImportJob = useCreateImportJob();
  const [jobId, setJobId] = useState<string>();
  const job = useProcessingJob(jobId);
  const handledTerminalJob = useRef<string | undefined>(undefined);

  const isJobActive = job.data?.status === 'QUEUED' || job.data?.status === 'RUNNING';
  const isSyncing = syncStatus?.status === 'in_progress' || createImportJob.isPending || isJobActive;
  const isRateLimited = syncStatus?.status === 'rate_limited' || job.data?.status === 'RETRYABLE';
  const hasFailed = job.data?.status === 'FAILED' || createImportJob.isError || job.isError;
  const hasNew = checkData?.hasNew ?? false;
  const newCount = checkData?.count ?? 0;

  const handleSync = useCallback(() => {
    createImportJob.mutate('RECENT', {
      onSuccess: created => {
        handledTerminalJob.current = undefined;
        setJobId(created.id);
      },
    });
  }, [createImportJob]);

  useEffect(() => {
    if (!job.data || handledTerminalJob.current === job.data.id) return;
    if (job.data.status === 'COMPLETED') {
      handledTerminalJob.current = job.data.id;
      invalidateAfterTrainingSync(queryClient);
      onSyncComplete?.();
    } else if (job.data.status === 'FAILED' || job.data.status === 'RETRYABLE') {
      handledTerminalJob.current = job.data.id;
    }
  }, [job.data, onSyncComplete, queryClient]);

  const tooltip = isSyncing
    ? 'Synchronizacja w toku...'
    : isRateLimited
      ? 'API Strava zablokowane'
      : hasFailed
        ? 'Synchronizacja nie powiodła się — sprawdź Dane i zadania'
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
          aria-label="Synchronizuj ostatnie treningi"
          sx={[
            roundButtonSx,
            {
              position: 'relative',
              zIndex: 1,
              opacity: isRateLimited ? 0.4 : 1,
              '@keyframes syncPulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
              animation: isSyncing ? 'syncPulse 1.2s ease-in-out infinite' : 'none',
            },
          ]}
        >
          {isSyncing ? (
            <CircularProgress size={20} sx={{ color: 'primary.main' }} />
          ) : (
            <CloudSyncIcon
              sx={{
                fontSize: 20,
                color: hasNew ? 'primary.main' : 'text.primary',
              }}
            />
          )}
        </IconButton>
      </Badge>
    </Tooltip>
  );
}
