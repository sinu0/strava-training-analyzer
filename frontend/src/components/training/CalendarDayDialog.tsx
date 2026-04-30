import CloseIcon from '@mui/icons-material/Close';
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Stack, IconButton } from '@mui/material';


import WorkoutPowerChart from './WorkoutPowerChart';
import {
  useUpdatePlanStatus,
  useDeleteTrainingPlan,
  useExportWorkout,
  useRecordAdjustmentFeedback,
  useWorkoutTemplate,
} from '../../hooks/useTrainingPlan';
import { CATEGORY_LABELS, type WorkoutCategory } from '../../types/training';

import type { CalendarDay } from '../../types/training';

interface CalendarDayDialogProps {
  day: CalendarDay | null;
  open: boolean;
  onClose: () => void;
}

export default function CalendarDayDialog({ day, open, onClose }: CalendarDayDialogProps) {
  const updateStatus = useUpdatePlanStatus();
  const deletePlan = useDeleteTrainingPlan();
  const templateId = day?.planned?.workoutTemplateId ?? '';
  const { data: template } = useWorkoutTemplate(templateId);
  const exportFit = useExportWorkout(templateId, 'fit');
  const exportZwo = useExportWorkout(templateId, 'zwo');
  const recordAdjustmentFeedback = useRecordAdjustmentFeedback();

  if (!day) return null;
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
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!!planned && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Zaplanowany trening</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              {!!planned.plannedType && <Chip label={CATEGORY_LABELS[planned.plannedType as WorkoutCategory] ?? planned.plannedType} size="small" color="warning" />}
              {planned.plannedTss != null && <Chip label={`${planned.plannedTss} TSS`} size="small" variant="outlined" />}
              {planned.plannedDurationMin != null && <Chip label={`${planned.plannedDurationMin} min`} size="small" variant="outlined" />}
            </Stack>
            {!!planned.plannedDescription && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{planned.plannedDescription}</Typography>}
            {!!planned.workoutTemplateName && <Typography variant="body2" sx={{ mb: 1 }}>Szablon: {planned.workoutTemplateName}</Typography>}
            {!!template && template.steps.length > 0 && <Box sx={{ mt: 1 }}><WorkoutPowerChart steps={template.steps} /></Box>}
          </Box>
        )}

        {!!day.projection && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Projekcja PMC</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
              <Chip label={`CTL ${day.projection.projectedCtl.toFixed(1)}`} size="small" variant="outlined" />
              <Chip label={`ATL ${day.projection.projectedAtl.toFixed(1)}`} size="small" variant="outlined" />
              <Chip label={`TSB ${day.projection.projectedTsb > 0 ? '+' : ''}${day.projection.projectedTsb.toFixed(1)}`} size="small" variant="outlined" />
              <Chip label={`Gotowość ${day.projection.projectedReadiness}/100`} size="small" variant="outlined" />
              <Chip label={day.projection.dayLabel} size="small" color="primary" />
            </Stack>
            {day.projection.taperDay ? (
              <Alert severity="info" sx={{ mb: 1 }}>
                Ten dzień wpada już w taper — pilnuj świeżości i nie dokładaj zbędnej objętości.
              </Alert>
            ) : null}
          </Box>
        )}

        {!!day.adjustment && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">{day.adjustment.title}</Typography>
            <Typography variant="body2">{day.adjustment.description}</Typography>
            {day.adjustment.memoryHint ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
                Trafna sugestia
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => handleAdjustmentFeedback('REJECTED')}
                disabled={recordAdjustmentFeedback.isPending}
              >
                Nie ta korekta
              </Button>
            </Stack>
          </Alert>
        )}

        {!!planned && !!day.projection && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Symulator decyzji</Typography>
            <Alert severity="info" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2">Dlaczego aplikacja to sugeruje</Typography>
              <Typography variant="body2">
                {day.adjustment?.description ?? `Projekcja wskazuje dzień typu ${day.projection.dayLabel} przy gotowości ${day.projection.projectedReadiness}/100.`}
              </Typography>
            </Alert>
            <Stack spacing={1}>
              {scenarios.map((scenario) => (
                <Box key={scenario.title} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={scenario.title} size="small" color={scenario.color} />
                    <Chip label={`Gotowość ~${scenario.readiness}/100`} size="small" variant="outlined" />
                    <Chip label={`Obciążenie ${scenario.tssLabel}`} size="small" variant="outlined" />
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
              <Chip label={`Score ${day.execution.score}/100`} size="small" variant="outlined" />
              {day.execution.tssCompliance != null && (
                <Chip label={`TSS ${Math.round(day.execution.tssCompliance)}%`} size="small" variant="outlined" />
              )}
              {day.execution.durationCompliance != null && (
                <Chip label={`Czas ${Math.round(day.execution.durationCompliance)}%`} size="small" variant="outlined" />
              )}
              {day.execution.intervalCompliance != null && (
                <Chip label={`Interwały ${Math.round(day.execution.intervalCompliance)}%`} size="small" variant="outlined" />
              )}
              {day.execution.zoneCompliance != null && (
                <Chip label={`Strefa ${Math.round(day.execution.zoneCompliance)}%`} size="small" variant="outlined" />
              )}
              {day.execution.primaryLimiter ? (
                <Chip label={`Limiter: ${executionLimiterLabel(day.execution.primaryLimiter)}`} size="small" variant="outlined" />
              ) : null}
            </Stack>
            <Typography variant="body2">{day.execution.description}</Typography>
            {day.execution.nextDayAdvice ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Jutro: {day.execution.nextDayAdvice}
              </Typography>
            ) : null}
          </Alert>
        )}

        {!!actual && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Zrealizowana aktywność</Typography>
            <Typography variant="body2">{actual.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {actual.durationMin} min · {actual.distanceKm.toFixed(1)} km
              {actual.tss != null ? ` · ${actual.tss} TSS` : ''}
            </Typography>
          </Box>
        )}

        {!planned && !actual && (
          <Typography variant="body2" color="text.secondary">Brak zaplanowanych treningów i aktywności</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box>
          {!!templateId && <>
              <Button size="small" onClick={() => exportFit.mutate()}>Pobierz .fit</Button>
              <Button size="small" onClick={() => exportZwo.mutate()}>Pobierz .zwo</Button>
            </>}
        </Box>
        <Box>
          {!!planned && planned.status === 'PLANNED' && <>
              <Button size="small" color="success" onClick={() => handleStatus('COMPLETED')}>Oznacz jako zrealizowany</Button>
              <Button size="small" color="warning" onClick={() => handleStatus('SKIPPED')}>Pomiń</Button>
            </>}
          {!!planned && <Button size="small" color="error" onClick={handleDelete}>Usuń</Button>}
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
      return 'Na celu';
    case 'INTERVAL_QUALITY':
      return 'Jakość interwałów';
    case 'PACE_CONTROL':
      return 'Kontrola tempa';
    case 'VOLUME_SHORTFALL':
      return 'Za mało czasu';
    case 'LOAD_SHORTFALL':
      return 'Za mały koszt';
    case 'TOO_HARD':
      return 'Za mocno';
    default:
      return 'Wykonanie';
  }
}

function buildDecisionScenarios(day: CalendarDay) {
  const projectedReadiness = day.projection?.projectedReadiness ?? 50;
  const plannedTss = day.planned?.plannedTss ?? 0;

  return [
    {
      title: 'Zostaw jak jest',
      readiness: projectedReadiness,
      tssLabel: `${plannedTss} TSS`,
      color: 'primary' as const,
      description: `Trzymasz oryginalny bodziec i strukturę tygodnia. To najlepsza opcja, jeśli czujesz się zgodnie z projekcją dnia ${day.projection?.dayLabel ?? ''}.`,
    },
    {
      title: 'Odchudź o 20-25%',
      readiness: Math.min(100, projectedReadiness + 8),
      tssLabel: `${Math.max(0, Math.round(plannedTss * 0.75))} TSS`,
      color: 'warning' as const,
      description: 'Zostawiasz rolę treningu, ale obcinasz objętość lub jedną serię. To zwykle najlepszy kompromis przy narastającym zmęczeniu.',
    },
    {
      title: 'Przenieś na jutro',
      readiness: Math.min(100, projectedReadiness + 12),
      tssLabel: `${plannedTss} TSS później`,
      color: 'info' as const,
      description: 'Chronisz świeżość dziś, ale dalej bronisz tygodniowego celu. Dobra opcja, jeśli problemem jest konkretny dzień, a nie cały tydzień.',
    },
    {
      title: 'Odpuść bodziec',
      readiness: Math.min(100, projectedReadiness + 18),
      tssLabel: '0 TSS',
      color: 'success' as const,
      description: 'Najmocniej odzyskujesz świeżość, ale tracisz zaplanowany bodziec. Wybieraj to głównie wtedy, gdy korekta lub readiness są już czerwone.',
    },
  ];
}
