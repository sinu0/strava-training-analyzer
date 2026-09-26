import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import WorkoutPowerChart, { type ActualPowerPoint } from '@/components/training/WorkoutPowerChart';
import type { WorkoutExecution } from '@/types/training';
import { StatusPill, Widget } from '@/ui';

import ControlDock from './ControlDock';
import ControlModeSwitch from './ControlModeSwitch';
import CuePill, { useSustainedCue } from './CuePill';
import { computeCue } from './cues';
import DeviceBar from './DeviceBar';
import DeviceSheet from './DeviceSheet';
import IntervalList from './IntervalList';
import LiveMetricCluster from './LiveMetricCluster';
import { cockpitMessages } from './messages';
import SessionStats from './SessionStats';
import StepCard from './StepCard';
import { totalWorkoutDurationMs } from '../workoutRunner';

import type { TrainerSessionApi } from '../devices/useTrainerSession';
import type { WakeMode, WorkoutAction } from '../useWorkoutExecution';

interface TrainerCockpitProps {
  execution: WorkoutExecution;
  api: TrainerSessionApi;
  online: boolean;
  saving: boolean;
  wakeMode: WakeMode;
  actualPower: ActualPowerPoint[];
  recording: boolean;
  recordingLocked: boolean;
  onRecordingChange(value: boolean): void;
  onAction(type: WorkoutAction, delta?: number): void;
  onAbort(): void;
  onBack(): void;
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/** Trainer HUD: live numbers, current step, plan, profile and controls — layout inspired by TrainingPeaks Virtual. */
export default function TrainerCockpit({
  execution, api, online, saving, wakeMode, actualPower, recording, recordingLocked, onRecordingChange, onAction, onAbort, onBack,
}: TrainerCockpitProps) {
  const t = cockpitMessages.useT();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { snapshot } = api;
  const step = execution.stepsSnapshot[execution.currentStepIndex];
  const paused = execution.status === 'PAUSED';
  const lapStep = step?.durationSec == null || step.durationType === 'LAP_BUTTON' || step.durationType === 'OPEN';
  const trainer = snapshot.devices.trainer;
  const ergActive = snapshot.mode === 'erg' && trainer?.state === 'CONNECTED' && trainer.capabilities.erg && snapshot.target != null;
  const nowMs = Date.now();
  const cue = useSustainedCue(computeCue({
    ergActive, compliance: snapshot.compliance, target: snapshot.target,
    powerWatts: snapshot.live.powerWatts, cadenceRpm: snapshot.live.cadenceRpm, step,
  }), nowMs);
  const totalMs = useMemo(() => totalWorkoutDurationMs(execution.stepsSnapshot), [execution.stepsSnapshot]);
  const noDevices = !snapshot.devices.trainer && !snapshot.devices.heartRate;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || sheetOpen) return;
      if (event.key === ' ') { event.preventDefault(); onAction(paused ? 'RESUME' : 'PAUSE'); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); onAction('INTENSITY', 1); }
      else if (event.key === 'ArrowDown') { event.preventDefault(); onAction('INTENSITY', -1); }
      else if (event.key === 'ArrowRight') onAction('SKIP_STEP');
      else if (event.key === 'ArrowLeft') onAction('PREVIOUS_STEP');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAction, paused, sheetOpen]);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ flexShrink: 0 }}>{t('trainerCockpit.workoutButton')}</Button>
          <Typography variant="overline" noWrap sx={{ color: 'text.secondary' }}>{execution.workoutNameSnapshot}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <DeviceBar devices={snapshot.devices} recording={recording} onOpen={() => setSheetOpen(true)} />
          {!online ? <StatusPill size="sm" tone="warning" icon={<WifiOffIcon />} label={t('trainerCockpit.offline')} /> : null}
          {saving ? <StatusPill size="sm" label={t('trainerCockpit.saving')} /> : null}
          <StatusPill
            size="sm"
            variant="outline"
            tone={wakeMode === 'ACTIVE' ? 'success' : 'neutral'}
            label={wakeMode === 'ACTIVE' ? t('trainerCockpit.wakeActive') : wakeMode === 'FALLBACK' ? t('trainerCockpit.wakeFallback') : t('trainerCockpit.wakeOff')}
            title={wakeMode === 'FALLBACK' ? t('trainerCockpit.wakeFallbackHint') : undefined}
          />
        </Stack>
      </Stack>

      {noDevices ? (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={() => setSheetOpen(true)}>{t('trainerCockpit.connect')}</Button>}
        >
          {t('trainerCockpit.noDevices')}
        </Alert>
      ) : null}
      {snapshot.controlError ? <Alert severity="warning" sx={{ mb: 2 }}>{snapshot.controlError}</Alert> : null}

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 2.5 },
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 3fr) minmax(0, 6fr) minmax(0, 3fr)' },
          gridTemplateAreas: {
            xs: '"center" "chart" "control" "side"',
            md: '"side center control" "chart chart chart"',
          },
          alignItems: 'start',
          flex: 1,
        }}
      >
        <Stack spacing={2} sx={{ gridArea: 'center', minWidth: 0 }}>
          <LiveMetricCluster live={snapshot.live} step={snapshot.metrics.step} session={snapshot.metrics.session} target={snapshot.target} compliance={snapshot.compliance} />
          <CuePill cue={cue} />
          <StepCard execution={execution} stepMetrics={snapshot.metrics.step} />
        </Stack>
        <Stack spacing={2} sx={{ gridArea: 'side', minWidth: 0 }}>
          <SessionStats elapsedMs={execution.workoutElapsedMs} totalMs={totalMs} session={snapshot.metrics.session} />
          <IntervalList execution={execution} />
        </Stack>
        <Box sx={{ gridArea: 'control', minWidth: 0 }}>
          <ControlModeSwitch
            mode={snapshot.mode}
            resistancePct={snapshot.resistancePct}
            trainer={trainer}
            targetWatts={snapshot.target?.watts ?? null}
            onMode={api.setMode}
            onResistance={api.setResistance}
          />
        </Box>
        <Box sx={{ gridArea: 'chart', minWidth: 0 }}>
          <Widget title={t('trainerCockpit.trainingProfile')} icon={<ShowChartIcon />} action={<StatusPill size="sm" label={`${Math.round((execution.workoutElapsedMs / Math.max(totalMs, 1)) * 100)}%`} />}>
            <WorkoutPowerChart steps={execution.stepsSnapshot} actual={actualPower} playheadSec={execution.workoutElapsedMs / 1000} height={200} />
          </Widget>
        </Box>
      </Box>

      <ControlDock
        paused={paused}
        lapStep={lapStep}
        intensityPct={execution.intensityAdjustmentPct}
        onTogglePause={() => onAction(paused ? 'RESUME' : 'PAUSE')}
        onPrevious={() => onAction('PREVIOUS_STEP')}
        onSkip={() => onAction('SKIP_STEP')}
        onIntensity={(delta) => onAction('INTENSITY', delta)}
        onAbort={onAbort}
      />

      <DeviceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        api={api}
        recording={recording}
        recordingLocked={recordingLocked}
        onRecordingChange={onRecordingChange}
      />
    </Box>
  );
}
