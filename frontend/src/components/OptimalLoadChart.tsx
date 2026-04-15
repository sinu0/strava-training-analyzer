import { Box, Typography, Stack } from '@mui/material';
import { memo, useMemo } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { getLoadStatusColor } from '@/utils/statusColors';

import { CHART_COLORS, LOAD_COLORS, alphaColor } from '../utils/colors';

import type { WeeklyOptimalLoad } from '../types/analytics';

interface OptimalLoadChartProps {
  data: WeeklyOptimalLoad[];
  compact?: boolean;
}

/** Returns the Monday of the current ISO week (YYYY-MM-DD) */
function currentWeekMonday(): string {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon=0
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow);
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}

/** How many days have elapsed so far in the current ISO week (1 on Monday, 7 on Sunday) */
function elapsedDaysInCurrentWeek(): number {
  return Math.max(1, ((new Date().getDay() + 6) % 7) + 1);
}

function TssDot({
  cx,
  cy,
  payload,
  compact,
}: {
  cx?: number;
  cy?: number;
  payload?: { fill?: string; isCurrentWeek?: boolean };
  compact: boolean;
}) {
  if (cx == null || cy == null) return null;
  const r = compact ? 5 : 7;
  if (payload?.isCurrentWeek) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={payload?.fill ?? CHART_COLORS.primary}
        strokeWidth={2.5}
        strokeDasharray="3 2"
      />
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={payload?.fill ?? CHART_COLORS.primary}
      stroke={CHART_COLORS.tooltip}
      strokeWidth={2}
    />
  );
}

function renderTssDot(props: unknown, compact: boolean) {
  const p = (props ?? {}) as { key?: string; cx?: number; cy?: number; payload?: { fill?: string; isCurrentWeek?: boolean } };
  const { key, ...rest } = p;
  return <TssDot key={key} {...rest} compact={compact} />;
}

const OptimalLoadChart = memo(function OptimalLoadChart({
  data,
  compact = false,
}: OptimalLoadChartProps) {
  const currentMonday = currentWeekMonday();
  const elapsed = elapsedDaysInCurrentWeek();

  const chartData = useMemo(
    () =>
      data.map((w) => {
        const wStart = w.weekStart.slice(0, 10);
        const isCurrent = wStart === currentMonday;
        // Pro-rate the optimal band for the current (incomplete) week
        const scale = isCurrent ? elapsed / 7 : 1;
        const optMin = w.optimalMin > 0 ? Math.round(w.optimalMin * scale) : null;
        const optMax = w.optimalMax > 0 ? Math.round(w.optimalMax * scale) : null;
        const bandBase = optMin ?? undefined;
        const bandWidth = (optMax != null && optMin != null && optMax > optMin)
          ? optMax - optMin : undefined;

        return {
          week: new Date(wStart).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
          tss: Math.round(w.actualTss),
          optimalMin: optMin ?? undefined,
          optimalMax: optMax ?? undefined,
          optimalBase: bandBase,
          optimalBand: bandWidth,
          dangerThreshold: w.dangerThreshold > 0 ? Math.round(w.dangerThreshold * scale) : undefined,
          status: isCurrent ? 'CURRENT' : w.status,
          fill: isCurrent ? LOAD_COLORS.FUTURE : getLoadStatusColor(w.status),
          isCurrentWeek: isCurrent,
        };
      }),
    [data, currentMonday, elapsed],
  );

  if (!chartData.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych tygodniowego obciążenia.
      </Typography>
    );
  }

  const lastDanger = [...chartData].reverse().find((d) => (d.dangerThreshold ?? 0) > 0);

  return (
    <Box>
      {!compact && (
        <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 1 }}>
          {[
            { color: LOAD_COLORS.OPTIMAL, label: 'Optymalny' },
            { color: LOAD_COLORS.UNDER, label: 'Zbyt mało' },
            { color: LOAD_COLORS.OVER, label: 'Przekroczone' },
            { color: LOAD_COLORS.DANGER, label: 'Ryzyko kontuzji' },
            { color: LOAD_COLORS.FUTURE, label: 'Tydzień w toku', hollow: true },
          ].map(({ color, label, hollow }) => (
            <Stack key={label} direction="row" alignItems="center" spacing={0.5}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: hollow ? 'transparent' : color,
                  border: hollow ? `2px dashed ${color}` : 'none',
                }}
              />
              <Typography variant="caption" sx={{ color: CHART_COLORS.tickText, fontSize: 11 }}>{label}</Typography>
            </Stack>
          ))}
        </Stack>
      )}

      <Box sx={{ width: '100%', height: compact ? 200 : 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: compact ? 50 : 60, left: compact ? -15 : 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surface} />
            <XAxis dataKey="week" stroke={CHART_COLORS.grid} tick={{ fill: CHART_COLORS.tickText, fontSize: compact ? 10 : 12 }} />
            <YAxis stroke={CHART_COLORS.grid} tick={{ fill: CHART_COLORS.tickText, fontSize: compact ? 10 : 12 }} width={compact ? 28 : 44} />
            <Tooltip
              contentStyle={{ backgroundColor: CHART_COLORS.tooltip, border: `1px solid ${CHART_COLORS.grid}`, borderRadius: 8 }}
              labelStyle={{ color: CHART_COLORS.tooltipText }}
              itemStyle={{ color: CHART_COLORS.tickText, fontSize: 12 }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  tss: 'TSS tygodniowy',
                  optimalMin: 'Min. optymalny',
                  optimalMax: 'Max. optymalny',
                };
                return [value, labels[name] ?? name];
              }}
            />

            {/* Optimal zone band */}
            <Area
              type="monotone"
              dataKey="optimalBase"
              stackId="optimalRange"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="optimalBand"
              stackId="optimalRange"
              stroke="none"
              fill={alphaColor(LOAD_COLORS.OPTIMAL, 0.14)}
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />

            {/* TSS dots */}
            <Line
              type="monotone"
              dataKey="tss"
              stroke="transparent"
              strokeWidth={0}
              dot={(props: unknown) => renderTssDot(props, compact)}
              activeDot={(props: unknown) => renderTssDot(props, compact)}
              name="tss"
            />

            {/* Optimal boundary lines */}
            <Line
              type="monotone"
              dataKey="optimalMin"
              stroke={LOAD_COLORS.UNDER}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="optimalMin"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="optimalMax"
              stroke={LOAD_COLORS.OPTIMAL}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name="optimalMax"
              connectNulls
            />

            {/* Danger threshold */}
            {!!lastDanger && (
              <ReferenceLine
                y={lastDanger.dangerThreshold}
                stroke={LOAD_COLORS.DANGER}
                strokeDasharray="4 4"
                label={{ value: 'Próg ryzyka', fill: LOAD_COLORS.DANGER, fontSize: 11, position: 'right' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {!compact && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', lineHeight: 1.6 }}>
          Optymalny zakres (0.8–1.3 × CTL × 7) wg modelu ACWR/Banister.
          Bieżący tydzień (koło przerywane) wyświetla zakres proporcjonalny do liczby minionych dni.
        </Typography>
      )}
    </Box>
  );
});

export default OptimalLoadChart;
