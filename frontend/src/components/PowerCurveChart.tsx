import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

import { CHART_ACTIVE_DOT, getChartVisuals } from '../utils/chartStyles';

import type { PowerCurve as PowerCurveType } from '../types/analytics';

export interface PowerCurveComparisonSeries {
  key: string;
  label: string;
  data: PowerCurveType | undefined;
  color: string;
  dashed?: boolean;
}

interface PowerCurveProps {
  data: PowerCurveType | undefined;
  comparisonSeries?: PowerCurveComparisonSeries[];
}

const DURATION_LABELS: Record<number, string> = {
  1: '1s',
  5: '5s',
  10: '10s',
  30: '30s',
  60: '1min',
  120: '2min',
  300: '5min',
  600: '10min',
  1200: '20min',
  1800: '30min',
  3600: '60min',
  5400: '90min',
  7200: '120min',
};

const PowerCurveChart = memo(function PowerCurveChart({
  data,
  comparisonSeries = [],
}: PowerCurveProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const series = useMemo(
    () => [
      { key: 'current', label: 'Aktualny zakres', data, color: theme.tokens.chart.primary, dashed: false },
      ...comparisonSeries.filter((item) => item.data?.efforts && Object.keys(item.data.efforts).length > 0),
    ],
    [comparisonSeries, data, theme.tokens.chart.primary],
  );

  const chartData = useMemo(() => {
    const durations = new Set<number>();

    series.forEach((item) => {
      Object.keys(item.data?.efforts ?? {}).forEach((sec) => durations.add(Number(sec)));
    });

    return Array.from(durations)
      .sort((a, b) => a - b)
      .map((seconds) => {
        const row: Record<string, string | number | null> = {
          seconds,
          label: DURATION_LABELS[seconds] ?? `${seconds}s`,
        };

        series.forEach((item) => {
          row[item.key] = item.data?.efforts?.[seconds] != null
            ? Math.round(item.data.efforts[seconds])
            : null;
        });

        return row;
      });
  }, [series]);
  const tickValues = useMemo(
    () => chartData.map((point) => Number(point.seconds)).filter((value) => !Number.isNaN(value)),
    [chartData],
  );

  if (!chartData.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych krzywej mocy.
      </Typography>
    );
  }

  const currentValues = chartData
    .map((point) => Number(point.current))
    .filter(Number.isFinite);
  const peakPower = currentValues.length ? Math.max(...currentValues) : null;

  return (
    <Box
      role="img"
      aria-label={`Krzywa mocy. ${chartData.length} punkty pomiarowe.${peakPower != null ? ` Najwyższa wartość aktualnego zakresu: ${peakPower} W.` : ''}`}
      sx={{ width: '100%', height: 400 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid {...chart.grid} />
          <XAxis
            dataKey="seconds"
            scale="log"
            domain={['dataMin', 'dataMax']}
            type="number"
             tickFormatter={(v) => DURATION_LABELS[v] ?? `${v}s`}
             ticks={tickValues}
             {...chart.axis}
             angle={-45}
             textAnchor="end"
            height={60}
          />
           <YAxis
             {...chart.axis}
             label={{ value: 'Moc (W)', angle: -90, position: 'insideLeft', fill: theme.tokens.chart.tick, fontSize: 11, fontWeight: 700 }}
           />
           <Tooltip
             {...chart.tooltip}
             formatter={(value, name) => {
               const seriesName = String(name ?? '');
               return [`${Number(value ?? 0)} W`, series.find((item) => item.key === seriesName)?.label ?? seriesName];
             }}
             labelFormatter={(value) => {
               const seconds = Number(value ?? 0);
               return DURATION_LABELS[seconds] ?? `${seconds}s`;
             }}
           />
           <Legend
             {...chart.legend}
             formatter={(value: string) => series.find((item) => item.key === value)?.label ?? value}
           />
          {series.map((item) => (
            <Line
              key={item.key}
              type="linear"
              dataKey={item.key}
              stroke={item.color}
              strokeWidth={item.key === 'current' ? 2.75 : 2.25}
              dot={item.key === 'current' ? { ...CHART_ACTIVE_DOT, fill: item.color, stroke: item.color } : false}
              strokeDasharray={item.dashed ? '6 4' : undefined}
              connectNulls
              name={item.key}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default PowerCurveChart;
