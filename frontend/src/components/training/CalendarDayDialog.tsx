import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Stack, IconButton } from '@mui/material';


import WorkoutPowerChart from './WorkoutPowerChart';
import { useUpdatePlanStatus, useDeleteTrainingPlan, useExportWorkout } from '../../hooks/useTrainingPlan';
import { useWorkoutTemplate } from '../../hooks/useTrainingPlan';
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

  if (!day) return null;
  const { planned, actual } = day;

  const handleStatus = (status: 'COMPLETED' | 'SKIPPED') => {
    if (planned) updateStatus.mutate({ id: planned.id, status }, { onSuccess: onClose });
  };

  const handleDelete = () => {
    if (planned) deletePlan.mutate(planned.id, { onSuccess: onClose });
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

        {!!actual && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Zrealizowana aktywność</Typography>
            <Typography variant="body2">{actual.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {actual.durationMin} min · {actual.distanceKm.toFixed(1)} km
              {actual.tss != null && ` · ${actual.tss} TSS`}
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
