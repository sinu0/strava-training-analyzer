import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getLocale } from '@/i18n';
import { tokens } from '@/theme/theme';
import type { SegmentComparison } from '@/types/segments';

import { segmentComponentsMessages } from './messages';
import SegmentRouteMap from './SegmentRouteMap';

interface SegmentComparisonVisualProps { comparison: SegmentComparison }

const colors = tokens.map.series;
const metricUnits = {
  powerW: 'W',
  heartrate: 'bpm',
  speedMs: 'm/s',
  cadence: 'rpm',
  altitudeM: 'm',
} as const;
type Metric = keyof typeof metricUnits;

export default function SegmentComparisonVisual({ comparison }: SegmentComparisonVisualProps) {
  const t = segmentComponentsMessages.useT();
  const metrics = {
    powerW: { label: t('comparison.metrics.powerW'), unit: metricUnits.powerW },
    heartrate: { label: t('comparison.metrics.heartrate'), unit: metricUnits.heartrate },
    speedMs: { label: t('comparison.metrics.speedMs'), unit: metricUnits.speedMs },
    cadence: { label: t('comparison.metrics.cadence'), unit: metricUnits.cadence },
    altitudeM: { label: t('comparison.metrics.altitudeM'), unit: metricUnits.altitudeM },
  } as const;
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
    label: `${new Date(series.startedAt).toLocaleDateString(getLocale())} · ${series.elapsedTimeSec ?? '—'} s`,
    positions: series.points.flatMap(point => point.latitude != null && point.longitude != null
      ? [[point.latitude, point.longitude] as [number, number]] : []),
  }));
  const markers = hoverIndex == null ? [] : comparison.series.flatMap((series, index) => {
    const point = series.points[hoverIndex];
    return point?.latitude != null && point.longitude != null
      ? [{ id: series.effortId, position: [point.latitude, point.longitude] as [number, number], color: colors[index % colors.length] ?? tokens.map.highlight }]
      : [];
  });
  return (
    <Stack spacing={2.5}>
      <SegmentRouteMap routes={routes} markers={markers} height={360} ariaLabel={t('comparison.mapAriaLabel')} />
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>{t('comparison.elevationTitle')}</Typography>
        <Box sx={{ height: 200 }} aria-label={t('comparison.elevationChartAriaLabel')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} onMouseMove={state => { const index = Number(state.activeTooltipIndex); setHoverIndex(Number.isFinite(index) ? index : null); }} onMouseLeave={() => setHoverIndex(null)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="distanceM" unit=" m" /><YAxis unit=" m" domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip />
              {comparison.series.map((series, index) => <Line key={series.effortId} type="monotone" dataKey={`${series.effortId}:altitude`} name={new Date(series.startedAt).toLocaleDateString(getLocale())} stroke={colors[index]} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>{t('comparison.timeDeltaTitle')}</Typography>
        <Box sx={{ height: 210 }} aria-label={t('comparison.timeDeltaChartAriaLabel')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} onMouseMove={state => { const index = Number(state.activeTooltipIndex); setHoverIndex(Number.isFinite(index) ? index : null); }} onMouseLeave={() => setHoverIndex(null)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="distanceM" unit=" m" /><YAxis unit=" s" />
              <Tooltip />
              {comparison.series.map((series, index) => <Line key={series.effortId} type="monotone" dataKey={`${series.effortId}:delta`} name={new Date(series.startedAt).toLocaleDateString(getLocale())} stroke={colors[index]} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box>
        <FormControl size="small" sx={{ minWidth: 180, mb: 1 }}>
          <InputLabel id="comparison-metric-label">{t('comparison.metricSelectLabel')}</InputLabel>
          <Select labelId="comparison-metric-label" label={t('comparison.metricSelectLabel')} value={metric} onChange={event => setMetric(event.target.value as Metric)}>
            {Object.entries(metrics).map(([value, item]) => <MenuItem key={value} value={value}>{item.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ height: 250 }} aria-label={t('comparison.metricChartAriaLabel', { label: metrics[metric].label })}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} onMouseMove={state => { const index = Number(state.activeTooltipIndex); setHoverIndex(Number.isFinite(index) ? index : null); }} onMouseLeave={() => setHoverIndex(null)}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="distanceM" unit=" m" /><YAxis unit={` ${metrics[metric].unit}`} />
              <Tooltip />
              {comparison.series.map((series, index) => <Line key={series.effortId} type="monotone" dataKey={`${series.effortId}:metric`} name={new Date(series.startedAt).toLocaleDateString(getLocale())} stroke={colors[index]} dot={false} connectNulls />)}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Stack>
  );
}
