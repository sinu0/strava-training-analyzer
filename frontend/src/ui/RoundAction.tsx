import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { IconButton, type IconButtonProps } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

export interface RoundActionProps extends Omit<IconButtonProps, 'children' | 'size'> {
  'aria-label': string;
  icon?: ReactNode;
  /** media — white disc over photography; accent — primary disc; bubble — quiet icon bubble. */
  variant?: 'media' | 'accent' | 'bubble';
  size?: 'md' | 'lg' | 'xl';
}

/** Circular call-to-action (the "↗" disc of hero cards, the play button of the player). */
export default function RoundAction({ icon, variant = 'media', size = 'lg', sx, ...props }: RoundActionProps) {
  return (
    <IconButton
      {...props}
      sx={[
        (theme) => {
          const tokens = getAppThemeTokens(theme);
          const dimension = { md: tokens.control.md, lg: 56, xl: 72 }[size];
          const palette = {
            media: { bg: tokens.media.actionBg, ink: tokens.media.actionInk, shadow: tokens.media.actionShadow },
            accent: { bg: theme.palette.primary.main, ink: theme.palette.primary.contrastText, shadow: tokens.cardShadowHover },
            bubble: { bg: tokens.iconBubble, ink: theme.palette.text.primary, shadow: 'none' },
          }[variant];
          return {
            width: dimension,
            height: dimension,
            flexShrink: 0,
            bgcolor: palette.bg,
            color: palette.ink,
            boxShadow: palette.shadow,
            transition: tokens.transition,
            '& .MuiSvgIcon-root': { fontSize: size === 'xl' ? tokens.icon.xl + 8 : tokens.icon.lg },
            '&:hover': { bgcolor: palette.bg, transform: 'translateY(-2px)', filter: 'brightness(0.96)' },
            '&:focus-visible': { boxShadow: tokens.focusRing },
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {icon ?? <ArrowOutwardIcon />}
    </IconButton>
  );
}
