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
              <ListItemText
                primary={p.name}
                secondary={
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} component="span">
                    <Chip label={p.goal} size="small" variant="outlined" component="span" />
                    <Chip label={`${p.startDate} – ${p.endDate}`} size="small" variant="outlined" component="span" />
                    {p.targetWeeklyTss != null && (
                      <Chip label={`${p.targetWeeklyTss} TSS/tydz`} size="small" variant="outlined" component="span" />
                    )}
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
