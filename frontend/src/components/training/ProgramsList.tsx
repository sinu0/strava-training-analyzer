import DeleteIcon from '@mui/icons-material/Delete';
import {
  Card, CardContent, Chip, IconButton, List, ListItem, ListItemText, Stack,
} from '@mui/material';

import EmptyState from '@/components/common/EmptyState';

import { usePrograms, useDeleteProgram } from '../../hooks/useTrainingPlan';
import LoadingState from '../common/LoadingState';

import type { TrainingPlanProgram } from '../../types/training';

interface ProgramsListProps {
  onSelect?: (program: TrainingPlanProgram) => void;
}

function formatLongRideDay(day?: string | null) {
  if (day === 'SUNDAY') return 'Długa jazda: niedziela';
  return 'Długa jazda: sobota';
}

function formatEnvironmentPreference(preference?: string | null) {
  if (preference === 'INDOOR_FRIENDLY') return 'Indoor w tygodniu';
  if (preference === 'OUTDOOR_FOCUSED') return 'Outdoor';
  return 'Mieszany';
}

function formatGoalRole(role?: string | null) {
  if (role === 'LONG_ENDURANCE') return 'Długi tlen';
  if (role === 'THRESHOLD_QUALITY') return 'Bodziec progowy';
  if (role === 'VO2_QUALITY') return 'Bodziec VO2';
  if (role === 'RECOVERY') return 'Regeneracja';
  return 'Tlen';
}

export default function ProgramsList({ onSelect }: ProgramsListProps) {
  const { data: programs, isLoading } = usePrograms();
  const deleteProgram = useDeleteProgram();

  if (isLoading) return <LoadingState message="Ładowanie programów..." />;

  if (!programs?.length) {
    return (
      <EmptyState
        title="Brak wygenerowanych programów"
        description="Wygeneruj program treningowy, aby go tu zobaczyć."
        illustration="/illustrations/empty-training.png"
      />
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <List disablePadding>
          {programs.map((p) => (
            <ListItem
              key={p.id}
              divider
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => onSelect?.(p)}
              secondaryAction={
                <IconButton edge="end" onClick={(e) => { e.stopPropagation(); deleteProgram.mutate(p.id); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              {(() => {
                const firstObjective = p.weeklyObjectives?.[0];
                const firstScorecard = p.goalScorecards?.find((scorecard) => scorecard.actualTss > 0 || scorecard.avgExecutionScore != null)
                  ?? p.goalScorecards?.[0];
                const tssPct = firstScorecard && firstScorecard.plannedTss > 0
                  ? Math.round((firstScorecard.actualTss / firstScorecard.plannedTss) * 100)
                  : null;
                return (
              <ListItemText
                primary={p.name}
                secondary={
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} component="span">
                    <Chip label={p.goal} size="small" variant="outlined" component="span" />
                    {!!p.goalPriority && <Chip label={`Priorytet ${p.goalPriority}`} size="small" variant="outlined" component="span" />}
                    <Chip label={`${p.startDate} – ${p.endDate}`} size="small" variant="outlined" component="span" />
                    {!!p.eventDate && <Chip label={`Start docelowy ${p.eventDate}`} size="small" variant="outlined" component="span" />}
                     {!!p.taperStartDate && <Chip label={`Taper od ${p.taperStartDate}`} size="small" variant="outlined" component="span" />}
                     {p.targetWeeklyTss != null && (
                       <Chip label={`${p.targetWeeklyTss} TSS/tydz`} size="small" variant="outlined" component="span" />
                     )}
                     {p.weekdayAvailabilityMinutes != null && (
                       <Chip label={`${p.weekdayAvailabilityMinutes} min w tygodniu`} size="small" variant="outlined" component="span" />
                     )}
                     {p.weekendAvailabilityMinutes != null && (
                       <Chip label={`${p.weekendAvailabilityMinutes} min weekend`} size="small" variant="outlined" component="span" />
                     )}
                     <Chip label={formatLongRideDay(p.preferredLongRideDay)} size="small" variant="outlined" component="span" />
                     <Chip label={formatEnvironmentPreference(p.environmentPreference)} size="small" variant="outlined" component="span" />
                     {!!firstObjective && <Chip label={firstObjective.label} size="small" color="primary" component="span" />}
                     {!!firstObjective && <Chip label={`Max ${firstObjective.maxQualityDays} akcent`} size="small" variant="outlined" component="span" />}
                     {!!firstScorecard?.goalFocusLabel && (
                       <Chip label={`Cel: ${firstScorecard.goalFocusLabel}`} size="small" variant="outlined" component="span" />
                     )}
                     {!!firstScorecard?.goalFocusRole && (
                       <Chip label={formatGoalRole(firstScorecard.goalFocusRole)} size="small" variant="outlined" component="span" />
                     )}
                     {!!firstObjective?.fuelingLabel && <Chip label={firstObjective.fuelingLabel} size="small" color="success" component="span" />}
                     {!!firstScorecard && firstScorecard.plannedQualityDays > 0 && (
                       <Chip
                        label={`${firstScorecard.completedQualityDays}/${firstScorecard.plannedQualityDays} akcentów`}
                        size="small"
                        color={firstScorecard.onTrack ? 'success' : 'warning'}
                        component="span"
                      />
                    )}
                    {!!firstScorecard?.plannedGoalSessions && (
                      <Chip
                        label={`${firstScorecard.completedGoalSessions ?? 0}/${firstScorecard.plannedGoalSessions} bodźców celu`}
                        size="small"
                        color={firstScorecard.goalExecutionStatus === 'MISSED' ? 'warning' : 'success'}
                        component="span"
                      />
                    )}
                    {tssPct != null && (
                      <Chip
                        label={`${tssPct}% planu`}
                        size="small"
                        variant="outlined"
                        color={firstScorecard?.onTrack ? 'success' : 'warning'}
                        component="span"
                      />
                    )}
                  </Stack>
                }
              />
                );
              })()}
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
