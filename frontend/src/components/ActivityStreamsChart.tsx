import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { getChartVisuals } from '../utils/chartStyles';
import { STATUS_COLORS } from '../utils/colors';

interface StreamsChartProps {
  timeStream: number[] | null;
  powerStream: number[] | null;
  heartrateStream: number[] | null;
  cadenceStream: number[] | null;
  altitudeStream: number[] | null;
}

export default function ActivityStreamsChart({
  timeStream,
  powerStream,
  heartrateStream,
  cadenceStream,
  altitudeStream,
}: StreamsChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const data = useMemo(() => {
    const length = timeStream?.length ?? powerStream?.length ?? heartrateStream?.length ?? 0;
    if (length === 0) return [];

    const result = [];
    // Downsample to max 500 points for performance
    const step = Math.max(1, Math.floor(length / 500));
    for (let i = 0; i < length; i += step) {
      result.push({
        time: timeStream?.[i] ?? i,
        power: powerStream?.[i] ?? null,
        hr: heartrateStream?.[i] ?? null,
        cadence: cadenceStream?.[i] ?? null,
        altitude: altitudeStream?.[i] ?? null,
      });
    }
    return result;
  }, [timeStream, powerStream, heartrateStream, cadenceStream, altitudeStream]);

  if (data.length === 0) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const legend: Array<{ label: string; color: string; style: 'solid' | 'dashed' | 'area' }> = [];
  if (powerStream) legend.push({ label: 'Moc (W)', color: theme.tokens?.chart.primary ?? theme.palette.primary.main, style: 'solid' });
  if (heartrateStream) legend.push({ label: 'Tętno (bpm)', color: STATUS_COLORS.error, style: 'solid' });
  if (cadenceStream) legend.push({ label: 'Kadencja (rpm)', color: theme.tokens?.chart.secondary ?? theme.palette.secondary.main, style: 'dashed' });
  if (altitudeStream) legend.push({ label: 'Wysokość (m)', color: theme.tokens?.chart.grid ?? theme.palette.divider, style: 'area' });

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        {legend.map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 22, height: item.style === 'area' ? 8 : 0, borderTop: item.style === 'area' ? 'none' : `3px ${item.style} ${item.color}`, bgcolor: item.style === 'area' ? item.color : undefined, opacity: item.style === 'area' ? 0.55 : 1 }} />
            <Typography variant="caption" color="text.secondary">{item.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ width: '100%', height: 330 }}>
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid {...chart.grid} />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            {...chart.axis}
          />

          {!!altitudeStream && (
            <YAxis
              yAxisId="altitude"
              orientation="right"
              {...chart.axis}
              domain={['dataMin', 'dataMax']}
            />
          )}

          <YAxis yAxisId="main" {...chart.axis} />

          <Tooltip
            {...chart.tooltip}
            labelFormatter={(label) => formatTime(Number(label ?? 0))}
          />

          {!!altitudeStream && (
            <Area
              yAxisId="altitude"
              type="monotone"
              dataKey="altitude"
              stroke="none"
              fill={theme.tokens?.chart.grid ?? theme.palette.divider}
              fillOpacity={0.5}
              name="Altitude (m)"
            />
          )}

          {!!powerStream && (
            <Line
              yAxisId="main"
              type="monotone"
              dataKey="power"
              stroke={theme.tokens?.chart.primary ?? theme.palette.primary.main}
              dot={false}
              strokeWidth={1.5}
              name="Power (W)"
            />
          )}

          {!!heartrateStream && (
            <Line
              yAxisId="main"
              type="monotone"
              dataKey="hr"
              stroke={STATUS_COLORS.error}
              dot={false}
              strokeWidth={1.5}
              name="HR (bpm)"
            />
          )}

          {!!cadenceStream && (
            <Line
              yAxisId="main"
              type="monotone"
              dataKey="cadence"
              stroke={theme.tokens?.chart.secondary ?? theme.palette.secondary.main}
              dot={false}
              strokeWidth={1}
              name="Cadence (rpm)"
            />
          )}
        </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
