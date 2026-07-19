import { Box } from '@mui/material';
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

import { CHART_COLORS, STATUS_COLORS } from '../utils/colors';

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

  return (
    <Box sx={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke={CHART_COLORS.tickText}
            tick={{ fontSize: 11 }}
          />

          {!!altitudeStream && (
            <YAxis
              yAxisId="altitude"
              orientation="right"
              stroke={CHART_COLORS.tickText}
              tick={{ fontSize: 11 }}
              domain={['dataMin', 'dataMax']}
            />
          )}

          <YAxis yAxisId="main" stroke={CHART_COLORS.tickText} tick={{ fontSize: 11 }} />

          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltip,
              border: `1px solid ${CHART_COLORS.grid}`,
              borderRadius: 8,
            }}
            labelFormatter={(label) => formatTime(Number(label ?? 0))}
          />

          {!!altitudeStream && (
            <Area
              yAxisId="altitude"
              type="monotone"
              dataKey="altitude"
              stroke="none"
              fill={CHART_COLORS.grid}
              fillOpacity={0.5}
              name="Altitude (m)"
            />
          )}

          {!!powerStream && (
            <Line
              yAxisId="main"
              type="monotone"
              dataKey="power"
              stroke={CHART_COLORS.primary}
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
              stroke={CHART_COLORS.secondary}
              dot={false}
              strokeWidth={1}
              name="Cadence (rpm)"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
