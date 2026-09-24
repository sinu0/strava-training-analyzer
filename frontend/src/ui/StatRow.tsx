import { Box, Stack, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import IconBubble from './IconBubble';
import { type Tone } from './tokens';

import type { ReactNode } from 'react';

export interface StatRowItem {
  id: string;
  icon: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  tone?: Tone;
  label?: string;
}

/** Muted strip of icon + value + unit items ("63.71 km · 298 min · 9277 kcal"). */
export default function StatRow({ items, variant = 'muted' }: { items: StatRowItem[]; variant?: 'muted' | 'plain' }) {
  return (
    <Stack
      direction="row"
      useFlexGap
      sx={(theme) => {
        const tokens = getAppThemeTokens(theme);
        return {
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'space-between',
          p: variant === 'muted' ? 1.5 : 0,
          borderRadius: `${tokens.radius.panel}px`,
          bgcolor: variant === 'muted' ? tokens.surfaceSubtle : 'transparent',
          border: variant === 'muted' ? `1px solid ${tokens.surfaceBorder}` : 'none',
        };
      }}
    >
      {items.map((item) => (
        <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }} aria-label={item.label}>
          <IconBubble size="sm" tone={item.tone ?? 'primary'}>{item.icon}</IconBubble>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 750, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{item.value}</Typography>
            {item.unit ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.unit}</Typography> : null}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
