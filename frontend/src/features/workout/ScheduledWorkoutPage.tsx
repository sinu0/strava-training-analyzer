import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import PwaCapabilityBanner from '@/components/PwaCapabilityBanner';
import WorkoutPowerChart from '@/components/training/WorkoutPowerChart';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';

import { deliveryCapabilities, getActiveExecution, getScheduledWorkout, scheduledExportUrl, startExecution } from './workoutApi';

export default function ScheduledWorkoutPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const workout = useQuery({ queryKey: ['scheduled-workout', id], queryFn: () => getScheduledWorkout(id), enabled: !!id });
  const active = useQuery({ queryKey: ['active-workout-execution'], queryFn: getActiveExecution });
  const capabilities = useQuery({ queryKey: ['workout-delivery-capabilities'], queryFn: deliveryCapabilities });
  const start = useMutation({
    mutationFn: async () => {
      const keyStorage = `workout-start-key:${id}`;
      const key = localStorage.getItem(keyStorage) ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`);
      localStorage.setItem(keyStorage, key);
      return startExecution(id, key);
    },
    onSuccess: execution => navigate(`/workout/${execution.id}`),
    onError: () => void active.refetch(),
  });

  if (workout.isLoading) return <LoadingState message="Wczytuję zaplanowany trening…" />;
  if (workout.isError || !workout.data) {
    return <ErrorState title="Nie udało się wczytać treningu" message="Sprawdź połączenie i spróbuj ponownie." onRetry={() => void workout.refetch()} />;
  }
  const plan = workout.data;
  const activeExecution = active.data;
  const canResume = activeExecution?.scheduledWorkoutId === plan.id
    && (activeExecution.status === 'RUNNING' || activeExecution.status === 'PAUSED');
  const anotherActive = activeExecution && activeExecution.scheduledWorkoutId !== plan.id;
  const garmin = capabilities.data?.find(capability => capability.method === 'GARMIN');

  return (
    <PageContainer
      title={plan.workoutTemplateName ?? plan.plannedDescription ?? 'Zaplanowany trening'}
      subtitle={`${plan.date} · wersja ${plan.workoutTemplateRevision ?? 'legacy'}`}
      maxWidth={1100}
    >
      <PwaCapabilityBanner />
      {!!start.isError && <Alert severity="error" sx={{ mb: 2 }}>Nie udało się rozpocząć treningu. Sprawdź, czy inne wykonanie nie jest aktywne.</Alert>}
      {!!anotherActive && <Alert severity="warning" sx={{ mb: 2 }}>Inny trening jest aktywny. Najpierw go wznów lub zakończ.</Alert>}
      <Stack spacing={2.5}>
        <PerformanceSurface accent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between">
            <Box>
              <Typography variant="overline" color="text.secondary">Niezmienny snapshot planu</Typography>
              <Typography variant="h4">{plan.workoutTemplateName ?? plan.plannedType}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>{plan.plannedDescription}</Typography>
            </Box>
            <Stack direction="row" spacing={{ xs: 2, sm: 4 }} flexWrap="wrap">
              <MetricReadout label="Czas" value={plan.plannedDurationMin ?? '—'} unit="min" />
              <MetricReadout label="FTP wykonania" value={plan.ftpWatts ?? '—'} unit={plan.ftpWatts ? 'W' : undefined} hint="zapisane przy planowaniu" />
              <MetricReadout label="TSS" value={plan.plannedTss ?? '—'} />
            </Stack>
          </Stack>
          <Box sx={{ mt: 3 }}>
            <WorkoutPowerChart steps={plan.workoutStepsSnapshot ?? []} />
          </Box>
        </PerformanceSurface>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="contained"
            size="large"
            startIcon={canResume ? <RestartAltIcon /> : <PlayArrowIcon />}
            disabled={Boolean(anotherActive) || start.isPending}
            onClick={() => canResume ? navigate(`/workout/${activeExecution.id}`) : start.mutate()}
            sx={{ minHeight: 48 }}
          >
            {canResume ? 'Wznów trening' : 'Rozpocznij na tym urządzeniu'}
          </Button>
          <Stack direction="row" spacing={1}>
            <Button component="a" href={scheduledExportUrl(plan.id, 'fit')} startIcon={<DownloadIcon />} sx={{ minHeight: 48, flex: 1 }}>
              Pobierz FIT
            </Button>
            <Button component="a" href={scheduledExportUrl(plan.id, 'zwo')} startIcon={<DownloadIcon />} sx={{ minHeight: 48, flex: 1 }}>
              Pobierz ZWO
            </Button>
          </Stack>
        </Stack>

        <PerformanceSurface sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <WatchOutlinedIcon color={garmin?.status === 'AVAILABLE' ? 'success' : 'disabled'} />
            <Box>
              <Typography variant="subtitle1">Garmin Training API</Typography>
              <Typography variant="body2" color="text.secondary">{garmin?.reason ?? 'Sprawdzanie dostępności…'}</Typography>
            </Box>
            <Chip label={garmin?.status ?? '…'} size="small" color={garmin?.status === 'AVAILABLE' ? 'success' : 'default'} />
          </Stack>
        </PerformanceSurface>
      </Stack>
    </PageContainer>
  );
}
