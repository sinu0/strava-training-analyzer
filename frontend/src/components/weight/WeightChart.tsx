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

import { weightMessages } from '@/components/weight/messages';
import { getLocale } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';
import type { WeightGoal, WeightRecord } from '@/types/weight';
import { ChartFrame } from '@/ui';
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
  const t = weightMessages.useT();
  const chart = getChartVisuals(theme);
  const chartData = history.map((record) => ({
    date: record.recordedDate,
    weight: Number(record.weightKg),
  }));

  return (
    <Grid size={12}>
      <ChartFrame
        title={t('chart.title')}
        empty={chartData.length === 0}
        emptyTitle={t('chart.emptyTitle')}
        emptyDescription={t('chart.emptyDescription')}
      >
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={WEIGHT_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getAppThemeTokens(theme).chart.secondary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={getAppThemeTokens(theme).chart.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chart.grid} />
              <XAxis
                dataKey="date"
                {...chart.axis}
                tickFormatter={(value) =>
                  new Date(String(value)).toLocaleDateString(getLocale(), {
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
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)} kg`, t('chart.tooltipLabel')]}
                labelFormatter={(value) => new Date(String(value)).toLocaleDateString(getLocale())}
              />
              {!!goal && (
                <ReferenceLine
                  y={Number(goal.targetWeightKg)}
                  stroke={getAppThemeTokens(theme).chart.primary}
                  strokeDasharray="5 5"
                  label={{
                    value: t('chart.goalLabel', { weight: Number(goal.targetWeightKg).toFixed(1) }),
                    fill: getAppThemeTokens(theme).chart.primary,
                    fontSize: 11,
                    position: 'right',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke={getAppThemeTokens(theme).chart.secondary}
                strokeWidth={2.5}
                fill={`url(#${WEIGHT_GRADIENT_ID})`}
                dot={{ fill: getAppThemeTokens(theme).chart.secondary, r: 3.5, strokeWidth: 0 }}
                activeDot={{ ...CHART_ACTIVE_DOT, stroke: getAppThemeTokens(theme).chart.secondary }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </ChartFrame>
    </Grid>
  );
}
