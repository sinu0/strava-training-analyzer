import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getAppThemeTokens } from '@/theme/theme';

import { toneColor, type Tone } from './tokens';

import type { ReactNode } from 'react';

export interface StatusPillProps {
  label: ReactNode;
  tone?: Tone;
  /** Explicit colour for data categories (zones, benefits); wins over `tone`. */
  color?: string;
  /** soft — tinted (default); solid — filled accent (e.g. "● 87%"); outline — quiet border; glass — over photography. */
  variant?: 'soft' | 'solid' | 'outline' | 'glass';
  dot?: boolean;
  icon?: ReactNode;
  size?: 'sm' | 'md';
  /** Uppercase eyebrow styling for labels like "REKOMENDACJA DNIA". */
  eyebrow?: boolean;
  title?: string;
}

/** Rounded status label. Use instead of ad-hoc Chips for state, freshness and badges. */
export default function StatusPill({
  label, tone = 'neutral', color: customColor, variant = 'soft', dot = false, icon, size = 'md', eyebrow = false, title,
}: StatusPillProps) {
  return (
    <Box
      component="span"
      title={title}
      sx={(theme) => {
        const tokens = getAppThemeTokens(theme);
        const neutral = tone === 'neutral' && !customColor;
        const color = customColor ?? (tone === 'neutral' ? theme.palette.text.primary : toneColor(theme, tone));
        const solidInk = customColor ? theme.palette.getContrastText(customColor)
          : tone === 'neutral' ? theme.palette.background.paper : theme.palette[tone].contrastText;
        return {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          maxWidth: '100%',
          minHeight: size === 'sm' ? 24 : 30,
          px: size === 'sm' ? 1 : 1.4,
          borderRadius: `${tokens.radius.pill}px`,
          fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
          fontWeight: tokens.type.weight.label,
          letterSpacing: eyebrow ? tokens.type.tracking.eyebrow : tokens.type.tracking.label,
          textTransform: eyebrow ? 'uppercase' : 'none',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          border: '1px solid',
          ...(variant === 'solid' && { bgcolor: color, color: solidInk, borderColor: color }),
          ...(variant === 'soft' && {
            bgcolor: neutral ? tokens.iconBubble : alpha(color, 0.12),
            color: neutral ? 'text.primary' : color,
            borderColor: neutral ? tokens.surfaceBorder : alpha(color, 0.24),
          }),
          ...(variant === 'outline' && { bgcolor: 'transparent', color, borderColor: alpha(color, 0.5) }),
          ...(variant === 'glass' && {
            bgcolor: tokens.glass.bg, color: tokens.media.ink, borderColor: tokens.glass.border, backdropFilter: tokens.glass.blur,
          }),
          '& svg': { fontSize: size === 'sm' ? 14 : 16 },
          '& .ui-pill-dot': { width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor', flexShrink: 0 },
        };
      }}
    >
      {dot ? <span className="ui-pill-dot" aria-hidden /> : null}
      {icon}
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Box>
    </Box>
  );
}
