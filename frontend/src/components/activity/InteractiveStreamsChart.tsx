import { Box, Typography, Chip, Stack } from '@mui/material';
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
  ReferenceArea,
} from 'recharts';

import type {
  BrushRange,
  SelectionStats,
  StreamDataPoint,
} from '@/components/activity/interactiveStreams.types';
import { useChartInteraction } from '@/components/activity/useChartInteraction';
import { getChartVisuals } from '@/utils/chartStyles';
import { CHART_COLORS, STATUS_COLORS, alphaColor } from '@/utils/colors';
import { formatDuration } from '@/utils/formatters';

export type { BrushRange, SelectionStats, StreamDataPoint } from '@/components/activity/interactiveStreams.types';

interface InteractiveStreamsChartProps {
  timeStream: number[] | null;
  powerStream: number[] | null;
  heartrateStream: number[] | null;
  cadenceStream: number[] | null;
  altitudeStream: number[] | null;
  velocityStream: number[] | null;
  distanceStream: number[] | null;
  onHoverIndex: (index: number | null) => void;
  onSelectionChange: (range: BrushRange | null, stats: SelectionStats | null) => void;
}

interface ChartInteractionState {
  activeLabel?: string | number;
  activePayload?: Array<{ payload: StreamDataPoint }>;
}

const MAX_POINTS = 600;

export default function InteractiveStreamsChart({
  timeStream,
  powerStream,
  heartrateStream,
  cadenceStream,
  altitudeStream,
  velocityStream,
  distanceStream,
  onHoverIndex,
  onSelectionChange,
}: InteractiveStreamsChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const data = useMemo(() => {
    const length = timeStream?.length ?? powerStream?.length ?? heartrateStream?.length ?? 0;
    if (length === 0) return [] as StreamDataPoint[];

    const s = Math.max(1, Math.floor(length / MAX_POINTS));
    const result: StreamDataPoint[] = [];
    for (let i = 0; i < length; i += s) {
      result.push({
        index: i,
        time: timeStream?.[i] ?? i,
        power: powerStream?.[i] ?? null,
        hr: heartrateStream?.[i] ?? null,
        cadence: cadenceStream?.[i] ?? null,
        altitude: altitudeStream?.[i] ?? null,
        velocity: velocityStream?.[i] ?? null,
      });
    }
    return result;
  }, [timeStream, powerStream, heartrateStream, cadenceStream, altitudeStream, velocityStream]);

  const {
    dragging,
    refAreaLeft,
    refAreaRight,
    selectionRange,
    computeStats,
    handleMouseMove,
    handleMouseLeave,
    handleMouseDown,
    handleMouseMoveForDrag,
    handleMouseUp,
    clearSelection,
  } = useChartInteraction({
    timeStream,
    powerStream,
    heartrateStream,
    cadenceStream,
    altitudeStream,
    velocityStream,
    distanceStream,
    onHoverIndex,
    onSelectionChange,
  });

  if (data.length === 0) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChartMouseMove = (state: ChartInteractionState) => {
    handleMouseMove(state);
    handleMouseMoveForDrag(state);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {!!selectionRange && (
        <SelectionStatsBar
          range={selectionRange}
          onClear={clearSelection}
          computeStats={computeStats}
        />
      )}
      <Box sx={{ width: '100%', height: 300, userSelect: 'none' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
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
                domain={['dataMin - 10', 'dataMax + 20']}
                width={44}
                tickFormatter={(v: number) => `${Math.round(v)}m`}
              />
            )}

            <YAxis yAxisId="main" {...chart.axis} />

            <Tooltip
              {...chart.tooltip}
              labelFormatter={(label) => formatTime(Number(label ?? 0))}
            />

            {!!altitudeStream && (
              <defs>
                <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.tokens?.chart.tertiary ?? theme.palette.info.main} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={theme.tokens?.chart.tertiary ?? theme.palette.info.main} stopOpacity={0.12} />
                </linearGradient>
              </defs>
            )}
            {!!altitudeStream && (
              <Area
                yAxisId="altitude"
                type="monotone"
                dataKey="altitude"
                stroke={alphaColor(theme.tokens?.chart.tertiary ?? theme.palette.info.main, 0.82)}
                strokeWidth={1.5}
                fill="url(#altitudeGradient)"
                fillOpacity={1}
                name="Wysokość (m)"
                isAnimationActive={false}
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
                name="Moc (W)"
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
                name="Tętno (bpm)"
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
                name="Kadencja (rpm)"
              />
            )}

            {!!velocityStream && (
              <Line
                yAxisId="main"
                type="monotone"
                dataKey="velocity"
                stroke={STATUS_COLORS.warning}
                dot={false}
                strokeWidth={1}
                name="Prędkość (m/s)"
              />
            )}

            {/* Drag selection highlight */}
            {!!dragging && refAreaLeft != null && refAreaRight != null && (
              <ReferenceArea
                yAxisId="main"
                x1={refAreaLeft}
                x2={refAreaRight}
                fill={theme.tokens?.chart.primary ?? theme.palette.primary.main}
                fillOpacity={0.15}
                strokeOpacity={0}
              />
            )}

            {/* Active selection highlight */}
            {!!selectionRange && (
              <ReferenceArea
                yAxisId="main"
                x1={selectionRange[0]}
                x2={selectionRange[1]}
                fill={theme.tokens?.chart.primary ?? theme.palette.primary.main}
                fillOpacity={0.12}
                stroke={theme.tokens?.chart.primary ?? theme.palette.primary.main}
                strokeOpacity={0.3}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
      <Typography color="text.secondary" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
        Najedź myszką, aby zobaczyć punkt na mapie • Kliknij i przeciągnij, aby wybrać odcinek
      </Typography>
    </Box>
  );
}

function SelectionStatsBar({
  range,
  onClear,
  computeStats,
}: {
  range: [number, number];
  onClear: () => void;
  computeStats: (startTime: number, endTime: number) => { range: BrushRange; stats: SelectionStats } | null;
}) {
  const result = computeStats(range[0], range[1]);
  if (!result) return null;
  const { stats } = result;

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        bgcolor: alphaColor(CHART_COLORS.primary, 0.08),
        border: `1px solid ${alphaColor(CHART_COLORS.primary, 0.2)}`,
        borderRadius: 2,
        px: 2,
        py: 1,
        mb: 1.5,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Typography sx={{ color: CHART_COLORS.primary, fontSize: '0.75rem', fontWeight: 700 }}>
        Zaznaczony odcinek
      </Typography>
      {stats.duration > 0 && (
        <Chip label={`${formatDuration(stats.duration)}`} size="small" variant="outlined"
          sx={{ borderColor: CHART_COLORS.grid, color: CHART_COLORS.tooltipText, fontSize: '0.7rem' }} />
      )}
      {stats.distance > 0 && (
        <Chip label={`${(stats.distance / 1000).toFixed(2)} km`} size="small" variant="outlined"
          sx={{ borderColor: CHART_COLORS.grid, color: CHART_COLORS.tooltipText, fontSize: '0.7rem' }} />
      )}
      {stats.avgPower != null && (
        <Chip label={`⚡ ${stats.avgPower} W`} size="small" variant="outlined"
          sx={{ borderColor: CHART_COLORS.grid, color: CHART_COLORS.primary, fontSize: '0.7rem' }} />
      )}
      {stats.avgHr != null && (
        <Chip label={`❤ ${stats.avgHr} bpm`} size="small" variant="outlined"
          sx={{ borderColor: CHART_COLORS.grid, color: STATUS_COLORS.error, fontSize: '0.7rem' }} />
      )}
      {stats.avgSpeed != null && (
        <Chip label={`🏃 ${stats.avgSpeed} km/h`} size="small" variant="outlined"
          sx={{ borderColor: CHART_COLORS.grid, color: STATUS_COLORS.warning, fontSize: '0.7rem' }} />
      )}
      {stats.elevGain > 0 && (
        <Chip label={`⛰ ${stats.elevGain} m`} size="small" variant="outlined"
          sx={{ borderColor: CHART_COLORS.grid, color: CHART_COLORS.tickText, fontSize: '0.7rem' }} />
      )}
      <Chip
        label="✕ Wyczyść"
        size="small"
        onClick={onClear}
        sx={{
          cursor: 'pointer',
          borderColor: CHART_COLORS.grid,
          color: CHART_COLORS.tickText,
          fontSize: '0.7rem',
          '&:hover': { borderColor: STATUS_COLORS.error, color: STATUS_COLORS.error },
        }}
        variant="outlined"
      />
    </Stack>
  );
}
