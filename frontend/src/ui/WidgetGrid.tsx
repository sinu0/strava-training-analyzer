import { Box, type SxProps, type Theme } from '@mui/material';

import type { ReactNode } from 'react';

export interface WidgetGridProps {
  children: ReactNode;
  /** Columns on desktop; children set their width with `gridColumn: 'span N'`. */
  columns?: number;
  sx?: SxProps<Theme>;
}

/** Responsive 12-column grid with the standard gap; single column on phones. */
export default function WidgetGrid({ children, columns = 12, sx }: WidgetGridProps) {
  return (
    <Box
      sx={[
        {
          display: 'grid',
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: `repeat(${columns}, minmax(0, 1fr))` },
          alignItems: 'stretch',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

/** Grid cell spanning `span` of the desktop columns (full width on phones, `tablet` on md). */
export function WidgetCell({ span = 12, tablet, children, sx }: { span?: number; tablet?: number; children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box sx={[{ minWidth: 0, gridColumn: { xs: '1 / -1', md: `span ${tablet ?? span}`, lg: `span ${span}` } }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {children}
    </Box>
  );
}
