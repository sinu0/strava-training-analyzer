import { Card, CardContent, Typography, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { ReactNode } from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: ReactNode;
}

/**
 * Highlights a single metric value with optional unit, icon, and trend.
 * Header row: icon in a soft iconBubble circle + muted label, trend pill on the right.
 */
export default function MetricTile({ label, value, unit, trend, icon }: MetricTileProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            {!!icon && (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) => theme.tokens?.iconBubble ?? 'action.hover',
                  color: 'text.primary',
                }}
              >
                {icon}
              </Box>
            )}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
              noWrap
            >
              {label}
            </Typography>
          </Box>
          {trend !== undefined && (
            <Box
              data-testid="metric-trend-badge"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.25,
                py: 0.375,
                borderRadius: 999,
                flexShrink: 0,
                fontSize: '0.78rem',
                fontWeight: 700,
                bgcolor: (theme) =>
                  alpha(trend >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.12),
                color: trend >= 0 ? 'success.dark' : 'error.main',
              }}
            >
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mt: 2 }}>
          <Typography
            variant="h3"
            component="div"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            {value}
          </Typography>
          {!!unit && (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {unit}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
