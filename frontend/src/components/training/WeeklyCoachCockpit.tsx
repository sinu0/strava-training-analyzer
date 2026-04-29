import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';

import BlockHealthPanel from '@/components/training/BlockHealthPanel';
import CoachSummaryPanel from '@/components/training/CoachSummaryPanel';
import ProgressionLevelsPanel from '@/components/training/ProgressionLevelsPanel';
import { useAiPredict, useLatestAiPrediction } from '@/hooks/useAi';
import { useBlockHealth, useDurability, useProgressionLevels, useReadiness } from '@/hooks/useAnalytics';

import { useCalendarView, usePrograms } from '../../hooks/useTrainingPlan';

import type { CalendarDay, TrainingPlanProgram, TrainingSessionRole, TrainingWeekObjective } from '../../types/training';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  return result;
}

function endOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + 6);
  return result;
}

function findCurrentProgram(programs: TrainingPlanProgram[] | undefined, today: string) {
  return programs?.find((program) => program.startDate <= today && program.endDate >= today) ?? programs?.[0] ?? null;
}

function findCurrentObjective(program: TrainingPlanProgram | null, today: string): TrainingWeekObjective | null {
  if (!program?.weeklyObjectives?.length) {
    return null;
  }

  return program.weeklyObjectives.find((objective) => objective.weekStart <= today && objective.weekEnd >= today)
    ?? program.weeklyObjectives[program.weeklyObjectives.length - 1]
    ?? null;
}

function buildRiskSignals(days: CalendarDay[], readinessScore?: number, durabilityScore?: number) {
  const signals: string[] = [];

  if ((readinessScore ?? 100) < 45) {
    signals.push('Readiness jest nisko — dziś broń jakości bodźca i nie dokładuj przypadkowej intensywności.');
  }
  if ((durabilityScore ?? 100) < 60) {
    signals.push('Durability jest słabsze — dopilnuj fueling na dłuższej jeździe i nie dokręcaj końcówki na siłę.');
  }
  if (days.some((day) => day.adjustment)) {
    signals.push('W tygodniu są już dni z sugestią korekty — lepiej przesuwać akcenty niż kumulować zmęczenie.');
  }
  if (days.filter((day) => day.execution?.outcome === 'TOO_HARD').length > 0) {
    signals.push('Ostatnio wpadł trening zbyt ciężki — kolejny akcent powinien być kontrolowany.');
  }

  if (!signals.length) {
    signals.push('Tydzień wygląda stabilnie — trzymaj priorytet głównego bodźca i nie rozmieniaj świeżości na drobne.');
  }

  return signals.slice(0, 3);
}

function formatLongRideDay(day?: string | null) {
  if (day === 'SUNDAY') return 'Niedziela';
  return 'Sobota';
}

function formatEnvironmentPreference(preference?: string | null) {
  if (preference === 'INDOOR_FRIENDLY') return 'Indoor w tygodniu';
  if (preference === 'OUTDOOR_FOCUSED') return 'Outdoor';
  return 'Mieszany';
}

function formatSessionRole(role?: TrainingSessionRole | null) {
  if (role === 'LONG_ENDURANCE') return 'Długi tlen';
  if (role === 'THRESHOLD_QUALITY') return 'Bodziec progowy';
  if (role === 'VO2_QUALITY') return 'Bodziec VO2';
  if (role === 'RECOVERY') return 'Regeneracja';
  return 'Tlen';
}

export default function WeeklyCoachCockpit() {
  const today = new Date();
  const todayStr = formatDate(today);
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(weekStart);
  const from = formatDate(weekStart);
  const to = formatDate(weekEnd);

  const { data: programs } = usePrograms();
  const { data: days = [] } = useCalendarView(from, to);
  const { data: readiness } = useReadiness();
  const { data: durability } = useDurability();
  const { data: progressionLevels } = useProgressionLevels();
  const { data: blockHealth } = useBlockHealth();
  const { data: coachSummary } = useLatestAiPrediction('TRAINING_COACH_SUMMARY');
  const generateAiPrediction = useAiPredict();

  const currentProgram = useMemo(() => findCurrentProgram(programs, todayStr), [programs, todayStr]);
  const currentObjective = useMemo(() => findCurrentObjective(currentProgram, todayStr), [currentProgram, todayStr]);
  const currentScorecard = useMemo(
    () => {
      if (!currentProgram?.goalScorecards?.length) {
        return null;
      }

      return currentProgram.goalScorecards.find((scorecard) => scorecard.weekStart <= todayStr && scorecard.weekEnd >= todayStr)
        ?? currentProgram.goalScorecards[currentProgram.goalScorecards.length - 1]
        ?? null;
    },
    [currentProgram, todayStr],
  );
  const upcomingDays = useMemo(
    () => days.filter((day) => day.date >= todayStr && day.planned).slice(0, 3),
    [days, todayStr],
  );
  const riskSignals = useMemo(
    () => buildRiskSignals(days, readiness?.score, durability?.avgDurabilityScore),
    [days, durability?.avgDurabilityScore, readiness?.score],
  );

  return (
    <Card>
      <CardHeader title={<Typography variant="h6">Weekly coach cockpit</Typography>} />
      <CardContent>
        {!currentProgram ? (
          <Alert severity="info">Wygeneruj program, żeby zobaczyć tygodniowy priorytet, ryzyka i najbliższe kluczowe sesje.</Alert>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {!!currentObjective && <Chip label={currentObjective.label} color="primary" />}
              {!!readiness && <Chip label={`Dziś: ${readiness.dayLabel} (${readiness.score}/100)`} color={readiness.score >= 65 ? 'success' : 'warning'} />}
              {!!durability && <Chip label={`Durability: ${durability.label}`} color={durability.avgDurabilityScore >= 65 ? 'success' : 'warning'} />}
              {!!currentScorecard && (
                <Chip
                  label={currentScorecard.onTrack ? 'Tydzień na torze' : 'Tydzień wymaga korekty'}
                  color={currentScorecard.onTrack ? 'success' : 'warning'}
                />
              )}
              {!!currentScorecard?.plannedGoalSessions && (
                <Chip
                  label={`${currentScorecard.completedGoalSessions ?? 0}/${currentScorecard.plannedGoalSessions} bodźców celu`}
                  color={currentScorecard.goalExecutionStatus === 'MISSED' ? 'warning' : 'success'}
                />
              )}
            </Stack>

            {!!currentObjective && (
              <>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Priorytet tygodnia</Typography>
                  <Typography variant="body2">{currentObjective.focus}</Typography>
                  <Typography variant="body2" color="text.secondary">{currentObjective.fuelingGuidance}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip label={`Max ${currentObjective.maxQualityDays} akcenty`} size="small" variant="outlined" />
                  {!!currentScorecard?.goalFocusLabel && (
                    <Chip label={`Cel: ${currentScorecard.goalFocusLabel}`} size="small" variant="outlined" />
                  )}
                  {!!currentScorecard?.goalFocusRole && (
                    <Chip label={formatSessionRole(currentScorecard.goalFocusRole)} size="small" variant="outlined" />
                  )}
                  {currentObjective.keySessionTypes.map((type) => (
                    <Chip key={type} label={type} size="small" variant="outlined" />
                  ))}
                </Stack>
              </>
            )}

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Progresja systemów</Typography>
              <ProgressionLevelsPanel levels={progressionLevels} />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Stan bloku</Typography>
              <BlockHealthPanel blockHealth={blockHealth} />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Najbliższe sesje</Typography>
              {upcomingDays.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Brak zaplanowanych sesji w tym tygodniu.</Typography>
                ) : upcomingDays.map((day) => (
                  <Stack key={day.date} direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Chip label={day.date} size="small" variant="outlined" />
                    <Chip label={day.planned?.plannedType ?? 'Sesja'} size="small" />
                    {day.planned?.sessionRole ? <Chip label={formatSessionRole(day.planned.sessionRole)} size="small" variant="outlined" /> : null}
                    {day.planned?.plannedTss != null && <Chip label={`${day.planned.plannedTss} TSS`} size="small" variant="outlined" />}
                    {day.adjustment ? <Chip label={day.adjustment.title} size="small" color="warning" /> : null}
                  </Stack>
                ))}
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Ryzyka i wskazówki</Typography>
              {riskSignals.map((signal) => (
                <Alert key={signal} severity="info">{signal}</Alert>
              ))}
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Coach AI</Typography>
              <CoachSummaryPanel
                prediction={coachSummary}
                isGenerating={generateAiPrediction.isPending}
                onGenerate={() => generateAiPrediction.mutate({ predictionType: 'TRAINING_COACH_SUMMARY' })}
              />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Ograniczenia planu</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`${currentProgram.weekdayAvailabilityMinutes ?? 75} min w dzień roboczy`} size="small" variant="outlined" />
                <Chip label={`${currentProgram.weekendAvailabilityMinutes ?? 180} min w weekend`} size="small" variant="outlined" />
                <Chip label={`Długi trening: ${formatLongRideDay(currentProgram.preferredLongRideDay)}`} size="small" variant="outlined" />
                <Chip label={formatEnvironmentPreference(currentProgram.environmentPreference)} size="small" variant="outlined" />
              </Stack>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
