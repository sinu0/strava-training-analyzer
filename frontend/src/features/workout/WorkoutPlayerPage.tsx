import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RemoveIcon from '@mui/icons-material/Remove';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import {
  Alert, Box, Button, Chip, CircularProgress, Container, Divider, LinearProgress,
  Slider, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import WorkoutPowerChart from '@/components/training/WorkoutPowerChart';
import MetricReadout from '@/components/v2/MetricReadout';
import PerformanceSurface from '@/components/v2/PerformanceSurface';
import { getAppThemeTokens } from '@/theme/theme';
import type { WorkoutExecution, WorkoutStep } from '@/types/training';

import {
  acquireExecutionLock, clearActiveExecution, loadActiveExecution, saveActiveExecution,
} from './offlineStore';
import { flushWorkoutQueue, getActiveExecution, getExecution, sendExecutionMutation } from './workoutApi';
import { createMonotonicClock, reconcileWorkout, totalWorkoutDurationMs, workoutReducer } from './workoutRunner';


type WakeSentinel = { release: () => Promise<void>; released?: boolean };
type WakeNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeSentinel> } };

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function stepLabel(step: WorkoutStep | undefined, index: number): string {
  if (!step) return 'Koniec treningu';
  return step.name ?? ({
    warmup: 'Rozgrzewka', cooldown: 'Schłodzenie', recovery: 'Odpoczynek',
    freeRide: 'Jazda dowolna', ramp: 'Rampa', steady: 'Równy wysiłek', intervalOn: 'Interwał',
  } as Record<string, string>)[step.type] ?? `Krok ${index + 1}`;
}

function target(step: WorkoutStep | undefined, ftp: number | null, adjustment: number) {
  if (!step || step.powerPctFtpLow == null || step.powerPctFtpHigh == null) return { pct: 'Dowolna', watts: '—' };
  const factor = 1 + adjustment / 100;
  const low = Math.round(step.powerPctFtpLow * factor);
  const high = Math.round(step.powerPctFtpHigh * factor);
  return {
    pct: low === high ? `${low}%` : `${low}–${high}%`,
    watts: ftp == null ? '—' : low === high
      ? `${Math.round(ftp * low / 100)}`
      : `${Math.round(ftp * low / 100)}–${Math.round(ftp * high / 100)}`,
  };
}

function cue() {
  navigator.vibrate?.([120, 80, 120]);
  try {
    const AudioContextClass = window.AudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = 0.05;
    oscillator.frequency.value = 880;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  } catch {
    // Vibration and the visible transition remain available if audio is blocked.
  }
}

export default function WorkoutPlayerPage() {
  const { executionId = '' } = useParams();
  const navigate = useNavigate();
  const monotonicNow = useMemo(() => createMonotonicClock(), []);
  const [execution, setExecution] = useState<WorkoutExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [wakeMode, setWakeMode] = useState<'ACTIVE' | 'FALLBACK' | 'OFF'>('OFF');
  const [rpe, setRpe] = useState<number | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);
  const [notes, setNotes] = useState('');
  const persistedBucket = useRef(-1);
  const warnedStep = useRef(-1);
  const finalized = useRef(false);
  const activeExecutionId = execution?.id;
  const executionStatus = execution?.status;

  useEffect(() => {
    let active = true;
    void (async () => {
      let restored: WorkoutExecution | null = null;
      try {
        const local = await loadActiveExecution();
        if (local?.id === executionId) {
          restored = reconcileWorkout(local, Date.now());
          if (active) setExecution(restored);
        }
      } catch {
        // A server copy can still recover execution when local persistence is unavailable.
      }
      if (navigator.onLine) {
        try {
          const activeServer = await getActiveExecution();
          const server = activeServer?.id === executionId ? activeServer : await getExecution(executionId ?? '');
          if (server?.id === executionId) {
            restored = server;
            if (active) setExecution(restored);
            await saveActiveExecution(server);
          }
        } catch {
          if (active) setOnline(false);
        }
      }
      if (active && restored) {
        setRpe(restored.rpe ?? null);
        setFeeling(restored.feeling ?? null);
        setNotes(restored.notes ?? '');
      }
      if (active && !restored) setLoadError(true);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [executionId]);

  useEffect(() => {
    if (!activeExecutionId) return;
    const release = acquireExecutionLock(activeExecutionId);
    if (!release) {
      setLocked(true);
      return;
    }
    return release;
  }, [activeExecutionId]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setSaving(true);
      void flushWorkoutQueue().finally(() => setSaving(false));
    };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (executionStatus !== 'RUNNING') return;
    const timer = window.setInterval(() => {
      setExecution(current => current ? reconcileWorkout(current, monotonicNow()) : current);
    }, 250);
    return () => window.clearInterval(timer);
  }, [executionStatus, monotonicNow]);

  useEffect(() => {
    if (!execution) return;
    const bucket = Math.floor(execution.workoutElapsedMs / 10_000);
    if (bucket !== persistedBucket.current || execution.status !== 'RUNNING') {
      persistedBucket.current = bucket;
      void saveActiveExecution(execution);
    }
  }, [execution]);

  useEffect(() => {
    if (!execution || execution.status !== 'RUNNING') return;
    const step = execution.stepsSnapshot[execution.currentStepIndex];
    if (!step?.durationSec) return;
    const remaining = step.durationSec * 1000 - execution.stepElapsedMs;
    if (remaining <= 3_000 && remaining > 0 && warnedStep.current !== execution.currentStepIndex) {
      warnedStep.current = execution.currentStepIndex;
      cue();
    }
  }, [execution]);

  useEffect(() => {
    if (!execution || (execution.status !== 'COMPLETED' && execution.status !== 'ABORTED') || finalized.current) return;
    finalized.current = true;
    const key = localStorage.getItem(`workout-finish-key:${execution.id}`)
      ?? (globalThis.crypto?.randomUUID?.() ?? `finish-${Date.now()}`);
    localStorage.setItem(`workout-finish-key:${execution.id}`, key);
    setSaving(true);
    void sendExecutionMutation(execution.id, execution.status === 'ABORTED' ? 'abort' : 'complete', {
      idempotencyKey: key, occurredAt: execution.finishedAt ?? new Date().toISOString(),
    }).then(server => server && setExecution(server)).finally(() => setSaving(false));
  }, [execution]);

  useEffect(() => {
    let sentinel: WakeSentinel | null = null;
    const request = async () => {
      if (execution?.status !== 'RUNNING') return;
      try {
        const wakeLock = (navigator as WakeNavigator).wakeLock;
        if (!wakeLock) {
          setWakeMode('FALLBACK');
          return;
        }
        sentinel = await wakeLock.request('screen');
        setWakeMode('ACTIVE');
      } catch {
        setWakeMode('FALLBACK');
      }
    };
    const visibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) void request();
    };
    void request();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      void sentinel?.release();
      setWakeMode('OFF');
    };
  }, [execution?.status]);

  const sendAction = useCallback((type: 'PAUSE' | 'RESUME' | 'SKIP_STEP' | 'PREVIOUS_STEP' | 'INTENSITY', delta?: number) => {
    if (!execution) return;
    const nowMs = monotonicNow();
    const localType = type === 'SKIP_STEP' ? 'SKIP' : type === 'PREVIOUS_STEP' ? 'PREVIOUS' : type;
    const local = workoutReducer(execution, localType === 'INTENSITY'
      ? { type: 'INTENSITY', nowMs, deltaPct: delta ?? 0 }
      : { type: localType, nowMs } as Parameters<typeof workoutReducer>[1]);
    setExecution(local);
    const key = globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${type}`;
    setSaving(true);
    void sendExecutionMutation(execution.id, 'events', {
      type, idempotencyKey: key, occurredAt: new Date(nowMs).toISOString(),
      ...(delta != null ? { intensityDeltaPct: delta } : {}),
    }).then(server => server && setExecution(server)).finally(() => setSaving(false));
  }, [execution, monotonicNow]);

  if (loading) return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label="Wczytywanie treningu" /></Box>;
  if (loadError || !execution) {
    return <Container sx={{ py: 6 }}><Alert severity="error">Nie udało się odtworzyć aktywnego treningu z serwera ani pamięci urządzenia.</Alert></Container>;
  }
  if (locked) {
    return <Container sx={{ py: 6 }}><Alert severity="warning">Ten trening jest już otwarty w innej karcie lub oknie. Zamknij drugi odtwarzacz i odśwież stronę.</Alert></Container>;
  }

  const step = execution.stepsSnapshot[execution.currentStepIndex];
  const nextStep = execution.stepsSnapshot[execution.currentStepIndex + 1];
  const goal = target(step, execution.ftpWatts, execution.intensityAdjustmentPct);
  const totalMs = totalWorkoutDurationMs(execution.stepsSnapshot);
  const stepDuration = step?.durationSec == null ? null : step.durationSec * 1000;
  const progress = totalMs > 0 ? Math.min(100, execution.workoutElapsedMs / totalMs * 100) : 0;
  const done = execution.status === 'COMPLETED' || execution.status === 'ABORTED';

  if (done) {
    const saveFeedback = async () => {
      setSaving(true);
      setFeedbackError(false);
      try {
        await sendExecutionMutation(execution.id, 'feedback', { rpe, feeling, notes }, 'PUT');
        await clearActiveExecution();
        localStorage.removeItem(`workout-start-key:${execution.scheduledWorkoutId}`);
        navigate(`/training/workouts/${execution.scheduledWorkoutId}`);
      } catch {
        setFeedbackError(true);
      } finally {
        setSaving(false);
      }
    };
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 6 } }}>
        <PerformanceSurface accent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="overline" color="text.secondary">{execution.status === 'COMPLETED' ? 'Trening ukończony' : 'Trening przerwany'}</Typography>
          <Typography variant="h3" sx={{ mt: 0.5 }}>{execution.workoutNameSnapshot}</Typography>
          <Stack direction="row" spacing={3} sx={{ my: 3 }}>
            <MetricReadout label="Zrealizowany czas" value={formatTime(execution.workoutElapsedMs)} />
            <MetricReadout label="Pominięte kroki" value={execution.skippedStepIndexes.length} />
            <MetricReadout label="Zgodność" value={execution.complianceScore ?? '—'} unit={execution.complianceScore != null ? '%' : undefined} hint={execution.complianceStatus} />
          </Stack>
          <Alert severity="info" sx={{ mb: 3 }}>Dokładna ocena zostanie uzupełniona po synchronizacji aktywności i strumieni ze Stravy.</Alert>
          <Typography id="rpe-label" gutterBottom>{rpe == null ? 'RPE: nie podano' : `RPE: ${rpe}/10`}</Typography>
          <Slider value={rpe ?? 5} min={1} max={10} marks onChange={(_, value) => setRpe(value as number)} aria-labelledby="rpe-label" sx={{ minHeight: 44 }} />
          <ToggleButtonGroup exclusive value={feeling} onChange={(_, value) => value && setFeeling(value)} fullWidth sx={{ my: 2 }}>
            <ToggleButton value="BAD">Słabo</ToggleButton>
            <ToggleButton value="OK">OK</ToggleButton>
            <ToggleButton value="GOOD">Dobrze</ToggleButton>
          </ToggleButtonGroup>
          <TextField label="Notatka" multiline minRows={3} fullWidth value={notes} onChange={event => setNotes(event.target.value)} />
          {!!feedbackError && <Alert severity="error" sx={{ mt: 2 }}>Nie udało się zapisać podsumowania. Twoje odczucia pozostały w formularzu; spróbuj ponownie.</Alert>}
          <Button variant="contained" fullWidth disabled={saving} onClick={() => void saveFeedback()} sx={{ mt: 2, minHeight: 48 }}>Zapisz podsumowanie</Button>
        </PerformanceSurface>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', py: { xs: 1, sm: 2 } }}>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/training/workouts/${execution.scheduledWorkoutId}`)}>Trening</Button>
          <Stack direction="row" spacing={1}>
            {!online && <Chip icon={<WifiOffIcon />} label="Offline — zmiany w kolejce" color="warning" />}
            {!!saving && <Chip label="Zapisywanie…" variant="outlined" />}
            <Chip label={wakeMode === 'ACTIVE' ? 'Ekran aktywny' : wakeMode === 'FALLBACK' ? 'Wake Lock niedostępny — ustaw blokadę ekranu ręcznie' : 'Wake Lock wyłączony'} variant="outlined" />
          </Stack>
        </Stack>
        <PerformanceSurface accent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="overline" color="text.secondary">{execution.workoutNameSnapshot}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h2" component="h1" aria-live="polite">{stepLabel(step, execution.currentStepIndex)}</Typography>
              <Typography variant="h1" sx={{ fontVariantNumeric: 'tabular-nums', mt: 1 }}>
                {stepDuration == null ? formatTime(execution.stepElapsedMs) : formatTime(stepDuration - execution.stepElapsedMs)}
              </Typography>
              <Typography color="text.secondary">całość {formatTime(execution.workoutElapsedMs)} · krok {execution.currentStepIndex + 1}/{execution.stepsSnapshot.length}</Typography>
            </Box>
            <Stack direction="row" spacing={{ xs: 3, sm: 5 }} alignItems="center">
              <MetricReadout label="Cel mocy" value={goal.watts} unit={goal.watts !== '—' ? 'W' : undefined} tone="primary" hint={goal.pct} />
              <MetricReadout label="Tętno" value={step?.heartRateBpmLow == null ? '—' : `${step.heartRateBpmLow}–${step.heartRateBpmHigh ?? step.heartRateBpmLow}`} unit={step?.heartRateBpmLow == null ? undefined : 'bpm'} />
              <MetricReadout label="Kadencja" value={step?.cadenceRpmLow == null ? '—' : `${step.cadenceRpmLow}–${step.cadenceRpmHigh ?? step.cadenceRpmLow}`} unit={step?.cadenceRpmLow == null ? undefined : 'rpm'} />
            </Stack>
          </Stack>
          <LinearProgress variant="determinate" value={progress} aria-label="Postęp całego treningu" sx={{ height: 10, borderRadius: 8, mt: 3 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Następny: {stepLabel(nextStep, execution.currentStepIndex + 1)}</Typography>
          {!!step?.instructions && <Alert severity="info" sx={{ mt: 2 }}>{step.instructions}</Alert>}
        </PerformanceSurface>

        <Box sx={{ mt: 2 }}><WorkoutPowerChart steps={execution.stepsSnapshot} /></Box>

        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ mt: 2, '& .MuiButton-root': { minHeight: 48, minWidth: 96 } }}>
          <Button variant="contained" startIcon={execution.status === 'PAUSED' ? <PlayArrowIcon /> : <PauseIcon />} onClick={() => sendAction(execution.status === 'PAUSED' ? 'RESUME' : 'PAUSE')}>
            {execution.status === 'PAUSED' ? 'Wznów' : 'Pauza'}
          </Button>
          <Button startIcon={<ReplayIcon />} onClick={() => sendAction('PREVIOUS_STEP')}>Powtórz</Button>
          <Button endIcon={<SkipNextIcon />} onClick={() => sendAction('SKIP_STEP')}>{stepDuration == null ? 'LAP / dalej' : 'Pomiń'}</Button>
          <Divider orientation="vertical" flexItem />
          <Button startIcon={<RemoveIcon />} onClick={() => sendAction('INTENSITY', -5)}>-5%</Button>
          <Chip label={`${execution.intensityAdjustmentPct >= 0 ? '+' : ''}${execution.intensityAdjustmentPct}%`} sx={{ height: 48, px: 1 }} />
          <Button startIcon={<AddIcon />} onClick={() => sendAction('INTENSITY', 5)}>+5%</Button>
        </Stack>
        <Button
          color="error" variant="outlined" startIcon={<CloseIcon />}
          onClick={() => {
            if (window.confirm('Przerwać trening? Tego wykonania nie będzie można wznowić.')) {
              setExecution(workoutReducer(execution, { type: 'ABORT', nowMs: monotonicNow() }));
            }
          }}
          sx={{ minHeight: 48, mt: 3, mb: 2, width: '100%', borderRadius: theme => `${getAppThemeTokens(theme).radius.control}px` }}
        >
          Awaryjnie zakończ trening
        </Button>
      </Container>
    </Box>
  );
}
