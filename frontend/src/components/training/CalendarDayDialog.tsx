import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Stack, IconButton } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { scheduledExportUrl } from '@/features/workout/workoutApi';

import { trainingMessages } from './messages';
import WorkoutPowerChart from './WorkoutPowerChart';
import {
  useUpdatePlanStatus,
  useDeleteTrainingPlan,
  useRecordAdjustmentFeedback,
} from '../../hooks/useTrainingPlan';
import { CATEGORY_LABELS, type WorkoutCategory } from '../../types/training';

import type { CalendarDay } from '../../types/training';

interface CalendarDayDialogProps {
  day: CalendarDay | null;
  open: boolean;
  onClose: () => void;
}

export default function CalendarDayDialog({ day: originalDay, open, onClose }: CalendarDayDialogProps) {
  const t = trainingMessages.useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const updateStatus = useUpdatePlanStatus();
  const navigate = useNavigate();
  const deletePlan = useDeleteTrainingPlan();
  const recordAdjustmentFeedback = useRecordAdjustmentFeedback();

  if (!originalDay) return null;
  const sessions = originalDay.sessions ?? [];
  const selected = sessions.find((session) => session.planned.id === selectedId) ?? sessions[0];
  const day = selected ? { ...originalDay, ...selected, adjustment: selected === sessions[0] ? originalDay.adjustment : null } : originalDay;
  const { planned, actual } = day;
  const scenarios = buildDecisionScenarios(day);

  const handleStatus = (status: 'COMPLETED' | 'SKIPPED') => {
    if (planned) updateStatus.mutate({ id: planned.id, status }, { onSuccess: onClose });
  };

  const handleDelete = () => {
    if (planned) deletePlan.mutate(planned.id, { onSuccess: onClose });
  };

  const handleAdjustmentFeedback = (feedback: 'ACCEPTED' | 'REJECTED') => {
    if (!day.adjustment) return;
    recordAdjustmentFeedback.mutate({
      date: day.date,
      planId: planned?.id ?? null,
      suggestionType: day.adjustment.type,
      suggestionTitle: day.adjustment.title,
      feedback,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {day.date}
        <IconButton onClick={onClose} size="small" aria-label={t('calendarDayDialog.closeAria')}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {sessions.length > 1 && (
          <Stack
            direction="row"
            aria-label={t('calendarDayDialog.sessionsAria')}
            sx={{
              gap: 1,
              mb: 2,
              flexWrap: 'wrap'
            }}>
            {sessions.map((session, index) => (
              <Button key={session.planned.id} size="small"
                variant={session.planned.id === planned?.id ? 'contained' : 'outlined'}
                onClick={() => setSelectedId(session.planned.id)}>
                {t('calendarDayDialog.sessionButton', {
                  index: index + 1,
                  description: session.planned.plannedDescription || session.planned.plannedType || t('calendarDayDialog.defaultWorkoutName'),
                })}
              </Button>
            ))}
          </Stack>
        )}
        {!!planned && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>{t('calendarDayDialog.plannedTitle')}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {!!planned.plannedType && <Chip label={CATEGORY_LABELS[planned.plannedType as WorkoutCategory] ?? planned.plannedType} size="small" color="warning" />}
              {planned.plannedTss != null && <Chip label={`${planned.plannedTss} TSS`} size="small" variant="outlined" />}
              {planned.plannedDurationMin != null && <Chip label={`${planned.plannedDurationMin} min`} size="small" variant="outlined" />}
            </Stack>
            {!!planned.plannedDescription && <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 1
              }}>{planned.plannedDescription}</Typography>}
            {!!planned.workoutTemplateName && <Typography variant="body2" sx={{ mb: 1 }}>{t('calendarDayDialog.templateLabel', { name: planned.workoutTemplateName })}</Typography>}
            {!!planned.workoutStepsSnapshot?.length && <Box sx={{ mt: 1 }}><WorkoutPowerChart steps={planned.workoutStepsSnapshot} /></Box>}
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              {t('calendarDayDialog.snapshotCaption', {
                revision: planned.workoutTemplateRevision ?? 'legacy',
                ftp: `${planned.ftpWatts ?? t('calendarDayDialog.ftpUnknown')}${planned.ftpWatts ? ' W' : ''}`,
              })}
            </Typography>
          </Box>
        )}

        {!!day.projection && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>{t('calendarDayDialog.projectionTitle')}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
              <Chip label={`CTL ${day.projection.projectedCtl.toFixed(1)}`} size="small" variant="outlined" />
              <Chip label={`ATL ${day.projection.projectedAtl.toFixed(1)}`} size="small" variant="outlined" />
              <Chip label={`TSB ${day.projection.projectedTsb > 0 ? '+' : ''}${day.projection.projectedTsb.toFixed(1)}`} size="small" variant="outlined" />
              <Chip label={t('calendarDayDialog.readinessChip', { value: day.projection.projectedReadiness })} size="small" variant="outlined" />
              <Chip label={day.projection.dayLabel} size="small" color="primary" />
            </Stack>
            {day.projection.taperDay ? (
              <Alert severity="info" sx={{ mb: 1 }}>
                {t('calendarDayDialog.taperAlert')}
              </Alert>
            ) : null}
          </Box>
        )}

        {!!day.adjustment && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">{day.adjustment.title}</Typography>
            <Typography variant="body2">{day.adjustment.description}</Typography>
            {day.adjustment.memoryHint ? (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 1
                }}>
                {day.adjustment.memoryHint}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAdjustmentFeedback('ACCEPTED')}
                disabled={recordAdjustmentFeedback.isPending}
              >
                {t('calendarDayDialog.acceptSuggestion')}
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => handleAdjustmentFeedback('REJECTED')}
                disabled={recordAdjustmentFeedback.isPending}
              >
                {t('calendarDayDialog.rejectSuggestion')}
              </Button>
            </Stack>
          </Alert>
        )}

        {!!planned && !!day.projection && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>{t('calendarDayDialog.decisionSimulatorTitle')}</Typography>
            <Alert severity="info" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2">{t('calendarDayDialog.whyTitle')}</Typography>
              <Typography variant="body2">
                {day.adjustment?.description ?? t('calendarDayDialog.whyFallback', { dayLabel: day.projection.dayLabel, readiness: day.projection.projectedReadiness })}
              </Typography>
            </Alert>
            <Stack spacing={1}>
              {scenarios.map((scenario) => (
                <Box key={scenario.title} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={scenario.title} size="small" color={scenario.color} />
                    <Chip label={t('calendarDayDialog.readinessScenario', { value: scenario.readiness })} size="small" variant="outlined" />
                    <Chip label={t('calendarDayDialog.loadScenario', { value: scenario.tssLabel })} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="body2">{scenario.description}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {!!day.execution && (
          <Alert severity={executionSeverity(day.execution.outcome)} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
              <Chip label={day.execution.label} size="small" color={executionChipColor(day.execution.outcome)} />
              <Chip label={day.execution.score != null ? t('calendarDayDialog.executionScore', { value: day.execution.score }) : t('calendarDayDialog.executionScoreUnavailable')} size="small" variant="outlined" />
              {day.execution.tssCompliance != null && (
                <Chip label={`TSS ${Math.round(day.execution.tssCompliance)}%`} size="small" variant="outlined" />
              )}
              {day.execution.durationCompliance != null && (
                <Chip label={t('calendarDayDialog.durationCompliance', { value: Math.round(day.execution.durationCompliance) })} size="small" variant="outlined" />
              )}
              {day.execution.intervalCompliance != null && (
                <Chip label={t('calendarDayDialog.intervalCompliance', { value: Math.round(day.execution.intervalCompliance) })} size="small" variant="outlined" />
              )}
              {day.execution.zoneCompliance != null && (
                <Chip label={t('calendarDayDialog.zoneCompliance', { value: Math.round(day.execution.zoneCompliance) })} size="small" variant="outlined" />
              )}
              {day.execution.primaryLimiter ? (
                <Chip label={t('calendarDayDialog.limiterChip', { value: executionLimiterLabel(day.execution.primaryLimiter) })} size="small" variant="outlined" />
              ) : null}
            </Stack>
            <Typography variant="body2">{day.execution.description}</Typography>
            {day.execution.nextDayAdvice ? (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 1
                }}>
                {t('calendarDayDialog.nextDayAdvice', { advice: day.execution.nextDayAdvice })}
              </Typography>
            ) : null}
          </Alert>
        )}

        {!!actual && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>{t('calendarDayDialog.completedActivityTitle')}</Typography>
            <Typography variant="body2">{actual.name}</Typography>
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              {actual.durationMin != null ? `${actual.durationMin} min` : t('calendarDayDialog.durationUnknown')} · {actual.distanceKm != null ? `${actual.distanceKm.toFixed(1)} km` : t('calendarDayDialog.distanceUnknown')}
              {actual.tss != null ? ` · ${actual.tss} TSS` : ''}
            </Typography>
          </Box>
        )}

        {(originalDay.activities ?? []).filter((activity) => activity.id !== actual?.id).map((activity) => (
          <Box key={activity.id} sx={{ mt: 1 }}>
            <Button size="small" onClick={() => navigate(`/activities/${activity.id}`)}>{activity.name}</Button>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>{t('calendarDayDialog.remainingActivity')}</Typography>
          </Box>
        ))}

        {!planned && !actual && (
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>{t('calendarDayDialog.noPlanNoActual')}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box>
          {!!planned && <>
              <Button size="small" component="a" href={scheduledExportUrl(planned.id, 'fit')}>{t('calendarDayDialog.downloadFit')}</Button>
              <Button size="small" component="a" href={scheduledExportUrl(planned.id, 'zwo')}>{t('calendarDayDialog.downloadZwo')}</Button>
            </>}
        </Box>
        <Box>
          {!!planned && planned.status === 'PLANNED' && <>
              <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => { onClose(); navigate(`/training/workouts/${planned.id}`); }}>{t('calendarDayDialog.start')}</Button>
              <Button size="small" color="success" onClick={() => handleStatus('COMPLETED')}>{t('calendarDayDialog.markCompleted')}</Button>
              <Button size="small" color="warning" onClick={() => handleStatus('SKIPPED')}>{t('calendarDayDialog.skip')}</Button>
            </>}
          {!!planned && <Button size="small" color="error" onClick={handleDelete}>{t('calendarDayDialog.delete')}</Button>}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

function executionChipColor(outcome: string): 'success' | 'warning' | 'error' | 'info' {
  switch (outcome) {
    case 'WELL_EXECUTED':
      return 'success';
    case 'TOO_HARD':
    case 'MISSED_STIMULUS':
      return 'error';
    case 'TOO_EASY':
    case 'PARTIAL':
    default:
      return 'warning';
  }
}

function executionSeverity(outcome: string): 'success' | 'warning' | 'error' | 'info' {
  switch (outcome) {
    case 'WELL_EXECUTED':
      return 'success';
    case 'TOO_HARD':
    case 'MISSED_STIMULUS':
      return 'error';
    case 'TOO_EASY':
    case 'PARTIAL':
    default:
      return 'warning';
  }
}

function executionLimiterLabel(limiter: string) {
  switch (limiter) {
    case 'ON_TARGET':
      return trainingMessages.t('calendarDayDialog.limiterLabels.onTarget');
    case 'INTERVAL_QUALITY':
      return trainingMessages.t('calendarDayDialog.limiterLabels.intervalQuality');
    case 'PACE_CONTROL':
      return trainingMessages.t('calendarDayDialog.limiterLabels.paceControl');
    case 'VOLUME_SHORTFALL':
      return trainingMessages.t('calendarDayDialog.limiterLabels.volumeShortfall');
    case 'LOAD_SHORTFALL':
      return trainingMessages.t('calendarDayDialog.limiterLabels.loadShortfall');
    case 'TOO_HARD':
      return trainingMessages.t('calendarDayDialog.limiterLabels.tooHard');
    default:
      return trainingMessages.t('calendarDayDialog.limiterLabels.executionDefault');
  }
}

function buildDecisionScenarios(day: CalendarDay) {
  const projectedReadiness = day.projection?.projectedReadiness ?? 50;
  const plannedTss = day.planned?.plannedTss ?? 0;
  const t = trainingMessages.t;

  return [
    {
      title: t('calendarDayDialog.scenarios.keepTitle'),
      readiness: projectedReadiness,
      tssLabel: `${plannedTss} TSS`,
      color: 'primary' as const,
      description: t('calendarDayDialog.scenarios.keepDescription', { dayLabel: day.projection?.dayLabel ?? '' }),
    },
    {
      title: t('calendarDayDialog.scenarios.reduceTitle'),
      readiness: Math.min(100, projectedReadiness + 8),
      tssLabel: `${Math.max(0, Math.round(plannedTss * 0.75))} TSS`,
      color: 'warning' as const,
      description: t('calendarDayDialog.scenarios.reduceDescription'),
    },
    {
      title: t('calendarDayDialog.scenarios.moveTitle'),
      readiness: Math.min(100, projectedReadiness + 12),
      tssLabel: t('calendarDayDialog.scenarios.laterTssLabel', { tss: plannedTss }),
      color: 'info' as const,
      description: t('calendarDayDialog.scenarios.moveDescription'),
    },
    {
      title: t('calendarDayDialog.scenarios.dropTitle'),
      readiness: Math.min(100, projectedReadiness + 18),
      tssLabel: '0 TSS',
      color: 'success' as const,
      description: t('calendarDayDialog.scenarios.dropDescription'),
    },
  ];
}
