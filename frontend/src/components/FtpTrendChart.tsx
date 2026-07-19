import { Box, Typography } from '@mui/material';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import { CHART_ACTIVE_DOT, CHART_TICK, CHART_TOOLTIP_CONTENT_STYLE, CHART_TOOLTIP_ITEM_STYLE, CHART_TOOLTIP_LABEL_STYLE } from '../utils/chartStyles';
import { CHART_COLORS } from '../utils/colors';

import type { TrendPoint } from '../types/analytics';

interface FtpTrendChartProps {
  data: TrendPoint[];
}

const FtpTrendChart = memo(function FtpTrendChart({
  data,
}: FtpTrendChartProps) {
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
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            stroke={CHART_COLORS.grid}
            tick={CHART_TICK}
            tickFormatter={(v) => new Date(v).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
          />
          <YAxis
            stroke={CHART_COLORS.grid}
            tick={CHART_TICK}
            label={{ value: 'FTP (W)', angle: -90, position: 'insideLeft', fill: CHART_COLORS.tickText }}
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            itemStyle={CHART_TOOLTIP_ITEM_STYLE}
            formatter={(value) => [`${Number(value ?? 0)} W`, 'FTP']}
            labelFormatter={(value) => new Date(String(value ?? '')).toLocaleDateString('pl-PL')}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS.secondary}
            strokeWidth={2.5}
            dot={{ r: 3, fill: CHART_COLORS.secondary }}
            activeDot={{ ...CHART_ACTIVE_DOT, stroke: CHART_COLORS.secondary }}
            name="FTP"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default FtpTrendChart;
