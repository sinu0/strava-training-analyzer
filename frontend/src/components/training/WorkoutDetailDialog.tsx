import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import { useState } from 'react';

import AddToCalendarDialog from './AddToCalendarDialog';
import WorkoutPowerChart from './WorkoutPowerChart';
import { CATEGORY_LABELS } from '../../types/training';

import type { WorkoutTemplate } from '../../types/training';


interface WorkoutDetailDialogProps {
  template: WorkoutTemplate | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function WorkoutDetailDialog({ template, open, onClose, onDelete }: WorkoutDetailDialogProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  if (!template) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {template.name}
            <Chip label={CATEGORY_LABELS[template.category]} size="small" color="primary" variant="outlined" />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <WorkoutPowerChart steps={template.steps} />

          <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            <StatBlock label="Czas" value={`${template.targetDurationMin} min`} />
            <StatBlock label="TSS" value={String(template.targetTss)} />
            <StatBlock label="RPE" value={template.relativeEffort.toFixed(1)} />
            <StatBlock label="IF" value={template.intensityFactor.toFixed(2)} />
          </Box>

          {!!template.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {template.description}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          {!!onDelete && (
            <Button color="error" onClick={() => onDelete(template.id)}>
              Usuń
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={() => setCalendarOpen(true)}
          >
            Dodaj do kalendarza
          </Button>
          <Button onClick={onClose}>Zamknij</Button>
        </DialogActions>
      </Dialog>

      <AddToCalendarDialog
        template={template}
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  );
}
