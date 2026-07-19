import { Box, Typography, Stack } from '@mui/material';
import { memo, useMemo } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { CHART_COLORS, LOAD_COLORS, alphaColor } from '@/utils/colors';
import { getLoadStatusColor } from '@/utils/statusColors';

import type { DailyOptimalLoad } from '../types/analytics';

interface Props {
  data: DailyOptimalLoad[];
  compact?: boolean;
}

function formatDateTick(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

/**
 * Maps raw backend data to chart-ready format.
 * Key behaviour: optimalMin/Max are carried forward through rest days (where backend returns 0)
 * so that the band and boundary lines are continuous.
 * Past and future days use separate band series so they can be coloured differently.
 */
export function mapDailyOptimalLoadChartData(data: DailyOptimalLoad[]) {
  let lastOptMin = 0;
  let lastOptMax = 0;
  let lastDanger = 0;

  return data.map((d) => {
    const rawOptMin = d.optimalMin > 0 ? Math.round(d.optimalMin) : 0;
    const rawOptMax = d.optimalMax > 0 ? Math.round(d.optimalMax) : 0;
    const rawDanger = d.dangerThreshold > 0 ? Math.round(d.dangerThreshold) : 0;

    // Carry forward — keeps lines/bands visible on rest days
    const optMin = rawOptMin || lastOptMin;
    const optMax = rawOptMax || lastOptMax;
    const danger = rawDanger || lastDanger;

    if (rawOptMin > 0) lastOptMin = rawOptMin;
    if (rawOptMax > 0) lastOptMax = rawOptMax;
    if (rawDanger > 0) lastDanger = rawDanger;

    const bandBase = optMin > 0 ? optMin : undefined;
    const bandWidth = optMax > optMin ? optMax - optMin : undefined;

    return {
      date: d.date,
      // Bars
      tss: !d.future && d.actualTss != null && d.actualTss > 0
        ? Math.round(d.actualTss) : undefined,
      projectedTss: d.future && d.projectedTss != null
        ? Math.round(d.projectedTss) : undefined,
      // Green band = past days; blue band = future days
      pastBandBase: !d.future ? bandBase : undefined,
      pastBandWidth: !d.future ? bandWidth : undefined,
      futureBandBase: d.future ? bandBase : undefined,
      futureBandWidth: d.future ? bandWidth : undefined,
      // Continuous boundary lines (carry-forward ensures no gaps)
      optimalMin: optMin || undefined,
      optimalMax: optMax || undefined,
      dangerLine: danger || undefined,
      ctl: d.ctl > 0 ? Math.round(d.ctl) : undefined,
      barColor: d.future
        ? LOAD_COLORS.FUTURE
        : getLoadStatusColor(d.status),
      barOpacity: d.future ? 0.45 : 0.88,
      status: d.status,
      future: d.future,
    };
  });
}

const DailyOptimalLoadChart = memo(function DailyOptimalLoadChart({
  data,
  compact = false,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const chartData = useMemo(() => mapDailyOptimalLoadChartData(data), [data]);

  if (!chartData.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych dziennego obciążenia.
      </Typography>
    );
  }

  // Show a tick every 7 data points for readability
  const tickInterval = compact
    ? Math.ceil(data.length / 6)
    : Math.max(6, Math.ceil(data.length / 12));

  return (
    <Box>
      {/* Legend */}
      {!compact && (
        <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 1.5 }}>
          {[
            { color: LOAD_COLORS.OPTIMAL, label: 'Optymalny' },
            { color: LOAD_COLORS.UNDER, label: 'Zbyt mało' },
            { color: LOAD_COLORS.OVER, label: 'Przekroczone' },
            { color: LOAD_COLORS.DANGER, label: 'Ryzyko kontuzji' },
            { color: LOAD_COLORS.INSUFFICIENT, label: 'Brak danych' },
          ].map(({ color, label }) => (
            <Stack key={label} direction="row" alignItems="center" spacing={0.5}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" sx={{ color: CHART_COLORS.tickText, fontSize: 11 }}>
                {label}
              </Typography>
            </Stack>
          ))}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: LOAD_COLORS.FUTURE, opacity: 0.6 }} />
            <Typography variant="caption" sx={{ color: CHART_COLORS.tickText, fontSize: 11 }}>
              Projekcja (21 dni)
            </Typography>
          </Stack>
        </Stack>
      )}

      {!compact && (
        <Stack direction="row" spacing={3} sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 20, height: 2, bgcolor: LOAD_COLORS.UNDER, borderRadius: 1 }} />
            <Typography variant="caption" sx={{ color: CHART_COLORS.tickText, fontSize: 11 }}>Min optymalny</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 20, height: 2, bgcolor: LOAD_COLORS.OPTIMAL, borderRadius: 1 }} />
            <Typography variant="caption" sx={{ color: CHART_COLORS.tickText, fontSize: 11 }}>Max optymalny</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 20, height: 2, bgcolor: LOAD_COLORS.CTL, borderRadius: 1 }} />
            <Typography variant="caption" sx={{ color: CHART_COLORS.tickText, fontSize: 11 }}>CTL (forma)</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 20, height: 2, bgcolor: LOAD_COLORS.DANGER, style: { borderStyle: 'dashed' } } as never} />
            <Typography variant="caption" sx={{ color: CHART_COLORS.tickText, fontSize: 11 }}>Próg ryzyka</Typography>
          </Stack>
        </Stack>
      )}

      <Box sx={{ width: '100%', height: compact ? 200 : 480 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: compact ? 16 : 70, left: compact ? -18 : 0, bottom: compact ? 0 : 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.surface} />
            <XAxis
              dataKey="date"
              stroke={CHART_COLORS.grid}
              tick={{ fill: CHART_COLORS.tickText, fontSize: compact ? 9 : 11 }}
              interval={tickInterval - 1}
              tickFormatter={formatDateTick}
            />
            <YAxis
              stroke={CHART_COLORS.grid}
              tick={{ fill: CHART_COLORS.tickText, fontSize: compact ? 9 : 11 }}
              width={compact ? 28 : 44}
            />
            <Tooltip
              contentStyle={{ backgroundColor: CHART_COLORS.tooltip, border: `1px solid ${CHART_COLORS.grid}`, borderRadius: 8 }}
              labelStyle={{ color: CHART_COLORS.tooltipText, fontWeight: 600 }}
              itemStyle={{ color: CHART_COLORS.tickText, fontSize: 12 }}
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  tss: 'TSS dzienny',
                  projectedTss: 'Projekcja TSS',
                  optimalMin: 'Min. optymalny',
                  optimalMax: 'Max. optymalny',
                  dangerLine: 'Próg ryzyka',
                  ctl: 'CTL (forma)',
                };
                const seriesName = String(name ?? '');
                return [Number(value ?? 0), labels[seriesName] ?? seriesName];
              }}
              labelFormatter={(label) => {
                const d = new Date(`${String(label ?? '')}T00:00:00`);
                return d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' });
              }}
            />

            {/* ── Green band: historical optimal zone ── */}
            <Area
              type="monotone"
              dataKey="pastBandBase"
              stackId="pastBand"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="pastBandWidth"
              stackId="pastBand"
              stroke="none"
              fill={alphaColor(LOAD_COLORS.OPTIMAL, 0.13)}
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />

            {/* ── Blue band: future projection zone ── */}
            <Area
              type="monotone"
              dataKey="futureBandBase"
              stackId="futureBand"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="futureBandWidth"
              stackId="futureBand"
              stroke="none"
              fill={alphaColor(LOAD_COLORS.FUTURE, 0.1)}
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
            />

            {/* ── Actual TSS bars (past) ── */}
            <Bar dataKey="tss" name="tss" isAnimationActive={false} radius={[2, 2, 0, 0]} maxBarSize={compact ? 8 : 14}>
              {chartData.map((entry) => (
                <Cell key={entry.date} fill={entry.barColor} fillOpacity={entry.barOpacity} />
              ))}
            </Bar>

            {/* ── Projected TSS bars (future) ── */}
            <Bar dataKey="projectedTss" name="projectedTss" isAnimationActive={false} radius={[2, 2, 0, 0]} maxBarSize={compact ? 8 : 14}>
              {chartData.map((entry) => (
                <Cell key={`${entry.date}-p`} fill={LOAD_COLORS.FUTURE} fillOpacity={0.35} />
              ))}
            </Bar>

            {/* ── Continuous boundary lines ── */}
            <Line
              type="monotone"
              dataKey="optimalMin"
              stroke={LOAD_COLORS.UNDER}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name="optimalMin"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="optimalMax"
              stroke={LOAD_COLORS.OPTIMAL}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              name="optimalMax"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="dangerLine"
              stroke={LOAD_COLORS.DANGER}
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name="dangerLine"
              connectNulls
            />

            {/* ── CTL (chronic fitness) ── */}
            {!compact && (
              <Line
                type="monotone"
                dataKey="ctl"
                stroke={LOAD_COLORS.CTL}
                strokeWidth={2}
                dot={false}
                name="ctl"
                connectNulls
              />
            )}

            {/* ── Today marker ── */}
            <ReferenceLine
              x={todayStr}
              stroke={LOAD_COLORS.FUTURE}
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{ value: 'Dziś', fill: LOAD_COLORS.FUTURE, fontSize: 11, position: 'insideTopLeft' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {!compact && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', lineHeight: 1.6 }}>
          Zakres optymalny (0.8–1.3 × CTL) obliczany codziennie na podstawie bieżącej formy (CTL).
          Im dłuższa przerwa, tym niższe CTL i tym niższy bezpieczny poziom TSS po powrocie.
          Im wyższa forma, tym więcej możesz bezpiecznie trenować.
          Zielony obszar = historia wg rytmu treningów · Niebieski obszar = projekcja 21 dni wg rytmu trening/odpoczynek.
        </Typography>
      )}
    </Box>
  );
});

export default DailyOptimalLoadChart;
