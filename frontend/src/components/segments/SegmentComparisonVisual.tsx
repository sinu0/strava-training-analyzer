import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { SegmentComparison } from '@/types/segments';

import SegmentRouteMap from './SegmentRouteMap';

interface SegmentComparisonVisualProps { comparison: SegmentComparison }

const colors = ['#ff6b35', '#31c4f3', '#8b5cf6'];
const metrics = {
  powerW: { label: 'Moc', unit: 'W' },
  heartrate: { label: 'Tętno', unit: 'bpm' },
  speedMs: { label: 'Prędkość', unit: 'm/s' },
  cadence: { label: 'Kadencja', unit: 'rpm' },
  altitudeM: { label: 'Wysokość', unit: 'm' },
} as const;
type Metric = keyof typeof metrics;

export default function SegmentComparisonVisual({ comparison }: SegmentComparisonVisualProps) {
  const [metric, setMetric] = useState<Metric>('powerW');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chart = useMemo(() => Array.from({ length: 101 }, (_, index) => {
    const row: Record<string, number | null> = { distanceM: comparison.series[0]?.points[index]?.distanceM ?? 0 };
    comparison.series.forEach(series => {
      const point = series.points[index];
      row[`${series.effortId}:delta`] = point?.timeDeltaSec ?? null;
      row[`${series.effortId}:metric`] = point?.[metric] ?? null;
      row[`${series.effortId}:altitude`] = point?.altitudeM ?? null;
    });
    return row;
  }), [comparison, metric]);
  const routes = comparison.series.map(series => ({
    id: series.effortId,
    label: `${new Date(series.startedAt).toLocaleDateString('pl-PL')} · ${series.elapsedTimeSec ?? '—'} s`,
    positions: series.points.flatMap(point => point.latitude != null && point.longitude != null
      ? [[point.latitude, point.longitude] as [number, number]] : []),
  }));
  const markers = hoverIndex == null ? [] : comparison.series.flatMap((series, index) => {
    const point = series.points[hoverIndex];
    return point?.latitude != null && point.longitude != null
      ? [{ id: series.effortId, position: [point.latitude, point.longitude] as [number, number], color: colors[index] ?? '#ff6b35' }]
      : [];
  });
  return (
    <Stack spacing={2.5}>
      <SegmentRouteMap routes={routes} markers={markers} height={360} ariaLabel="Mapa porównywanych prób segmentu" />
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Profil wysokości</Typography>
        <Box sx={{ height: 200 }} aria-label="Profil wysokości segmentu wyrównany po dystansie">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} onMouseMove={state => { const index = Number(state.activeTooltipIndex); setHoverIndex(Number.isFinite(index) ? index : null); }} onMouseLeave={() => setHoverIndex(null)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="distanceM" unit=" m" /><YAxis unit=" m" domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip />
              {comparison.series.map((series, index) => <Line key={series.effortId} type="monotone" dataKey={`${series.effortId}:altitude`} name={new Date(series.startedAt).toLocaleDateString('pl-PL')} stroke={colors[index]} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Różnica czasu do próby odniesienia</Typography>
        <Box sx={{ height: 210 }} aria-label="Wykres różnicy czasu wyrównany po dystansie">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} onMouseMove={state => { const index = Number(state.activeTooltipIndex); setHoverIndex(Number.isFinite(index) ? index : null); }} onMouseLeave={() => setHoverIndex(null)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="distanceM" unit=" m" /><YAxis unit=" s" />
              <Tooltip />
              {comparison.series.map((series, index) => <Line key={series.effortId} type="monotone" dataKey={`${series.effortId}:delta`} name={new Date(series.startedAt).toLocaleDateString('pl-PL')} stroke={colors[index]} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box>
        <FormControl size="small" sx={{ minWidth: 180, mb: 1 }}>
          <InputLabel id="comparison-metric-label">Metryka</InputLabel>
          <Select labelId="comparison-metric-label" label="Metryka" value={metric} onChange={event => setMetric(event.target.value as Metric)}>
            {Object.entries(metrics).map(([value, item]) => <MenuItem key={value} value={value}>{item.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ height: 250 }} aria-label={`Wykres: ${metrics[metric].label}, wyrównany po dystansie`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} onMouseMove={state => { const index = Number(state.activeTooltipIndex); setHoverIndex(Number.isFinite(index) ? index : null); }} onMouseLeave={() => setHoverIndex(null)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="distanceM" unit=" m" /><YAxis unit={` ${metrics[metric].unit}`} />
              <Tooltip />
              {comparison.series.map((series, index) => <Line key={series.effortId} type="monotone" dataKey={`${series.effortId}:metric`} name={new Date(series.startedAt).toLocaleDateString('pl-PL')} stroke={colors[index]} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Stack>
  );
}
