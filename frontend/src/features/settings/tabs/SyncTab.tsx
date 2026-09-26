import { Stack } from '@mui/material';

import BackgroundJobsInfo from '@/components/admin/BackgroundJobsInfo';
import { adminMessages } from '@/components/admin/messages';
import SyncStatusSection from '@/components/admin/SyncStatusSection';
import {
  useAutoSyncConfig,
  useClearSyncData,
  useRecalculateAllActivityMetrics,
  useRecalculateMetrics,
  useResyncStreams,
  useSyncActivityPhotos,
  useSyncFull,
  useSyncRecent,
  useSyncStatus,
  useUpdateAutoSyncConfig,
} from '@/hooks/useAnalytics';
import { useCountdown } from '@/hooks/useCountdown';
import { getApiErrorMessage } from '@/utils/errorHandling';

interface MutationWithError {
  isError?: boolean;
  error?: unknown;
}

function mutationError(mutation: MutationWithError, fallback: string): string | null {
  return mutation.isError ? getApiErrorMessage(mutation.error, fallback) : null;
}

export default function SyncTab() {
  const t = adminMessages.useT();
  const { data: syncStatus, isLoading: syncLoading } = useSyncStatus();
  const syncFull = useSyncFull();
  const syncRecent = useSyncRecent();
  const syncPhotos = useSyncActivityPhotos();
  const resyncStreams = useResyncStreams();
  const clearSyncData = useClearSyncData();
  const recalculateMetrics = useRecalculateMetrics();
  const recalculateActivityMetrics = useRecalculateAllActivityMetrics();
  const { data: autoSyncConfig } = useAutoSyncConfig();
  const updateAutoSyncConfig = useUpdateAutoSyncConfig();

  const isSyncing = syncStatus?.status === 'in_progress' || syncFull.isPending || syncRecent.isPending
    || syncPhotos.isPending || resyncStreams.isPending;
  const isRateLimited = syncStatus?.status === 'rate_limited';
  const rateLimitCountdown = useCountdown(isRateLimited ? syncStatus?.rateLimitResetsAt : null);
  const syncDisabled = isSyncing || (isRateLimited && rateLimitCountdown.isActive);
  const syncErrorMessage =
    mutationError(syncRecent, t('page.syncErrorGeneric'))
    ?? mutationError(syncPhotos, t('page.syncErrorPhotos'))
    ?? mutationError(syncFull, t('page.syncErrorGeneric'));

  return (
    <Stack spacing={2.5}>
      <SyncStatusSection
        syncStatus={syncStatus} syncLoading={syncLoading} isSyncing={isSyncing}
        isRateLimited={isRateLimited} rateLimitCountdown={rateLimitCountdown.label}
        syncDisabled={syncDisabled} syncErrorMessage={syncErrorMessage}
        syncPhotosPending={syncPhotos.isPending} resyncStreamsPending={resyncStreams.isPending}
        clearSyncDataPending={clearSyncData.isPending} recalculateMetricsPending={recalculateMetrics.isPending}
        recalculateActivityMetricsPending={recalculateActivityMetrics.isPending}
        autoSyncIntervalMinutes={autoSyncConfig?.intervalMinutes}
        updateAutoSyncPending={updateAutoSyncConfig.isPending}
        onSyncRecent={() => syncRecent.mutate()} onSyncFull={() => syncFull.mutate()}
        onSyncPhotos={() => syncPhotos.mutate()} onResyncStreams={() => resyncStreams.mutate()}
        onClearSyncData={() => clearSyncData.mutate()} onRecalculateMetrics={() => recalculateMetrics.mutate()}
        onRecalculateActivityMetrics={() => recalculateActivityMetrics.mutate()}
        onUpdateAutoSyncInterval={(minutes) => updateAutoSyncConfig.mutate(minutes)}
      />
      <BackgroundJobsInfo />
    </Stack>
  );
}
