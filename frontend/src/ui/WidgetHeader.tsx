import { Box, Stack, Typography } from '@mui/material';

import IconBubble from './IconBubble';
import { type Tone } from './tokens';

import type { ReactNode } from 'react';

export interface WidgetHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  iconTone?: Tone;
  /** Right-hand slot: a StatusPill, a MiniProgress, a menu or a button. */
  action?: ReactNode;
  /** Heading level for the title; widgets inside a page default to h2. */
  component?: 'h2' | 'h3' | 'h4' | 'div';
}

/** Icon bubble + title on the left, one action slot on the right. */
export default function WidgetHeader({ title, subtitle, icon, iconTone, action, component = 'h2' }: WidgetHeaderProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0, flex: '1 1 auto' }}>
        {icon ? <IconBubble tone={iconTone}>{icon}</IconBubble> : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            component={component}
            title={typeof title === 'string' ? title : undefined}
            sx={{ lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflowWrap: 'anywhere' }}
          >
            {title}
          </Typography>
          {subtitle ? <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>{subtitle}</Typography> : null}
        </Box>
      </Stack>
      {action ? <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>{action}</Box> : null}
    </Stack>
  );
}
