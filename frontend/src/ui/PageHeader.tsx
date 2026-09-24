import { Box, Stack, Typography } from '@mui/material';

import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  /** Status pills shown next to the title block (e.g. data freshness). */
  meta?: ReactNode;
  actions?: ReactNode;
}

/** Page title block: h1, description, optional status pills and actions. */
export default function PageHeader({ title, description, eyebrow, meta, actions }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between', mb: { xs: 3, md: 4 } }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? <Typography variant="overline" sx={{ color: 'primary.main', display: 'block' }}>{eyebrow}</Typography> : null}
        <Typography component="h1" variant="h3">{title}</Typography>
        {description ? <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.75, maxWidth: 760 }}>{description}</Typography> : null}
      </Box>
      {meta || actions ? (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
          {meta}
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
