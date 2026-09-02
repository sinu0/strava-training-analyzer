import { Box, Stack, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

interface MetricReadoutProps {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
}

export default function MetricReadout({ label, value, unit, hint, icon, tone }: MetricReadoutProps) {
  const color = tone ? `${tone}.main` : 'text.primary';
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        {icon ? <Box sx={{ display: 'flex', color: tone ? `${tone}.main` : 'text.secondary', '& svg': { fontSize: (theme) => getAppThemeTokens(theme).icon.sm } }}>{icon}</Box> : null}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: (theme) => getAppThemeTokens(theme).type.weight.label }}>{label}</Typography>
      </Stack>
      <Stack direction="row" spacing={0.55} alignItems="baseline" sx={{ mt: 0.45 }}>
        <Typography variant="h5" sx={{ color }}>{value}</Typography>
        {unit ? <Typography variant="caption" color="text.secondary" sx={{ fontWeight: (theme) => getAppThemeTokens(theme).type.weight.regular }}>{unit}</Typography> : null}
      </Stack>
      {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
    </Box>
  );
}
