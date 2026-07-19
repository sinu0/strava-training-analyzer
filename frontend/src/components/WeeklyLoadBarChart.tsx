import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

import { getChartVisuals } from '../utils/chartStyles';
import { LOAD_COLORS, STATUS_COLORS } from '../utils/colors';

import type { WeeklySummary, WeeklyOptimalLoad } from '../types/analytics';

interface WeeklyLoadBarChartProps {
  data: WeeklySummary[] | undefined;
  optimalLoad?: WeeklyOptimalLoad[] | undefined;
}

export default function WeeklyLoadBarChart({ data, optimalLoad }: WeeklyLoadBarChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  if (!data?.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        Brak danych tygodniowych.
      </Typography>
    );
  }

  const chartData = data.map((w) => ({
    week: new Date(w.weekStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
    TSS: Math.round(w.totalTss),
    activities: w.activityCount,
    hours: Math.round(w.totalTimeSec / 3600 * 10) / 10,
  }));

  const avgTss = Math.round(chartData.reduce((sum, w) => sum + w.TSS, 0) / chartData.length);
  const latestOptimal = optimalLoad?.[optimalLoad.length - 1];
  const optMin = latestOptimal?.optimalMin;
  const optMax = latestOptimal?.optimalMax;
  const optTarget = latestOptimal?.optimalTarget;

  return (
    <Box sx={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 72, left: -10, bottom: 0 }}>
            <CartesianGrid {...chart.grid} />
            <XAxis dataKey="week" {...chart.axis} />
            <YAxis {...chart.axis} />
          <Tooltip
            {...chart.tooltip}
            formatter={(value, name) => {
              const seriesName = String(name ?? '');
              const numericValue = Number(value ?? 0);
              if (seriesName === 'TSS') return [`${numericValue}`, 'TSS'];
              return [numericValue, seriesName];
            }}
          />
          {optMin != null && optMax != null && (
            <ReferenceArea y1={optMin} y2={optMax} fill={LOAD_COLORS.OPTIMAL} fillOpacity={0.12} stroke="none" />
          )}
          {optTarget != null && (
            <ReferenceLine
              y={optTarget}
              stroke={LOAD_COLORS.OPTIMAL}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{ value: `Cel ${optTarget}`, fill: LOAD_COLORS.OPTIMAL, fontSize: 11, position: 'right' }}
            />
          )}
          <ReferenceLine
            y={avgTss}
            strokeDasharray="3 3"
            stroke={STATUS_COLORS.warning}
            label={{
              value: `Śr. ${avgTss}`,
              fill: STATUS_COLORS.warning,
              fontSize: 11,
              position: 'right',
            }}
          />
          <Bar
            dataKey="TSS"
            fill={theme.tokens.chart.primary}
            radius={chart.barRadius}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
