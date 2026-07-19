import { Box, Typography } from '@mui/material';

import type { ReactNode } from 'react';

interface ChartWrapperProps {
  title?: string;
  legend?: ReactNode;
  height?: number;
  children: ReactNode;
}

/**
 * Provides a shared header and fixed-height frame for chart widgets.
 */
export default function ChartWrapper({ title, legend, height = 300, children }: ChartWrapperProps) {
  return (
    <Box>
      {!!(title || legend) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.5,
          }}
        >
          {!!title && (
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {title}
            </Typography>
          )}
          {legend}
        </Box>
      )}
      <Box sx={{ width: '100%', height }}>{children}</Box>
    </Box>
  );
}
