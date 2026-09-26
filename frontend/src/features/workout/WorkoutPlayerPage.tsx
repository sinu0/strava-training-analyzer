import { Alert, Box, CircularProgress, Container } from '@mui/material';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { ActualPowerPoint } from '@/components/training/WorkoutPowerChart';

import TrainerCockpit from './cockpit/TrainerCockpit';
import { useTrainerSession } from './devices/useTrainerSession';
import { workoutMessages } from './messages';
import { clearActiveExecution } from './offlineStore';
import { useRideRecording } from './recording/useRideRecording';
import { useWorkoutExecution } from './useWorkoutExecution';
import { sendExecutionMutation } from './workoutApi';
import WorkoutSummary from './WorkoutSummary';

import type { RideSample } from './devices/trainerSession';

export default function WorkoutPlayerPage() {
  const t = workoutMessages.useT();
  const { executionId = '' } = useParams();
  const navigate = useNavigate();
  const player = useWorkoutExecution(executionId);
  const { execution } = player;
  const recording = useRideRecording(execution);
  const [actualPower, setActualPower] = useState<ActualPowerPoint[]>([]);
  const ftpWatts = execution?.ftpWatts ?? null;
  const recordSample = recording.onSample;

  const onSample = useCallback((sample: RideSample) => {
    recordSample(sample);
    if (sample.powerWatts != null && ftpWatts) {
      const point = { sec: sample.elapsedMs / 1000, pct: (sample.powerWatts / ftpWatts) * 100 };
      setActualPower((current) => [...current, point]);
    }
  }, [ftpWatts, recordSample]);

  const trainer = useTrainerSession(execution, { onSample });

  if (player.loading) {
    return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label={t('player.loading')} /></Box>;
  }
  if (player.loadError || !execution) {
    return <Container sx={{ py: 6 }}><Alert severity="error">{t('player.restoreFailed')}</Alert></Container>;
  }
  if (player.locked) {
    return <Container sx={{ py: 6 }}><Alert severity="warning">{t('player.lockedByOther')}</Alert></Container>;
  }

  if (execution.status === 'COMPLETED' || execution.status === 'ABORTED') {
    const ride = trainer.snapshot.metrics.session;
    return (
      <WorkoutSummary
        execution={execution}
        ride={ride.durationSec > 0 ? ride : null}
        fitDownloadUrl={recording.fitUrl}
        recordingState={recording.state}
        saving={player.saving}
        onSave={async (feedback) => {
          player.setSaving(true);
          try {
            await sendExecutionMutation(execution.id, 'feedback', feedback, 'PUT');
            await clearActiveExecution();
            localStorage.removeItem(`workout-start-key:${execution.scheduledWorkoutId}`);
            navigate(`/training/workouts/${execution.scheduledWorkoutId}`);
          } finally {
            player.setSaving(false);
          }
        }}
      />
    );
  }

  return (
    <TrainerCockpit
      execution={execution}
      api={trainer}
      online={player.online}
      saving={player.saving}
      wakeMode={player.wakeMode}
      actualPower={actualPower}
      recording={recording.enabled}
      recordingLocked={recording.locked}
      onRecordingChange={recording.setEnabled}
      onAction={player.sendAction}
      onAbort={() => {
        if (window.confirm(t('player.confirmAbort'))) player.abort();
      }}
      onBack={() => navigate(`/training/workouts/${execution.scheduledWorkoutId}`)}
    />
  );
}
