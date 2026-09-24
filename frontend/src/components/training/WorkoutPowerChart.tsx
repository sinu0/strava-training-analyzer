import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { useRef, useEffect, useState } from 'react';

import { getAppThemeTokens } from '@/theme/theme';

import { stepsToSegments, formatTime, getTypeLabel } from './workoutChartUtils';
import { getZoneForPower, ZONE_COLORS_TRAINING } from '../../types/training';

import type { WorkoutStep } from '../../types/training';


export interface ActualPowerPoint {
  sec: number;
  /** Actual power as % of FTP. */
  pct: number;
}

interface WorkoutPowerChartProps {
  steps: WorkoutStep[];
  compact?: boolean;
  /** Ridden power drawn over the planned profile (trainer mode). */
  actual?: ActualPowerPoint[];
  /** Current workout position in seconds. */
  playheadSec?: number | null;
  height?: number;
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  power: number;
  duration: number;
}

const MARGIN_FULL = { top: 8, right: 32, bottom: 32, left: 44 };
const MARGIN_COMPACT = { top: 2, right: 2, bottom: 2, left: 2 };

export default function WorkoutPowerChart({ steps, compact = false, actual, playheadSec = null, height: heightOverride }: WorkoutPowerChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const theme = useTheme();
  const tokens = getAppThemeTokens(theme);
  const ink = { grid: tokens.chart.grid, axis: tokens.surfaceStrongBorder, tick: tokens.chart.tick, strong: theme.palette.text.primary };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const segments = stepsToSegments(steps);
  if (segments.length === 0) return null;

  const totalSec = segments[segments.length - 1]?.endSec ?? 0;
  if (totalSec === 0) return null;

  const height = heightOverride ?? (compact ? 72 : 240);
  const margin = compact ? MARGIN_COMPACT : MARGIN_FULL;
  const contentW = Math.max(1, width - margin.left - margin.right);
  const contentH = Math.max(1, height - margin.top - margin.bottom);

  // Power domain: max power with some headroom
  const maxPower = Math.max(
    ...segments.map((s) => Math.max(s.powerLow, s.powerHigh)),
    110,
  );
  const domainMax = maxPower + 15;

  const toX = (sec: number) => margin.left + (sec / totalSec) * contentW;
  const toY = (pct: number) => margin.top + contentH - (pct / domainMax) * contentH;

  // Y axis ticks
  const yTicks = [0, 25, 50, 75, 100, 125].filter((t) => t <= domainMax);

  // X axis ticks – adaptive interval, max ~8 ticks
  const rawInterval = totalSec <= 3600 ? 300 : 600;
  const tickInterval = Math.ceil(totalSec / 8 / rawInterval) * rawInterval;
  const xTicks: number[] = [];
  for (let t = 0; t <= totalSec; t += tickInterval) xTicks.push(t);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Y gridlines */}
        {!compact &&
          yTicks.map((t) => (
            <line
              key={t}
              x1={margin.left}
              x2={margin.left + contentW}
              y1={toY(t)}
              y2={toY(t)}
              stroke={ink.grid}
              strokeDasharray={t === 100 ? '4 3' : undefined}
              strokeWidth={t === 100 ? 1.5 : 0.8}
            />
          ))}

        {/* Segments as solid blocks */}
        {segments.map((seg) => {
          const x = toX(seg.startSec);
          const w = Math.max(1, toX(seg.endSec) - x);
          const avgPower = (seg.powerLow + seg.powerHigh) / 2;
          const zone = getZoneForPower(avgPower);
          const fill = ZONE_COLORS_TRAINING[zone] ?? ink.tick;

          if (seg.type === 'warmup' || seg.type === 'cooldown') {
            const y0 = toY(seg.type === 'warmup' ? seg.powerLow : seg.powerHigh);
            const y1 = toY(seg.type === 'warmup' ? seg.powerHigh : seg.powerLow);
            const bottom = margin.top + contentH;
            const points = `${x},${bottom} ${x},${y0} ${x + w},${y1} ${x + w},${bottom}`;
            return (
              <polygon
                key={`${seg.type}-${seg.startSec}-${seg.endSec}`}
                points={points}
                fill={fill}
                fillOpacity={0.85}
                onMouseEnter={(e) =>
                  !compact &&
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    label: getTypeLabel(seg.type),
                    power: Math.round(avgPower),
                    duration: seg.endSec - seg.startSec,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              />
            );
          }

          const bH = (avgPower / domainMax) * contentH;
          const y = margin.top + contentH - bH;
          return (
            <rect
              key={`${seg.type}-${seg.startSec}-${seg.endSec}`}
              x={x}
              y={y}
              width={w}
              height={Math.max(1, bH)}
              fill={fill}
              fillOpacity={0.85}
              rx={compact ? 0 : 2}
              onMouseEnter={(e) =>
                !compact &&
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  label: getTypeLabel(seg.type),
                  power: Math.round(avgPower),
                  duration: seg.endSec - seg.startSec,
                })
              }
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}

        {/* Ridden power */}
        {actual && actual.length > 1 ? (
          <polyline
            data-testid="actual-power"
            points={actual.filter((point) => point.sec <= totalSec).map((point) => `${toX(point.sec)},${toY(Math.min(point.pct, domainMax))}`).join(' ')}
            fill="none"
            stroke={theme.palette.text.primary}
            strokeOpacity={0.85}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        ) : null}

        {/* Playhead */}
        {playheadSec != null ? (
          <line
            data-testid="playhead"
            x1={toX(Math.min(playheadSec, totalSec))}
            x2={toX(Math.min(playheadSec, totalSec))}
            y1={margin.top}
            y2={margin.top + contentH}
            stroke={theme.palette.text.primary}
            strokeWidth={2}
          />
        ) : null}

        {/* Y axis */}
        {!compact && (
          <>
            <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + contentH} stroke={ink.axis} />
            {yTicks.map((t) => (
              <text
                key={t}
                x={margin.left - 6}
                y={toY(t) + 4}
                textAnchor="end"
                fill={t === 100 ? ink.strong : ink.tick}
                fontSize={11}
              >
                {t}%
              </text>
            ))}
          </>
        )}

        {/* X axis */}
        {!compact && (
          <>
            <line
              x1={margin.left}
              y1={margin.top + contentH}
              x2={margin.left + contentW}
              y2={margin.top + contentH}
              stroke={ink.axis}
            />
            {xTicks.map((t) => (
              <text
                key={t}
                x={toX(t)}
                y={margin.top + contentH + 18}
                textAnchor="middle"
                fill={ink.tick}
                fontSize={11}
              >
                {formatTime(t)}
              </text>
            ))}
          </>
        )}

        {/* FTP label */}
        {!compact && (
          <text x={margin.left + contentW + 4} y={toY(100) + 4} fill={ink.tick} fontSize={10}>
            FTP
          </text>
        )}
      </svg>

      {/* Tooltip */}
      {!!tooltip && (
        <Box
          sx={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y - 8,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${tokens.radius.control}px`,
            boxShadow: tokens.cardShadow,
            px: 1.5,
            py: 1,
            pointerEvents: 'none',
            zIndex: 9999,
            fontSize: 12,
            color: 'text.primary',
          }}
        >
          <div style={{ fontWeight: 600 }}>{tooltip.label}</div>
          <Box sx={{ color: 'text.secondary' }}>{tooltip.power}% FTP</Box>
          <Box sx={{ color: 'text.secondary' }}>{formatTime(tooltip.duration)}</Box>
        </Box>
      )}
    </Box>
  );
}
