import { Box, Stack, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import { toneColor, type Tone } from './tokens';

import type { ReactNode } from 'react';

export type MetricVariant = 'readout' | 'stat' | 'hero';
export type MetricSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MetricProps {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  /** Secondary line under the value (context, range, comparison). */
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  /**
   * `readout` — label above value (dense panels);
   * `stat` — value first, label below (route/summary rows);
   * `hero` — very large light numeral with unit and caption (key figure of a widget).
   */
  variant?: MetricVariant;
  size?: MetricSize;
  /** Pill or trend badge aligned with the value. */
  badge?: ReactNode;
  align?: 'left' | 'center';
}

const VALUE_SIZE: Record<MetricSize, string> = {
  sm: '1.05rem',
  md: 'clamp(1.2rem, 1.1rem + 0.4vw, 1.45rem)',
  lg: 'clamp(1.7rem, 1.45rem + 0.9vw, 2.2rem)',
  xl: 'clamp(2.4rem, 1.9rem + 2vw, 3.6rem)',
};

/** One numeric figure with its unit and label, in the three layouts used across the app. */
export default function Metric({
  label, value, unit, hint, icon, tone, variant = 'readout', size, badge, align = 'left',
}: MetricProps) {
  const resolvedSize = size ?? (variant === 'hero' ? 'xl' : variant === 'stat' ? 'sm' : 'md');
  const labelNode = (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
      {icon ? (
        <Box sx={(theme) => ({ display: 'flex', color: tone ? toneColor(theme, tone) : 'text.secondary', '& svg': { fontSize: getAppThemeTokens(theme).icon.sm } })}>
          {icon}
        </Box>
      ) : null}
      <Typography variant="caption" sx={(theme) => ({ color: 'text.secondary', fontWeight: getAppThemeTokens(theme).type.weight.label })}>
        {label}
      </Typography>
    </Stack>
  );

  return (
    <Box sx={{ minWidth: 0, textAlign: align }}>
      {variant === 'readout' ? labelNode : null}
      <Stack
        direction="row"
        spacing={0.6}
        sx={{ alignItems: 'baseline', justifyContent: align === 'center' ? 'center' : 'flex-start', mt: variant === 'readout' ? 0.45 : 0 }}
      >
        <Typography
          component="span"
          sx={(theme) => {
            const tokens = getAppThemeTokens(theme);
            return {
              fontSize: VALUE_SIZE[resolvedSize],
              fontWeight: variant === 'hero' ? tokens.type.weight.metric : tokens.type.weight.heading,
              letterSpacing: tokens.type.tracking.tight,
              lineHeight: 1.08,
              fontVariantNumeric: 'tabular-nums',
              color: tone && tone !== 'neutral' ? toneColor(theme, tone) : 'text.primary',
              whiteSpace: 'nowrap',
            };
          }}
        >
          {value}
        </Typography>
        {unit ? (
          <Typography
            component="span"
            sx={(theme) => ({
              color: 'text.secondary',
              fontWeight: getAppThemeTokens(theme).type.weight.regular,
              fontSize: variant === 'hero' ? '1.1rem' : '0.8rem',
            })}
          >
            {unit}
          </Typography>
        ) : null}
        {badge ? <Box sx={{ ml: 1, alignSelf: 'center' }}>{badge}</Box> : null}
      </Stack>
      {variant !== 'readout' ? <Box sx={{ mt: 0.35 }}>{labelNode}</Box> : null}
      {hint ? <Typography variant="caption" component="div" sx={{ color: 'text.secondary', mt: 0.25 }}>{hint}</Typography> : null}
    </Box>
  );
}
