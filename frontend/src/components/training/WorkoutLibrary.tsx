import { Box, Chip, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState } from 'react';

import EmptyState from '@/components/common/EmptyState';

import WorkoutDetailDialog from './WorkoutDetailDialog';
import WorkoutTemplateCard from './WorkoutTemplateCard';
import { useWorkoutTemplates, useDeleteWorkoutTemplate } from '../../hooks/useTrainingPlan';
import { CATEGORY_LABELS } from '../../types/training';

import type { WorkoutCategory, WorkoutTemplate } from '../../types/training';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as WorkoutCategory[];

export default function WorkoutLibrary() {
  const [category, setCategory] = useState<WorkoutCategory | undefined>();
  const [selected, setSelected] = useState<WorkoutTemplate | null>(null);
  const { data: templates, isLoading } = useWorkoutTemplates(category);
  const deleteMutation = useDeleteWorkoutTemplate();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    setSelected(null);
  };

  return (
    <Box>
      <CategoryFilters selected={category} onChange={setCategory} />

      {!!isLoading && <LoadingSkeleton />}

      {!isLoading && (!templates || templates.length === 0) && (
        <EmptyState
          title="Brak szablonów treningowych"
          description="Dodaj pierwszy szablon, aby go tu zobaczyć."
          illustration="/illustrations/empty-training.png"
        />
      )}

      {!isLoading && !!templates && templates.length > 0 && (
        <Grid container spacing={2}>
          {templates.map((t) => (
            <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <WorkoutTemplateCard template={t} onDetails={setSelected} />
            </Grid>
          ))}
        </Grid>
      )}

      <WorkoutDetailDialog
        template={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
      />
    </Box>
  );
}

function CategoryFilters({ selected, onChange }: { selected?: WorkoutCategory; onChange: (c?: WorkoutCategory) => void }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
      <Chip
        label="Wszystkie"
        variant={selected === undefined ? 'filled' : 'outlined'}
        color="primary"
        onClick={() => onChange(undefined)}
      />
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat}
          label={CATEGORY_LABELS[cat]}
          variant={selected === cat ? 'filled' : 'outlined'}
          color="primary"
          onClick={() => onChange(cat)}
        />
      ))}
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Grid container spacing={2}>
      {['first', 'second', 'third', 'fourth'].map((slot) => (
        <Grid key={slot} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  );
}
