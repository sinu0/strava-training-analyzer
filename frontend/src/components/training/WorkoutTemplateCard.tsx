import { Chip, Typography, Box, CardActions, Button } from '@mui/material';

import WorkoutPowerChart from './WorkoutPowerChart';
import { CATEGORY_LABELS } from '../../types/training';
import DataCard from '../common/DataCard';

import type { WorkoutTemplate } from '../../types/training';

interface WorkoutTemplateCardProps {
  template: WorkoutTemplate;
  onDetails: (template: WorkoutTemplate) => void;
}

export default function WorkoutTemplateCard({ template, onDetails }: WorkoutTemplateCardProps) {
  return (
    <DataCard
      title={template.name}
      subtitle={`${template.targetDurationMin} min · TSS ${template.targetTss}`}
      action={
        <Chip
          label={CATEGORY_LABELS[template.category]}
          size="small"
          color="primary"
          variant="outlined"
        />
      }
    >
      <WorkoutPowerChart steps={template.steps} compact />
      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
        <Stat label="RPE" value={template.relativeEffort.toFixed(1)} />
        <Stat label="IF" value={template.intensityFactor.toFixed(2)} />
        <Stat label="TSS" value={String(template.targetTss)} />
      </Box>
      <CardActions sx={{ px: 0, pt: 1.5 }}>
        <Button size="small" variant="text" onClick={() => onDetails(template)}>
          Szczegóły
        </Button>
      </CardActions>
    </DataCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}
