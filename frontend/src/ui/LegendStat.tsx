import { Box, Stack, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

export interface LegendStatProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  color: string;
}

/** "● Walking / 127 Cal": legend entry that doubles as a figure. */
export default function LegendStat({ label, value, unit, color }: LegendStatProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }} noWrap>{label}</Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', mt: 0.35 }}>
        <Typography sx={(theme) => ({ fontSize: '1.5rem', fontWeight: getAppThemeTokens(theme).type.weight.metric, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' })}>{value}</Typography>
        {unit ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>{unit}</Typography> : null}
      </Stack>
    </Box>
  );
}
