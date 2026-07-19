import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  useTheme,
  Alert,
} from '@mui/material';
import { useState } from 'react';

import { useAdaptiveTraining } from '@/hooks/useAdaptiveTraining';
import type {
  AdaptiveTrainingRequest,
  AdaptiveTrainingResponse,
  PlannedWorkoutInput,
  RecentWorkoutInput,
  FatigueSignalsInput,
  ProgressionStateInput,
  TrainingLoadStateInput,
  WorkoutAdjustment,
} from '@/types/adaptiveTraining';

const TRAINING_TYPES = ['VO2_MAX', 'THRESHOLD', 'ENDURANCE', 'RECOVERY', 'ANAEROBIC'] as const;
const OUTCOMES = ['SUCCESS', 'PARTIAL', 'FAIL', 'OVERACHIEVE'] as const;
const ACTION_LABELS: Record<string, string> = {
  KEEP: 'Zachowaj',
  MODIFY: 'Modyfikuj',
  REPLACE: 'Zastap',
  REMOVE: 'Usun',
};
const ACTION_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  KEEP: 'success',
  MODIFY: 'warning',
  REPLACE: 'error',
  REMOVE: 'error',
};
const INTENSITY_LABELS: Record<string, string> = {
  UP: '↑ Inensywnosc',
  DOWN: '↓ Intensywnosc',
  SAME: '= Intensywnosc',
};
const VOLUME_LABELS: Record<string, string> = {
  UP: '↑ Objetosc',
  DOWN: '↓ Objetosc',
  SAME: '= Objetosc',
};
const FATIGUE_LABELS: Record<string, string> = {
  LOW: 'Niskie zmeczenie',
  MODERATE: 'Umiarkowane',
  HIGH: 'Wysokie zmeczenie',
};
const PERF_LABELS: Record<string, string> = {
  SUCCESS: 'Sukces',
  MIXED: 'Mieszany',
  FAIL: 'Spadkowy',
};
const PROGRESSION_LABELS: Record<string, string> = {
  PROGRESS: 'Progresja',
  MAINTAIN: 'Utrzymanie',
  REGRESS: 'Regresja',
};

type PlannedWorkoutRow = PlannedWorkoutInput & { rowId: string };
type RecentWorkoutRow = RecentWorkoutInput & { rowId: string };

export default function AdaptiveTrainingPanel() {
  const theme = useTheme();
  const { mutate, isPending, isError, error } = useAdaptiveTraining();
  const [result, setResult] = useState<AdaptiveTrainingResponse | null>(null);

  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkoutRow[]>([
    { rowId: 'planned-monday', type: 'ENDURANCE', duration: 120, targetPower: 180, intervals: 0 },
    { rowId: 'planned-tuesday', type: 'THRESHOLD', duration: 75, targetPower: 250, intervals: 3 },
    { rowId: 'planned-wednesday', type: 'RECOVERY', duration: 45, targetPower: 130, intervals: 0 },
    { rowId: 'planned-thursday', type: 'ENDURANCE', duration: 90, targetPower: 185, intervals: 0 },
    { rowId: 'planned-friday', type: 'VO2_MAX', duration: 60, targetPower: 270, intervals: 5 },
    { rowId: 'planned-saturday', type: 'ENDURANCE', duration: 150, targetPower: 175, intervals: 0 },
    { rowId: 'planned-sunday', type: 'RECOVERY', duration: 45, targetPower: 120, intervals: 0 },
  ]);

  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkoutRow[]>([
    { rowId: 'recent-1', outcome: 'SUCCESS', score: 85, workoutType: 'THRESHOLD', fatigueDrift: 'LOW', hrResponse: 'OK' },
    { rowId: 'recent-2', outcome: 'OVERACHIEVE', score: 95, workoutType: 'VO2_MAX', fatigueDrift: 'MODERATE', hrResponse: 'HIGH' },
    { rowId: 'recent-3', outcome: 'PARTIAL', score: 55, workoutType: 'ENDURANCE', fatigueDrift: 'HIGH', hrResponse: 'HIGH' },
    { rowId: 'recent-4', outcome: 'SUCCESS', score: 80, workoutType: 'THRESHOLD', fatigueDrift: 'LOW', hrResponse: 'OK' },
    { rowId: 'recent-5', outcome: 'FAIL', score: 35, workoutType: 'VO2_MAX', fatigueDrift: 'HIGH', hrResponse: 'HIGH' },
  ]);

  const [loadState, setLoadState] = useState<TrainingLoadStateInput>({
    ctl: 72.5, atl: 95.8, tsb: -23.3,
  });

  const [signals, setSignals] = useState<FatigueSignalsInput>({
    hrvTrend: 'DOWN', restingHrTrend: 'UP', sleepQuality: 'POOR', subjectiveReadiness: 35,
  });

  const [progression, setProgression] = useState<ProgressionStateInput>({
    vo2Level: 4, thresholdLevel: 5, enduranceLevel: 6, recentIntensityDistribution: 'balanced',
  });

  const handleRun = () => {
    const request: AdaptiveTrainingRequest = {
      plannedWorkouts: plannedWorkouts.map(({ type, targetPower, duration, intervals }) => ({
        type,
        targetPower,
        duration,
        intervals,
      })),
      recentWorkouts: recentWorkouts.map(({ outcome, score, workoutType, fatigueDrift, hrResponse }) => ({
        outcome,
        score,
        workoutType,
        fatigueDrift,
        hrResponse,
      })),
      trainingLoad: loadState,
      fatigueSignals: signals,
      progressionState: progression,
    };
    mutate(request, {
      onSuccess: (res) => setResult(res),
    });
  };

  const updatePlanned = (index: number, field: keyof PlannedWorkoutInput, value: string | number) => {
    setPlannedWorkouts((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    );
  };

  const updateRecent = (index: number, field: keyof RecentWorkoutInput, value: string | number) => {
    setRecentWorkouts((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card>
        <CardHeader title="Plan treningowy (nastepne 7 dni)" titleTypographyProps={{ variant: 'subtitle2' }} />
        <CardContent>
          {plannedWorkouts.map((w, i) => (
            <Box key={w.rowId} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <TextField
                select
                size="small"
                value={w.type}
                onChange={(e) => updatePlanned(i, 'type', e.target.value)}
                slotProps={{ select: { native: true } }}
                sx={{ width: 140 }}
              >
                {TRAINING_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </TextField>
              <TextField
                size="small"
                type="number"
                label="Moc (W)"
                value={w.targetPower}
                onChange={(e) => updatePlanned(i, 'targetPower', Number(e.target.value))}
                sx={{ width: 100 }}
              />
              <TextField
                size="small"
                type="number"
                label="Czas (min)"
                value={w.duration}
                onChange={(e) => updatePlanned(i, 'duration', Number(e.target.value))}
                sx={{ width: 100 }}
              />
              <TextField
                size="small"
                type="number"
                label="Interwały"
                value={w.intervals}
                onChange={(e) => updatePlanned(i, 'intervals', Number(e.target.value))}
                sx={{ width: 100 }}
              />
              <IconButton
                size="small"
                onClick={() => setPlannedWorkouts((prev) => prev.filter((_, j) => j !== i))}
                disabled={plannedWorkouts.length <= 1}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() =>
              setPlannedWorkouts((prev) => [
                ...prev,
                { rowId: crypto.randomUUID(), type: 'ENDURANCE', duration: 60, targetPower: 180, intervals: 0 },
              ])
            }
          >
            Dodaj trening
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Ostatnie sesje (5 treningow)" titleTypographyProps={{ variant: 'subtitle2' }} />
        <CardContent>
          {recentWorkouts.map((w, i) => (
            <Box key={w.rowId} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
              <TextField
                select
                size="small"
                value={w.outcome}
                onChange={(e) => updateRecent(i, 'outcome', e.target.value)}
                slotProps={{ select: { native: true } }}
                sx={{ width: 140 }}
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={w.workoutType}
                onChange={(e) => updateRecent(i, 'workoutType', e.target.value)}
                slotProps={{ select: { native: true } }}
                sx={{ width: 140 }}
              >
                {TRAINING_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </TextField>
              <TextField
                size="small"
                type="number"
                label="Score"
                value={w.score}
                onChange={(e) => updateRecent(i, 'score', Number(e.target.value))}
                sx={{ width: 80 }}
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Stan obciazenia (CTL/ATL/TSB)" titleTypographyProps={{ variant: 'subtitle2' }} />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              type="number"
              label="CTL"
              value={loadState.ctl}
              onChange={(e) => setLoadState((p) => ({ ...p, ctl: Number(e.target.value) }))}
              sx={{ width: 110 }}
            />
            <TextField
              size="small"
              type="number"
              label="ATL"
              value={loadState.atl}
              onChange={(e) => setLoadState((p) => ({ ...p, atl: Number(e.target.value) }))}
              sx={{ width: 110 }}
            />
            <TextField
              size="small"
              type="number"
              label="TSB"
              value={loadState.tsb}
              onChange={(e) => setLoadState((p) => ({ ...p, tsb: Number(e.target.value) }))}
              sx={{ width: 110 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Sygnaly regeneracji" titleTypographyProps={{ variant: 'subtitle2' }} />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="HRV trend"
              value={signals.hrvTrend}
              onChange={(e) => setSignals((p) => ({ ...p, hrvTrend: e.target.value as FatigueSignalsInput['hrvTrend'] }))}
              slotProps={{ select: { native: true } }}
              sx={{ width: 140 }}
            >
              <option value="UP">UP</option>
              <option value="STABLE">STABLE</option>
              <option value="DOWN">DOWN</option>
            </TextField>
            <TextField
              select
              size="small"
              label="Resting HR trend"
              value={signals.restingHrTrend}
              onChange={(e) => setSignals((p) => ({ ...p, restingHrTrend: e.target.value as FatigueSignalsInput['restingHrTrend'] }))}
              slotProps={{ select: { native: true } }}
              sx={{ width: 160 }}
            >
              <option value="UP">UP</option>
              <option value="STABLE">STABLE</option>
              <option value="DOWN">DOWN</option>
            </TextField>
            <TextField
              select
              size="small"
              label="Sen"
              value={signals.sleepQuality}
              onChange={(e) => setSignals((p) => ({ ...p, sleepQuality: e.target.value as FatigueSignalsInput['sleepQuality'] }))}
              slotProps={{ select: { native: true } }}
              sx={{ width: 140 }}
            >
              <option value="GOOD">GOOD</option>
              <option value="AVERAGE">AVERAGE</option>
              <option value="POOR">POOR</option>
            </TextField>
            <TextField
              size="small"
              type="number"
              label="Gotowosc (0-100)"
              value={signals.subjectiveReadiness}
              onChange={(e) => setSignals((p) => ({ ...p, subjectiveReadiness: Number(e.target.value) }))}
              sx={{ width: 150 }}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Poziomy progresji" titleTypographyProps={{ variant: 'subtitle2' }} />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              type="number"
              label="VO2"
              value={progression.vo2Level}
              onChange={(e) => setProgression((p) => ({ ...p, vo2Level: Number(e.target.value) }))}
              sx={{ width: 90 }}
            />
            <TextField
              size="small"
              type="number"
              label="Threshold"
              value={progression.thresholdLevel}
              onChange={(e) => setProgression((p) => ({ ...p, thresholdLevel: Number(e.target.value) }))}
              sx={{ width: 110 }}
            />
            <TextField
              size="small"
              type="number"
              label="Endurance"
              value={progression.enduranceLevel}
              onChange={(e) => setProgression((p) => ({ ...p, enduranceLevel: Number(e.target.value) }))}
              sx={{ width: 110 }}
            />
          </Box>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        size="large"
        startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
        onClick={handleRun}
        disabled={isPending}
      >
        Uruchom adaptacje
      </Button>

      {!!isError && (
        <Alert severity="error">
          {(error as Error)?.message || 'Blad podczas adaptacji planu.'}
        </Alert>
      )}

      {!!result && <AdaptationResult result={result} tokens={theme.tokens} />}
    </Box>
  );
}

function AdaptationResult({
  result,
  tokens,
}: {
  result: AdaptiveTrainingResponse;
  tokens: typeof import('@/theme/theme').tokens;
}) {
  const { adjustments, strategy, warnings, insight } = result;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Strategy summary */}
      <Card
        sx={{
          borderLeft: `4px solid ${tokens.status.accent}`,
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Strategia adaptacji
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            <Chip
              label={`Zmeczenie: ${FATIGUE_LABELS[strategy.fatigueState] ?? strategy.fatigueState}`}
              color={
                strategy.fatigueState === 'HIGH'
                  ? 'error'
                  : strategy.fatigueState === 'LOW'
                    ? 'success'
                    : 'warning'
              }
              size="small"
            />
            <Chip
              label={`Wykonanie: ${PERF_LABELS[strategy.performanceTrend] ?? strategy.performanceTrend}`}
              color={
                strategy.performanceTrend === 'SUCCESS'
                  ? 'success'
                  : strategy.performanceTrend === 'FAIL'
                    ? 'error'
                    : 'warning'
              }
              size="small"
            />
            <Chip
              label={PROGRESSION_LABELS[strategy.progressionAction] ?? strategy.progressionAction}
              color={
                strategy.progressionAction === 'PROGRESS'
                  ? 'info'
                  : strategy.progressionAction === 'REGRESS'
                    ? 'error'
                    : 'default'
              }
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {insight}
          </Typography>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
              Ostrzezenia
            </Typography>
            {warnings.map((warning) => (
              <Typography key={warning} variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                • {warning}
              </Typography>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Adjustments per day */}
      <Typography variant="h6">Dostosowania na kazdy dzien</Typography>
      {adjustments.map((adjustment) => (
        <AdjustmentDayCard key={adjustment.day} adjustment={adjustment} tokens={tokens} />
      ))}
    </Box>
  );
}

function AdjustmentDayCard({
  adjustment,
  tokens,
}: {
  adjustment: WorkoutAdjustment;
  tokens: typeof import('@/theme/theme').tokens;
}) {
  const { day, action, reason, newWorkout } = adjustment;

  return (
    <Card variant="outlined">
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {day}
          </Typography>
          <Chip
            label={ACTION_LABELS[action] ?? action}
            color={ACTION_COLORS[action] ?? 'default'}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {reason}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 1.2,
            borderRadius: 1,
            bgcolor: tokens.surfaceSubtle,
            border: `1px solid ${tokens.surfaceBorder}`,
          }}
        >
          <Chip label={newWorkout.type} size="small" sx={{ fontWeight: 600 }} />
          <Typography variant="caption" color="text.secondary">
            {INTENSITY_LABELS[newWorkout.intensityAdjustment] ?? newWorkout.intensityAdjustment}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {VOLUME_LABELS[newWorkout.volumeAdjustment] ?? newWorkout.volumeAdjustment}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
