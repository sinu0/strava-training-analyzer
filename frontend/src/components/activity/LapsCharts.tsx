import { Box, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { formatDistance, formatDuration } from '@/utils/formatters';

import type { BrushRange } from './InteractiveStreamsChart';
import type { ActivityLap } from '../../types/activity';

interface LapsChartsProps {
  laps: ActivityLap[];
  altitudeStream?: number[] | null;
  timeStream?: number[] | null;
  heightPerChart?: number;
  onBarHover?: (index: number | null) => void;
  onBarSelect?: (range: BrushRange | null) => void;
}

type MetricKey = 'power' | 'hr' | 'cad';

interface LapChartDatum {
  lapIndex: number;
  lapLabel: string;
  startIndex: number;
  endIndex: number;
  midIndex: number;
  startTimeSec: number;
  movingTimeSec: number;
  durationLabel: string;
  distanceLabel: string;
  power: number | null;
  hr: number | null;
  cad: number | null;
  elevation: number;
}

interface MetricDefinition {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
}

const METRICS: MetricDefinition[] = [
  { key: 'power', label: 'Moc śr. (W)', unit: 'W', color: '#FF6B35' },
  { key: 'hr', label: 'Tętno śr. (bpm)', unit: 'bpm', color: '#F85149' },
  { key: 'cad', label: 'Kadencja śr. (rpm)', unit: 'rpm', color: '#4ECDC4' },
];

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatMetricValue(value: number | null, unit: string) {
  if (value == null) return 'brak danych';
  return `${Math.round(value)} ${unit}`;
}

interface TooltipData {
  datum: LapChartDatum;
  x: number;
  y: number;
}

function LapTooltip({ tooltip, metric }: { tooltip: TooltipData; metric: MetricDefinition }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: tooltip.x,
        top: tooltip.y,
        transform: 'translate(-50%, -110%)',
        pointerEvents: 'none',
        zIndex: 20,
        bgcolor: '#21262D',
        border: '1px solid #30363D',
        borderRadius: 2,
        px: 1.5,
        py: 1.25,
        minWidth: 180,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <Typography sx={{ color: '#E6EDF3', fontSize: '0.82rem', fontWeight: 700, mb: 0.5 }}>
        {tooltip.datum.lapLabel}
      </Typography>
      <Typography sx={{ color: '#8B949E', fontSize: '0.76rem' }}>
        {metric.label}: {formatMetricValue(tooltip.datum[metric.key], metric.unit)}
      </Typography>
      <Typography sx={{ color: '#8B949E', fontSize: '0.76rem' }}>
        Wysokość: {Math.round(tooltip.datum.elevation)} m
      </Typography>
      <Typography sx={{ color: '#8B949E', fontSize: '0.76rem' }}>
        Czas: {tooltip.datum.durationLabel}
      </Typography>
      <Typography sx={{ color: '#8B949E', fontSize: '0.76rem' }}>
        Dystans: {tooltip.datum.distanceLabel}
      </Typography>
    </Box>
  );
}

const MARGIN = { top: 12, right: 44, bottom: 40, left: 44 };

function ProportionalLapChart({
  chartHeight,
  data,
  metric,
  selectedLapIndex,
  altitudeStream,
  onBarHover,
  onBarSelect,
}: {
  chartHeight: number;
  data: LapChartDatum[];
  metric: MetricDefinition;
  selectedLapIndex: number | null;
  altitudeStream?: number[] | null;
  onBarHover?: (index: number | null) => void;
  onBarSelect: (datum: LapChartDatum) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect.width ?? 600);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGGElement>, datum: LapChartDatum) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ datum, x: e.clientX - rect.left, y: e.clientY - rect.top });
    onBarHover?.(datum.midIndex);
  }, [onBarHover]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    onBarHover?.(null);
  }, [onBarHover]);

  const hasMetricData = data.some((lap) => lap[metric.key] != null);
  if (!hasMetricData) return null;

  const totalTimeSec = data.reduce((s, d) => s + d.movingTimeSec, 0);
  if (totalTimeSec === 0) return null;

  const contentW = width - MARGIN.left - MARGIN.right;
  const contentH = chartHeight - MARGIN.top - MARGIN.bottom;

  // Y axis: metric values
  const metricValues = data.map((d) => d[metric.key] ?? 0);
  const metricMax = Math.max(...metricValues, 1);
  const metricMin = Math.min(...metricValues.filter((v) => v > 0), 0);
  const metricRange = metricMax - metricMin || 1;

  const toMetricY = (v: number) =>
    MARGIN.top + contentH - ((v - metricMin) / metricRange) * contentH * 0.92;
  const toX = (timeSec: number) =>
    MARGIN.left + (timeSec / totalTimeSec) * contentW;

  // Y axis ticks
  const metricTicks = [metricMin, metricMin + metricRange * 0.5, metricMax].map(Math.round);

  // Elevation profile using actual altitude stream (sampled per lap segment)
  const elevData = (() => {
    if (!altitudeStream || altitudeStream.length === 0) return null;
    const points: Array<[number, number]> = [];
    for (const d of data) {
      const si = Math.max(0, d.startIndex);
      const ei = Math.min(altitudeStream.length - 1, d.endIndex);
      const step = Math.max(1, Math.floor((ei - si) / 8));
      for (let idx = si; idx <= ei; idx += step) {
        const fraction = (idx - si) / Math.max(1, ei - si);
        const tSec = d.startTimeSec + fraction * d.movingTimeSec;
        points.push([tSec, altitudeStream[idx]!]);
      }
    }
    if (points.length < 2) return null;
    const altMin = Math.min(...points.map((p) => p[1]!));
    const altMax = Math.max(...points.map((p) => p[1]!), altMin + 1);
    const altRange = altMax - altMin;
    const toAltY = (alt: number) =>
      MARGIN.top + contentH - ((alt - altMin) / altRange) * contentH * 0.32;
    const d0 = points[0]!;
    let strokePath = `M ${toX(d0[0])} ${toAltY(d0[1])}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i]!;
      strokePath += ` L ${toX(p[0])} ${toAltY(p[1])}`;
    }
    const last = points[points.length - 1]!;
    const fillPath = `${strokePath} L ${toX(last[0])} ${MARGIN.top + contentH} L ${toX(d0[0])} ${MARGIN.top + contentH} Z`;
    return { strokePath, fillPath, altMin, altMax, toAltY };
  })();

  return (
    <Box
      sx={{
        bgcolor: '#161B22',
        borderRadius: 3,
        border: '1px solid #30363D',
        p: 2,
      }}
    >
      <Typography sx={{ color: metric.color, fontSize: '0.9rem', fontWeight: 700, mb: 1 }}>
        {metric.label}
      </Typography>

      <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
        <svg width={width} height={chartHeight} style={{ display: 'block', overflow: 'visible' }}>
          {/* Grid lines */}
          {metricTicks.map((tick) => (
            <line
              key={tick}
              x1={MARGIN.left}
              x2={MARGIN.left + contentW}
              y1={toMetricY(tick)}
              y2={toMetricY(tick)}
              stroke="#30363D"
              strokeDasharray="3 3"
            />
          ))}

          {/* Elevation background from altitude stream */}
          {!!elevData && <>
              <path d={elevData.fillPath} fill="rgba(100,160,255,0.12)" />
              <path d={elevData.strokePath} fill="none" stroke="rgba(100,160,255,0.6)" strokeWidth={1.5} />
            </>}

          {/* Bars */}
          {data.map((lap) => {
            const barX = toX(lap.startTimeSec) + 2;
            const barW = Math.max(2, (lap.movingTimeSec / totalTimeSec) * contentW - 3);
            const val = lap[metric.key];
            if (val == null) return null;
            const barY = toMetricY(val);
            const barH = Math.max(2, MARGIN.top + contentH - barY);
            const isSelected = selectedLapIndex === lap.lapIndex;

            return (
              <g
                key={`bar-${lap.lapIndex}`}
                style={{ cursor: 'pointer' }}
                onMouseMove={(e) => handleMouseMove(e, lap)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onBarSelect(lap)}
              >
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={4}
                  fill={isSelected ? metric.color : hexToRgba(metric.color, 0.78)}
                  stroke={isSelected ? metric.color : hexToRgba(metric.color, 0.28)}
                  strokeWidth={isSelected ? 2 : 1}
                />
              </g>
            );
          })}

          {/* X axis */}
          <line
            x1={MARGIN.left}
            x2={MARGIN.left + contentW}
            y1={MARGIN.top + contentH}
            y2={MARGIN.top + contentH}
            stroke="#8B949E"
          />

          {/* X axis labels – show lapLabel only if bar is wide enough */}
          {data.map((lap) => {
            const barW = (lap.movingTimeSec / totalTimeSec) * contentW;
            if (barW < 20) return null;
            const xMid = toX(lap.startTimeSec + lap.movingTimeSec / 2);
            return (
              <text
                key={`label-${lap.lapIndex}`}
                x={xMid}
                y={MARGIN.top + contentH + 14}
                textAnchor="middle"
                fill="#8B949E"
                fontSize={9}
              >
                {lap.lapLabel}
              </text>
            );
          })}

          {/* Duration labels under bars */}
          {data.map((lap) => {
            const barW = (lap.movingTimeSec / totalTimeSec) * contentW;
            if (barW < 36) return null;
            const xMid = toX(lap.startTimeSec + lap.movingTimeSec / 2);
            return (
              <text
                key={`dur-${lap.lapIndex}`}
                x={xMid}
                y={MARGIN.top + contentH + 26}
                textAnchor="middle"
                fill="#8B949E"
                fontSize={9}
              >
                {lap.durationLabel}
              </text>
            );
          })}

          {/* Y axis left (metric) */}
          {metricTicks.map((tick) => (
            <text
              key={`ytick-${tick}`}
              x={MARGIN.left - 6}
              y={toMetricY(tick) + 4}
              textAnchor="end"
              fill="#8B949E"
              fontSize={9}
            >
              {tick}
            </text>
          ))}

          {/* Y axis right (elevation) */}
          {!!elevData && (
            <text
              x={MARGIN.left + contentW + 6}
              y={elevData.toAltY(elevData.altMax) + 4}
              textAnchor="start"
              fill="rgba(100,160,255,0.7)"
              fontSize={9}
            >
              {Math.round(elevData.altMax)}m
            </text>
          )}
        </svg>

        {!!tooltip && <LapTooltip tooltip={tooltip} metric={metric} />}
      </Box>

      <Typography sx={{ color: '#8B949E', fontSize: '0.72rem', mt: 0.5 }}>
        Szerokość słupka odzwierciedla czas okrążenia. Najedź aby podświetlić odcinek. Kliknij aby zaznaczyć.
      </Typography>
    </Box>
  );
}

export default function LapsCharts({
  laps,
  altitudeStream,
  timeStream: _timeStream,
  heightPerChart = 220,
  onBarHover,
  onBarSelect,
}: LapsChartsProps) {
  const [selectedLapIndex, setSelectedLapIndex] = useState<number | null>(null);

  const chartData = useMemo<LapChartDatum[]>(() => {
    let cumTime = 0;
    return laps.map((lap) => {
      const start = cumTime;
      cumTime += lap.movingTimeSec ?? 0;
      return {
        lapIndex: lap.lapIndex,
        lapLabel: `Okr. ${lap.lapIndex}`,
        startIndex: lap.startIndex ?? 0,
        endIndex: lap.endIndex ?? 0,
        midIndex: Math.max(0, Math.floor(((lap.startIndex ?? 0) + (lap.endIndex ?? 0)) / 2)),
        startTimeSec: start,
        movingTimeSec: lap.movingTimeSec ?? 0,
        durationLabel: formatDuration(lap.movingTimeSec ?? 0),
        distanceLabel: formatDistance(lap.distanceM ?? 0),
        power: lap.avgPowerW ?? null,
        hr: lap.avgHeartrate ?? null,
        cad: lap.avgCadence ?? null,
        elevation: lap.totalElevationGain ?? 0,
      };
    });
  }, [laps]);

  const handleSelectLap = useCallback((datum: LapChartDatum) => {
    setSelectedLapIndex(datum.lapIndex);
    onBarSelect?.({
      startIndex: datum.startIndex,
      endIndex: datum.endIndex,
    });
  }, [onBarSelect]);

  if (!laps || laps.length === 0) return null;

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      {METRICS.map((metric) => (
        <ProportionalLapChart
          key={metric.key}
          chartHeight={Math.max(220, heightPerChart)}
          data={chartData}
          metric={metric}
          selectedLapIndex={selectedLapIndex}
          altitudeStream={altitudeStream}
          onBarHover={onBarHover}
          onBarSelect={handleSelectLap}
        />
      ))}
    </Stack>
  );
}
