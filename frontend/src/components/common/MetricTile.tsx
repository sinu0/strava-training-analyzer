import { Card, CardContent, Typography, Box } from '@mui/material';

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
 */
export default function MetricTile({ label, value, unit, trend, icon }: MetricTileProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          {!!icon && <Box sx={{ color: 'text.secondary' }}>{icon}</Box>}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {!!unit && (
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          )}
        </Box>
        {trend !== undefined && (
          <Typography
            variant="body2"
            sx={{ color: trend >= 0 ? 'success.main' : 'error.main', mt: 0.5 }}
          >
            {trend >= 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
