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
import { useState } from 'react';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';

import {
  useCreateImportJob,
  useCreateRecalculationJob,
  useDataQualitySummary,
  useProcessingJob,
  useRetryJob,
} from './useDataJobs';

const stages = ['FETCH_SUMMARY', 'FETCH_DETAIL', 'STORE_ACTIVITY', 'CALCULATE_METRICS', 'UPDATE_DAILY', 'DERIVE_INSIGHTS', 'COMPLETE'];

export default function DataJobsPage() {
  const quality = useDataQualitySummary();
  const [jobId, setJobId] = useState<string>();
  const job = useProcessingJob(jobId);
  const importJob = useCreateImportJob();
  const recalculation = useCreateRecalculationJob();
  const retry = useRetryJob();

  const startImport = (mode: 'RECENT' | 'FULL') => {
    importJob.mutate(mode, { onSuccess: created => setJobId(created.id) });
  };
  const startRecalculation = () => {
    recalculation.mutate(undefined, { onSuccess: created => setJobId(created.id) });
  };
  const activeJob = job.data;
  const progress = activeJob ? Math.max(4, ((stages.indexOf(activeJob.stage) + 1) / stages.length) * 100) : 0;
  const busy = activeJob?.status === 'QUEUED' || activeJob?.status === 'RUNNING'
    || importJob.isPending || recalculation.isPending || retry.isPending;

  return (
    <PageContainer title="Dane i zadania" subtitle="Kontroluj kompletność danych, import oraz bezpieczne przeliczanie metryk." maxWidth={1180}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <PerformanceSurface accent sx={{ p: 2.5, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center"><DataObjectOutlinedIcon color="primary" /><Typography variant="h6" fontWeight={750}>Jakość danych</Typography></Stack>
            {quality.isLoading ? <LoadingState message="Sprawdzanie jakości…" /> : null}
            {quality.isError ? <ErrorState message="Nie udało się pobrać jakości danych." onRetry={() => void quality.refetch()} /> : null}
            {quality.data ? (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={6}><MetricReadout label="Ocenionych" value={`${quality.data.assessedActivities}/${quality.data.totalActivities}`} tone="primary" /></Grid>
                <Grid item xs={6}><MetricReadout label="Dostępnych" value={quality.data.available} tone="success" /></Grid>
                <Grid item xs={6}><MetricReadout label="Częściowych" value={quality.data.partial} tone="warning" /></Grid>
                <Grid item xs={6}><MetricReadout label="Nieznanych" value={quality.data.unknown} /></Grid>
              </Grid>
            ) : null}
          </PerformanceSurface>
        </Grid>

        <Grid item xs={12} md={7}>
          <PerformanceSurface sx={{ p: 2.5, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center"><SyncOutlinedIcon color="primary" /><Typography variant="h6" fontWeight={750}>Uruchom zadanie</Typography></Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Każde zadanie zapisuje etap, próbę i błąd. Import nie uruchomi się równolegle drugi raz.</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2.5 }}>
              <Button variant="contained" disabled={busy} onClick={() => startImport('RECENT')}>Import ostatnich</Button>
              <Button variant="outlined" disabled={busy} onClick={() => startImport('FULL')}>Pełny import</Button>
              <Button variant="outlined" startIcon={<RefreshOutlinedIcon />} disabled={busy} onClick={startRecalculation}>Przelicz metryki</Button>
            </Stack>
          </PerformanceSurface>
        </Grid>

        {activeJob ? (
          <Grid item xs={12}>
            <PerformanceSurface sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Box><Typography variant="overline" color="text.secondary">{activeJob.jobType} · próba {activeJob.attempt}</Typography><Typography variant="h6" fontWeight={750}>{activeJob.stage}</Typography></Box>
                <Chip label={activeJob.status} color={activeJob.status === 'COMPLETED' ? 'success' : activeJob.status === 'FAILED' ? 'error' : 'primary'} variant="outlined" />
              </Stack>
              <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
              {activeJob.errorMessage ? <Alert severity="error" sx={{ mt: 2 }}>{activeJob.errorMessage}</Alert> : null}
              {activeJob.status === 'FAILED' || activeJob.status === 'RETRYABLE' ? (
                <Button sx={{ mt: 2 }} disabled={retry.isPending} onClick={() => retry.mutate(activeJob.id, { onSuccess: updated => setJobId(updated.id) })}>Wznów od niezakończonego etapu</Button>
              ) : null}
            </PerformanceSurface>
          </Grid>
        ) : null}
      </Grid>
    </PageContainer>
  );
}
