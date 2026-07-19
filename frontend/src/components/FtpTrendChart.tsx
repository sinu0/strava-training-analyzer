import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { CHART_ACTIVE_DOT, getChartVisuals } from '../utils/chartStyles';

import type { TrendPoint } from '../types/analytics';

interface FtpTrendChartProps {
  data: TrendPoint[];
}

const FtpTrendChart = memo(function FtpTrendChart({
  data,
}: FtpTrendChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date,
        value: Math.round(d.value),
      })),
    [data],
  );

  if (!data.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych trendu FTP.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid {...chart.grid} />
          <XAxis
            dataKey="date"
            {...chart.axis}
            tickFormatter={(v) => new Date(v).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
          />
          <YAxis
            {...chart.axis}
            label={{ value: 'FTP (W)', angle: -90, position: 'insideLeft', fill: theme.tokens.chart.tick, fontSize: 11, fontWeight: 700 }}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip
            {...chart.tooltip}
            formatter={(value) => [`${Number(value ?? 0)} W`, 'FTP']}
            labelFormatter={(value) => new Date(String(value ?? '')).toLocaleDateString('pl-PL')}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={theme.tokens.chart.secondary}
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: theme.tokens.chart.secondary, strokeWidth: 0 }}
            activeDot={{ ...CHART_ACTIVE_DOT, stroke: theme.tokens.chart.secondary }}
            name="FTP"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default FtpTrendChart;
