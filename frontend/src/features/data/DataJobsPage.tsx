import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { getLocale } from '@/i18n';
import { EmptyState, ErrorState, LoadingState, Metric, Page, Surface } from '@/ui';

import { dataJobsMessages } from './messages';
import {
  useCreateImportJob,
  useCreateRecalculationJob,
  useDataQualitySummary,
  useLatestProcessingJob,
  useProcessingJob,
  useRetryJob,
} from './useDataJobs';

const stages = ['FETCH_SUMMARY', 'FETCH_DETAIL', 'REFRESH_PROVENANCE', 'STORE_ACTIVITY', 'CALCULATE_METRICS', 'UPDATE_DAILY', 'DERIVE_INSIGHTS', 'COMPLETE'];

export default function DataJobsPage() {
  const t = dataJobsMessages.useT();
  const quality = useDataQualitySummary();
  const refetchQuality = quality.refetch;
  const [jobId, setJobId] = useState<string>();
  const job = useProcessingJob(jobId);
  const latestJob = useLatestProcessingJob();
  const importJob = useCreateImportJob();
  const recalculation = useCreateRecalculationJob();
  const retry = useRetryJob();

  const startImport = (mode: 'RECENT' | 'FULL' | 'POWER_PROVENANCE') => {
    importJob.mutate(mode, { onSuccess: created => setJobId(created.id) });
  };
  const startRecalculation = () => {
    recalculation.mutate(undefined, { onSuccess: created => setJobId(created.id) });
  };
  const activeJob = jobId ? job.data : latestJob.data ?? undefined;
  const progress = activeJob ? Math.max(4, ((stages.indexOf(activeJob.stage) + 1) / stages.length) * 100) : 0;
  const waitingForAutomaticRetry = activeJob?.status === 'RETRYABLE'
    && Boolean(activeJob.retryAt)
    && Date.parse(activeJob.retryAt ?? '') > Date.now();
  const automaticRetryScheduled = activeJob?.status === 'RETRYABLE' && Boolean(activeJob.retryAt);
  const busy = activeJob?.status === 'QUEUED' || activeJob?.status === 'RUNNING'
    || automaticRetryScheduled || importJob.isPending || recalculation.isPending || retry.isPending;

  useEffect(() => {
    if (activeJob?.status === 'RETRYABLE' || activeJob?.status === 'COMPLETED') {
      void refetchQuality();
    }
  }, [activeJob?.status, activeJob?.updatedAt, refetchQuality]);

  return (
    <Page title={t('title')} subtitle={t('subtitle')} maxWidth={1180}>
      <Grid container spacing={2.5}>
        <Grid
          size={{
            xs: 12,
            md: 5
          }}>
          <Surface variant="accent" sx={{ height: '100%' }}>
            <Stack direction="row" spacing={1} sx={{
              alignItems: "center"
            }}><DataObjectOutlinedIcon color="primary" /><Typography variant="h6">{t('quality.title')}</Typography></Stack>
            {quality.isLoading ? <LoadingState message={t('quality.loading')} /> : null}
            {quality.isError ? <ErrorState message={t('quality.error')} onRetry={() => void quality.refetch()} /> : null}
            {quality.data ? (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={6}><Metric label={t('quality.assessed')} value={`${quality.data.assessedActivities}/${quality.data.totalActivities}`} tone="primary" /></Grid>
                <Grid size={6}><Metric label={t('quality.available')} value={quality.data.available} tone="success" /></Grid>
                <Grid size={6}><Metric label={t('quality.partial')} value={quality.data.partial} tone="warning" /></Grid>
                <Grid size={6}><Metric label={t('quality.unknown')} value={quality.data.unknown} /></Grid>
                <Grid size={4}><Metric label={t('quality.measuredPower')} value={quality.data.measuredPowerActivities} tone="success" /></Grid>
                <Grid size={4}><Metric label={t('quality.estimatedPower')} value={quality.data.estimatedPowerActivities} tone="warning" /></Grid>
                <Grid size={4}><Metric label={t('quality.unknownPowerProvenance')} value={quality.data.unknownPowerProvenanceActivities} /></Grid>
                {quality.data.unassessed > 0 ? (
                  <Grid size={12}>
                    <Alert severity="info">{t('quality.unassessed', { count: quality.data.unassessed })}</Alert>
                  </Grid>
                ) : null}
              </Grid>
            ) : null}
          </Surface>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 7
          }}>
          <Surface sx={{ height: '100%' }}>
            <Stack direction="row" spacing={1} sx={{
              alignItems: "center"
            }}><SyncOutlinedIcon color="primary" /><Typography variant="h6">{t('run.title')}</Typography></Stack>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 1
              }}>{t('run.description')}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2.5 }}>
              <Button variant="contained" disabled={busy} onClick={() => startImport('RECENT')}>{t('run.importRecent')}</Button>
              <Button variant="outlined" disabled={busy} onClick={() => startImport('FULL')}>{t('run.importFull')}</Button>
              <Button variant="outlined" disabled={busy} onClick={() => startImport('POWER_PROVENANCE')}>{t('run.importPowerProvenance')}</Button>
              <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} disabled={busy} onClick={startRecalculation}>{t('run.recalculate')}</Button>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: 'block',
                mt: 1.5
              }}>
              {t('run.powerProvenanceCaption')}
            </Typography>
          </Surface>
        </Grid>

        {activeJob ? (
          <Grid size={12}>
            <Surface>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                <Box><Typography variant="overline" sx={{
                  color: "text.secondary"
                }}>{t('job.attempt', { jobType: activeJob.jobType, attempt: activeJob.attempt })}</Typography><Typography variant="h6">{activeJob.stage}</Typography></Box>
                <Chip label={activeJob.status} color={activeJob.status === 'COMPLETED' ? 'success' : activeJob.status === 'FAILED' ? 'error' : 'primary'} variant="outlined" />
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
              {activeJob.status === 'RETRYABLE' && activeJob.retryAt ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t('job.retryInfo', { time: new Date(activeJob.retryAt).toLocaleString(getLocale()) })}
                </Alert>
              ) : null}
              {activeJob.errorMessage ? <Alert severity="error" sx={{ mt: 2 }}>{activeJob.errorMessage}</Alert> : null}
              {activeJob.status === 'FAILED' || activeJob.status === 'RETRYABLE' ? (
                <Button sx={{ mt: 2 }} disabled={retry.isPending || waitingForAutomaticRetry} onClick={() => retry.mutate(activeJob.id, { onSuccess: updated => setJobId(updated.id) })}>{t('job.retry')}</Button>
              ) : null}
            </Surface>
          </Grid>
        ) : (
          <Grid size={12}>
            <Surface padding="none">
              <EmptyState
                icon={<DataObjectOutlinedIcon />}
                title={t('empty.title')}
                description={t('empty.description')}
              />
            </Surface>
          </Grid>
        )}
      </Grid>
    </Page>
  );
}
