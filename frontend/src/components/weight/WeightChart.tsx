import { Box, Grid } from '@mui/material';
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
import {
  CHART_ACTIVE_DOT,
  CHART_TICK,
  CHART_TOOLTIP_CONTENT_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
} from '@/utils/chartStyles';
import { CHART_COLORS } from '@/utils/colors';

const WEIGHT_GRADIENT_ID = 'weight-history-gradient';

interface WeightChartProps {
  history: WeightRecord[];
  goal: WeightGoal | null;
}

export default function WeightChart({
  history,
  goal,
}: WeightChartProps) {
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
                  <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="date"
                tick={CHART_TICK}
                tickFormatter={(value) =>
                  new Date(String(value)).toLocaleDateString('pl-PL', {
                    month: 'short',
                    day: 'numeric',
                  })}
              />
              <YAxis
                tick={CHART_TICK}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => `${value} kg`}
              />
              <RechartsTooltip
                contentStyle={CHART_TOOLTIP_CONTENT_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)} kg`, 'Waga']}
                labelFormatter={(value) => new Date(String(value)).toLocaleDateString('pl-PL')}
              />
              {!!goal && (
                <ReferenceLine
                  y={Number(goal.targetWeightKg)}
                  stroke={CHART_COLORS.primary}
                  strokeDasharray="5 5"
                  label={{
                    value: `Cel: ${Number(goal.targetWeightKg).toFixed(1)} kg`,
                    fill: CHART_COLORS.primary,
                    fontSize: 11,
                    position: 'right',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke={CHART_COLORS.secondary}
                strokeWidth={2.5}
                fill={`url(#${WEIGHT_GRADIENT_ID})`}
                dot={{ fill: CHART_COLORS.secondary, r: 3, strokeWidth: 0 }}
                activeDot={{ ...CHART_ACTIVE_DOT, stroke: CHART_COLORS.secondary }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </ChartContainer>
    </Grid>
  );
}
