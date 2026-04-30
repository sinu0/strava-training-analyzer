import { Alert, Box, Chip, Stack, Typography } from '@mui/material';

import type { ProgressionLevel } from '@/types/analytics';

type ProgressionLevelsPanelProps = {
  levels?: ProgressionLevel[];
};

function trendColor(trend: string): 'success' | 'warning' | 'error' | 'default' {
  switch (trend) {
    case 'UP':
      return 'success';
    case 'DOWN':
      return 'error';
    case 'STABLE':
      return 'warning';
    default:
      return 'default';
  }
}

function trendLabel(trend: string) {
  switch (trend) {
    case 'UP':
      return 'Rośnie';
    case 'DOWN':
      return 'Spada';
    case 'STABLE':
      return 'Stabilnie';
    default:
      return 'Brak danych';
  }
}

export default function ProgressionLevelsPanel({ levels }: ProgressionLevelsPanelProps) {
  if (!levels?.length) {
    return <Alert severity="info">Brakuje danych, żeby ocenić progresję pod próg, VO2 i długi tlen.</Alert>;
  }

  return (
    <Stack spacing={1.5}>
      {levels.map((level) => (
        <Box key={level.system} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 0.75 }}>
            <Chip label={level.label} size="small" color="primary" />
            <Chip label={`Poziom ${level.level}/10`} size="small" variant="outlined" />
            <Chip label={trendLabel(level.trend)} size="small" color={trendColor(level.trend)} />
            <Chip label={`${Math.round(level.currentLoad)}/${Math.round(level.targetLoad)} load`} size="small" variant="outlined" />
          </Stack>
          <Typography variant="body2">{level.description}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Następny krok: {level.nextRecommendation}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
