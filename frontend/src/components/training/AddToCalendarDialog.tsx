import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Box,
  Divider,
  Alert,
} from '@mui/material';
import { useState, useMemo } from 'react';

import WorkoutPowerChart from './WorkoutPowerChart';
import { useCreateWorkoutEntry } from '../../hooks/useTrainingPlan';

import type { WorkoutTemplate, WorkoutStep } from '../../types/training';


type ScaleMode = 'PROPORTIONAL' | 'EXTEND_RECOVERY' | 'ADD_INTERVALS';

interface Props {
  template: WorkoutTemplate | null;
  open: boolean;
  onClose: () => void;
}

function scaleSteps(steps: WorkoutStep[], factor: number, mode: ScaleMode): WorkoutStep[] {
  return steps.map((step) => {
    if (step.type === 'interval') {
      if (mode === 'PROPORTIONAL') {
        return {
          ...step,
          onDurationSec: Math.round((step.onDurationSec ?? 0) * factor),
          offDurationSec: Math.round((step.offDurationSec ?? 0) * factor),
        };
      }
      if (mode === 'EXTEND_RECOVERY') {
        const totalIntervalSec = (step.onDurationSec ?? 0) * (step.repeat ?? 1);
        const totalOffSec = (step.offDurationSec ?? 0) * (step.repeat ?? 1);
        const availableSec = (totalIntervalSec + totalOffSec) * factor;
        const newOffPerRepeat = Math.max(
          30,
          Math.round((availableSec - totalIntervalSec) / (step.repeat ?? 1)),
        );
        return { ...step, offDurationSec: newOffPerRepeat };
      }
      if (mode === 'ADD_INTERVALS') {
        const newRepeat = Math.max(1, Math.round((step.repeat ?? 1) * factor));
        return { ...step, repeat: newRepeat };
      }
    }
    return { ...step, durationSec: Math.round((step.durationSec ?? 0) * factor) };
  });
}

function calcTotalSec(steps: WorkoutStep[]): number {
  return steps.reduce((sum, s) => {
    if (s.type === 'interval') {
      return sum + ((s.onDurationSec ?? 0) + (s.offDurationSec ?? 0)) * (s.repeat ?? 1);
    }
    return sum + (s.durationSec ?? 0);
  }, 0);
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function AddToCalendarDialog({ template, open, onClose }: Props) {
  const [date, setDate] = useState<string>(tomorrow());
  const [targetMin, setTargetMin] = useState<number>(template?.targetDurationMin ?? 60);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('PROPORTIONAL');
  const createEntry = useCreateWorkoutEntry();

  const scaledSteps = useMemo(() => {
    if (!template?.steps) return [];
    const originalSec = calcTotalSec(template.steps);
    if (originalSec === 0) return template.steps;
    const factor = (targetMin * 60) / originalSec;
    return scaleSteps(template.steps, factor, scaleMode);
  }, [template, targetMin, scaleMode]);

  const scaledTotalMin = Math.round(calcTotalSec(scaledSteps) / 60);

  if (!template) return null;

  const handleSubmit = () => {
    if (!date) return;
    createEntry.mutate(
      {
        workoutTemplateId: template.id,
        date,
        durationMin: targetMin,
        scaledSteps,
        notes: `Skalowanie: ${scaleMode}`,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Dodaj do kalendarza: {template.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              label="Data treningu"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              label="Czas docelowy (min)"
              type="number"
              value={targetMin}
              onChange={(e) => setTargetMin(Math.max(1, Number(e.target.value)))}
              sx={{ width: 180 }}
              inputProps={{ min: 1 }}
            />
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Tryb skalowania
            </Typography>
            <ToggleButtonGroup
              value={scaleMode}
              exclusive
              onChange={(_, v) => v && setScaleMode(v)}
              size="small"
            >
              <ToggleButton value="PROPORTIONAL">Proporcjonalne</ToggleButton>
              <ToggleButton value="EXTEND_RECOVERY">Wydłuż odpoczynek</ToggleButton>
              <ToggleButton value="ADD_INTERVALS">Dodaj interwały</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Podgląd po skalowaniu – {scaledTotalMin} min
            </Typography>
            <WorkoutPowerChart steps={scaledSteps} />
          </Box>

          {!!createEntry.isError && <Alert severity="error">Błąd podczas dodawania treningu do kalendarza.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Anuluj
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!date || createEntry.isPending}
        >
          {createEntry.isPending ? 'Dodawanie…' : 'Dodaj do kalendarza'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
