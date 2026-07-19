import { Box, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import ChartContainer from '@/components/common/ChartContainer';
import type { WeightGoal, WeightRecord } from '@/types/weight';
import { CHART_ACTIVE_DOT, getChartVisuals } from '@/utils/chartStyles';

const WEIGHT_GRADIENT_ID = 'weight-history-gradient';

interface WeightChartProps {
  history: WeightRecord[];
  goal: WeightGoal | null;
}

export default function WeightChart({
  history,
  goal,
}: WeightChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const chartData = history.map((record) => ({
    date: record.recordedDate,
    weight: Number(record.weightKg),
  }));

  return (
    <Grid size={12}>
      <ChartContainer
        title="Historia wagi"
        empty={chartData.length === 0}
        emptyTitle="Brak danych o wadze"
        emptyDescription="Dodaj pierwszy pomiar wagi, aby zobaczyć trend zmian."
      >
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={WEIGHT_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.tokens.chart.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={theme.tokens.chart.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chart.grid} />
              <XAxis
                dataKey="date"
                {...chart.axis}
                tickFormatter={(value) =>
                  new Date(String(value)).toLocaleDateString('pl-PL', {
                    month: 'short',
                    day: 'numeric',
                  })}
              />
              <YAxis
                {...chart.axis}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => `${value} kg`}
              />
              <RechartsTooltip
                {...chart.tooltip}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)} kg`, 'Waga']}
                labelFormatter={(value) => new Date(String(value)).toLocaleDateString('pl-PL')}
              />
              {!!goal && (
                <ReferenceLine
                  y={Number(goal.targetWeightKg)}
                  stroke={theme.tokens.chart.primary}
                  strokeDasharray="5 5"
                  label={{
                    value: `Cel: ${Number(goal.targetWeightKg).toFixed(1)} kg`,
                    fill: theme.tokens.chart.primary,
                    fontSize: 11,
                    position: 'right',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke={theme.tokens.chart.secondary}
                strokeWidth={2.5}
                fill={`url(#${WEIGHT_GRADIENT_ID})`}
                dot={{ fill: theme.tokens.chart.secondary, r: 3.5, strokeWidth: 0 }}
                activeDot={{ ...CHART_ACTIVE_DOT, stroke: theme.tokens.chart.secondary }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </ChartContainer>
    </Grid>
  );
}
