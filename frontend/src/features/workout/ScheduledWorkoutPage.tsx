import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import PwaCapabilityBanner from '@/components/PwaCapabilityBanner';
import WorkoutPowerChart from '@/components/training/WorkoutPowerChart';
import { ErrorState, LoadingState, Metric, Page, Surface } from '@/ui';

import { workoutMessages } from './messages';
import { deliveryCapabilities, getActiveExecution, getScheduledWorkout, scheduledExportUrl, startExecution } from './workoutApi';

export default function ScheduledWorkoutPage() {
  const t = workoutMessages.useT();
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

  if (workout.isLoading) return <LoadingState message={t('scheduled.loading')} />;
  if (workout.isError || !workout.data) {
    return <ErrorState title={t('scheduled.loadErrorTitle')} message={t('scheduled.loadErrorMessage')} onRetry={() => void workout.refetch()} />;
  }
  const plan = workout.data;
  const activeExecution = active.data;
  const canResume = activeExecution?.scheduledWorkoutId === plan.id
    && (activeExecution.status === 'RUNNING' || activeExecution.status === 'PAUSED');
  const anotherActive = activeExecution && activeExecution.scheduledWorkoutId !== plan.id;
  const garmin = capabilities.data?.find(capability => capability.method === 'GARMIN');

  return (
    <Page
      title={plan.workoutTemplateName ?? plan.plannedDescription ?? t('scheduled.untitled')}
      subtitle={t('scheduled.subtitle', { date: plan.date, revision: plan.workoutTemplateRevision ?? 'legacy' })}
      maxWidth={1100}
    >
      <PwaCapabilityBanner />
      {!!start.isError && <Alert severity="error" sx={{ mb: 2 }}>{t('scheduled.startError')}</Alert>}
      {!!anotherActive && <Alert severity="warning" sx={{ mb: 2 }}>{t('scheduled.anotherActive')}</Alert>}
      <Stack spacing={2.5}>
        <Surface variant="accent">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{
            justifyContent: "space-between"
          }}>
            <Box>
              <Typography variant="overline" sx={{
                color: "text.secondary"
              }}>{t('scheduled.immutableSnapshot')}</Typography>
              <Typography variant="h4">{plan.workoutTemplateName ?? plan.plannedType}</Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                  mt: 1
                }}>{plan.plannedDescription}</Typography>
            </Box>
            <Stack direction="row" spacing={{ xs: 2, sm: 4 }} sx={{
              flexWrap: "wrap"
            }}>
              <Metric label={t('scheduled.time')} value={plan.plannedDurationMin ?? '—'} unit="min" />
              <Metric label={t('scheduled.ftpAtExecution')} value={plan.ftpWatts ?? '—'} unit={plan.ftpWatts ? 'W' : undefined} hint={t('scheduled.ftpHint')} />
              <Metric label="TSS" value={plan.plannedTss ?? '—'} />
            </Stack>
          </Stack>
          <Box sx={{ mt: 3 }}>
            <WorkoutPowerChart steps={plan.workoutStepsSnapshot ?? []} />
          </Box>
        </Surface>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="contained"
            size="large"
            startIcon={canResume ? <RestartAltIcon /> : <PlayArrowIcon />}
            disabled={Boolean(anotherActive) || start.isPending}
            onClick={() => canResume ? navigate(`/workout/${activeExecution.id}`) : start.mutate()}
            sx={{ minHeight: 48 }}
          >
            {canResume ? t('scheduled.resume') : t('scheduled.start')}
          </Button>
          <Stack direction="row" spacing={1}>
            <Button component="a" href={scheduledExportUrl(plan.id, 'fit')} startIcon={<DownloadIcon />} sx={{ minHeight: 48, flex: 1 }}>
              {t('scheduled.downloadFit')}
            </Button>
            <Button component="a" href={scheduledExportUrl(plan.id, 'zwo')} startIcon={<DownloadIcon />} sx={{ minHeight: 48, flex: 1 }}>
              {t('scheduled.downloadZwo')}
            </Button>
          </Stack>
        </Stack>

        <Surface>
          <Stack direction="row" spacing={1.5} sx={{
            alignItems: "center"
          }}>
            <WatchOutlinedIcon color={garmin?.status === 'AVAILABLE' ? 'success' : 'disabled'} />
            <Box>
              <Typography variant="subtitle1">Garmin Training API</Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>{garmin?.reason ?? t('scheduled.garminChecking')}</Typography>
            </Box>
            <Chip label={garmin?.status ?? '…'} size="small" color={garmin?.status === 'AVAILABLE' ? 'success' : 'default'} />
          </Stack>
        </Surface>
      </Stack>
    </Page>
  );
}
