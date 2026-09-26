import { Chip, Typography, Box, CardActions, Button } from '@mui/material';

import { Widget } from '@/ui';

import { trainingMessages } from './messages';
import WorkoutPowerChart from './WorkoutPowerChart';
import { CATEGORY_LABELS } from '../../types/training';

import type { WorkoutTemplate } from '../../types/training';

interface WorkoutTemplateCardProps {
  template: WorkoutTemplate;
  onDetails: (template: WorkoutTemplate) => void;
}

export default function WorkoutTemplateCard({ template, onDetails }: WorkoutTemplateCardProps) {
  const t = trainingMessages.useT();
  return (
    <Widget
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
          {t('workoutTemplateCard.detailsButton')}
        </Button>
      </CardActions>
    </Widget>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{
        color: "text.secondary"
      }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{
        fontWeight: 600
      }}>
        {value}
      </Typography>
    </Box>
  );
}
