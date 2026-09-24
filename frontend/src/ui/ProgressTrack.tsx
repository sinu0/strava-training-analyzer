import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getAppThemeTokens } from '@/theme/theme';

import { toneColor, type Tone } from './tokens';

import type { ReactNode } from 'react';

export interface ProgressSegment {
  /** Relative width of the segment. */
  weight: number;
  color: string;
  label?: string;
}

export interface ProgressTrackProps {
  /** 0–100. For `marker` mode it is the marker position. */
  value: number;
  tone?: Tone;
  /** Explicit colour, e.g. a training zone colour; wins over `tone`. */
  color?: string;
  size?: 'xs' | 'sm' | 'md';
  /** bar — filled bar; marker — dot on a neutral scale (e.g. form −30…+30). */
  mode?: 'bar' | 'marker';
  /** Coloured background segments, e.g. zones of a workout. */
  segments?: ProgressSegment[];
  label?: ReactNode;
  valueLabel?: ReactNode;
  /** Scale captions under the track: [start, end]. */
  scale?: [ReactNode, ReactNode];
  ariaLabel: string;
}

/** Thin rounded progress bar, scale marker or segmented track. */
export default function ProgressTrack({
  value, tone = 'primary', color, size = 'sm', mode = 'bar', segments, label, valueLabel, scale, ariaLabel,
}: ProgressTrackProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = { xs: 4, sm: 6, md: 9 }[size];
  const totalWeight = segments?.reduce((sum, segment) => sum + segment.weight, 0) ?? 0;
  // Segment keys come from their cumulative start, which is unique and stable for a given list.
  const positioned = (segments ?? []).reduce<Array<ProgressSegment & { start: number }>>((list, segment) => {
    const previous = list[list.length - 1];
    list.push({ ...segment, start: previous ? previous.start + previous.weight : 0 });
    return list;
  }, []);

  return (
    <Box sx={{ minWidth: 0 }}>
      {label || valueLabel ? (
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75, gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>{label}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{valueLabel}</Typography>
        </Stack>
      ) : null}
      <Box
        role={mode === 'bar' ? 'progressbar' : 'img'}
        aria-label={ariaLabel}
        aria-valuenow={mode === 'bar' ? Math.round(clamped) : undefined}
        aria-valuemin={mode === 'bar' ? 0 : undefined}
        aria-valuemax={mode === 'bar' ? 100 : undefined}
        sx={(theme) => {
          const tokens = getAppThemeTokens(theme);
          return { position: 'relative', height, borderRadius: `${tokens.radius.pill}px`, bgcolor: tokens.trackBg, overflow: mode === 'bar' ? 'hidden' : 'visible', display: 'flex' };
        }}
      >
        {totalWeight > 0 ? positioned.map((segment) => (
          <Box
            key={segment.start}
            title={segment.label}
            sx={{ flex: segment.weight / totalWeight, bgcolor: alpha(segment.color, mode === 'bar' ? 0.28 : 0.9), '&:first-of-type': { borderRadius: '99px 0 0 99px' }, '&:last-of-type': { borderRadius: '0 99px 99px 0' } }}
          />
        )) : null}
        {mode === 'bar' ? (
          <Box
            sx={(theme) => ({
              position: 'absolute', inset: 0, width: `${clamped}%`, borderRadius: 'inherit',
              bgcolor: color ?? toneColor(theme, tone),
              transition: `width ${getAppThemeTokens(theme).motion.standard}`,
            })}
          />
        ) : (
          <Box
            sx={(theme) => {
              const markerColor = color ?? toneColor(theme, tone);
              return {
                position: 'absolute', left: `${clamped}%`, top: '50%', width: height + 8, height: height + 8,
                borderRadius: '50%', transform: 'translate(-50%, -50%)', bgcolor: markerColor,
                border: '3px solid', borderColor: 'background.paper', boxShadow: `0 4px 12px ${alpha(markerColor, 0.35)}`,
              };
            }}
          />
        )}
      </Box>
      {scale ? (
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{scale[0]}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{scale[1]}</Typography>
        </Stack>
      ) : null}
    </Box>
  );
}
