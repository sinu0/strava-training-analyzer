import { Box, Stack, Typography } from '@mui/material';

import { getAppThemeTokens } from '@/theme/theme';

import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  component?: 'h2' | 'h3';
}

/** Heading for a group of widgets inside a page (no surface). */
export default function SectionHeader({ eyebrow, title, description, icon, action, component = 'h2' }: SectionHeaderProps) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
        {icon ? <Box sx={{ mt: 0.25, display: 'grid', placeItems: 'center', color: 'primary.main' }}>{icon}</Box> : null}
        <Box sx={{ minWidth: 0 }}>
          {eyebrow ? <Typography variant="overline" sx={(theme) => ({ color: getAppThemeTokens(theme).action.primaryInk, display: 'block', lineHeight: 1.4 })}>{eyebrow}</Typography> : null}
          <Typography variant="h5" component={component}>{title}</Typography>
          {description ? <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.35, maxWidth: 760 }}>{description}</Typography> : null}
        </Box>
      </Stack>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Stack>
  );
}
