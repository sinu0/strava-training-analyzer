import { Box, Typography, Stack, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';

import { STATUS_COLORS, alphaColor } from '../utils/colors';

import type { PowerCurve } from '../types/analytics';

interface PowerProfileRadarProps {
  data: PowerCurve | undefined;
  weightKg?: number | null;
}

// Power profile segments: 8 vertices covering the full power curve
const SEGMENTS = [
  { duration: 5, label: 'Sprint', shortLabel: '5s', category: 'Neuromuskularny' },
  { duration: 30, label: 'Anaerobowy', shortLabel: '30s', category: 'Anaerobowy' },
  { duration: 60, label: 'VO₂max', shortLabel: '1min', category: 'VO₂max' },
  { duration: 300, label: 'MAP', shortLabel: '5min', category: 'MAP' },
  { duration: 1200, label: 'Próg', shortLabel: '20min', category: 'Próg' },
  { duration: 1800, label: 'Tempo', shortLabel: '30min', category: 'Tempo' },
  { duration: 3600, label: 'Wytrzymałość', shortLabel: '60min', category: 'Wytrzymałość' },
  { duration: 7200, label: 'Długa wytrzym.', shortLabel: '120min', category: 'Długa' },
] as const;

// Reference watts/kg values for Cat 3 cyclist (~75kg, FTP ~250W) — used to normalize radar
// These are approximate upper-range Cat 3 values per duration
const REFERENCE_WKG: Record<number, number> = {
  5: 18.0,    // Sprint: ~1350W @ 75kg
  30: 9.0,    // Anaerobic: ~675W
  60: 7.0,    // VO2max: ~525W
  300: 5.0,   // MAP: ~375W
  1200: 4.0,  // Threshold: ~300W
  1800: 3.7,  // Tempo: ~277W
  3600: 3.3,  // Endurance: ~247W
  7200: 2.8,  // Long endurance: ~210W
};

function getSegmentColor(pct: number): string {
  if (pct >= 90) return STATUS_COLORS.success;
  if (pct >= 70) return STATUS_COLORS.secondary;
  if (pct >= 50) return STATUS_COLORS.warning;
  if (pct >= 30) return STATUS_COLORS.accent;
  return STATUS_COLORS.error;
}

function getSegmentLevel(pct: number): string {
  if (pct >= 90) return 'Elitarny';
  if (pct >= 70) return 'Zaawansowany';
  if (pct >= 50) return 'Średni';
  if (pct >= 30) return 'Początkujący';
  return 'Do rozwoju';
}

export default function PowerProfileRadar({ data, weightKg }: PowerProfileRadarProps) {
  const theme = useTheme();
  const hasData = data?.efforts && Object.keys(data.efforts).length > 0;
  const athleteWeight = weightKg ?? 75;

  // Build radar data — normalize each segment against reference values
  const radarData = SEGMENTS.map(seg => {
    const efforts = hasData ? (data.efforts ?? {}) : {};
    const watts = efforts[seg.duration] ?? 0;
    const refWkg = REFERENCE_WKG[seg.duration];
    const refWatts = (refWkg ?? 5) * athleteWeight;
    const pct = refWatts > 0 ? Math.min(100, (watts / refWatts) * 100) : 0;
    return {
      subject: seg.shortLabel,
      fullLabel: seg.label,
      value: Math.round(pct),
      watts: Math.round(watts),
      category: seg.category,
    };
  });

  // Find strongest and weakest
  const sorted = [...radarData].sort((a, b) => b.value - a.value);
  const strongest = sorted[0]!;
  const weakest = sorted[sorted.length - 1]!;

  return (
    <Box>
      {/* Radar chart */}
      <Box sx={{ width: '100%', height: 220, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="72%">
            <PolarGrid stroke={alphaColor(theme.tokens.chart.grid, 0.72)} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: theme.tokens.chart.tick, fontSize: 10, fontWeight: 600 }}
            />
            <Radar
              dataKey="value"
              stroke={STATUS_COLORS.accent}
              fill={STATUS_COLORS.accent}
              fillOpacity={0.2}
              strokeWidth={2}
              animationDuration={800}
            />
          </RadarChart>
        </ResponsiveContainer>
        {!hasData && (
          <Typography
            color="text.secondary"
            variant="caption"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          >
            Brak danych —<br />zsynchronizuj Stravę
          </Typography>
        )}
      </Box>

      {/* Segment details grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0.75,
        mt: 1,
      }}>
        {radarData.map(seg => {
          const color = getSegmentColor(seg.value);
          return (
            <Tooltip
              key={seg.subject}
              title={`${seg.fullLabel} (${seg.category}): ${seg.watts}W — ${getSegmentLevel(seg.value)}`}
            >
              <Box sx={{
                textAlign: 'center',
                py: 0.5,
                px: 0.25,
                borderRadius: 1,
                bgcolor: `${color}14`,
                border: `1px solid ${color}33`,
                cursor: 'default',
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.05)' },
              }}>
                <Typography variant="caption" sx={{
                  color, fontWeight: 700, fontSize: '0.65rem', display: 'block',
                }}>
                  {seg.subject}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {seg.watts}W
                </Typography>
                <Typography variant="caption" sx={{
                  color, fontSize: '0.55rem', fontWeight: 600,
                }}>
                  {seg.value}%
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Strengths & weaknesses summary */}
      {!!hasData && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Box sx={{
            flex: 1, py: 0.75, px: 1, borderRadius: 1.5,
            bgcolor: alphaColor(STATUS_COLORS.success, 0.08),
            border: `1px solid ${alphaColor(STATUS_COLORS.success, 0.2)}`,
          }}>
            <Typography variant="caption" sx={{ color: STATUS_COLORS.success, fontWeight: 700, fontSize: '0.6rem' }}>
              💪 Mocna strona
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {strongest.fullLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {strongest.watts}W ({strongest.value}%)
            </Typography>
          </Box>
          <Box sx={{
            flex: 1, py: 0.75, px: 1, borderRadius: 1.5,
            bgcolor: alphaColor(STATUS_COLORS.error, 0.08),
            border: `1px solid ${alphaColor(STATUS_COLORS.error, 0.2)}`,
          }}>
            <Typography variant="caption" sx={{ color: STATUS_COLORS.error, fontWeight: 700, fontSize: '0.6rem' }}>
              🎯 Do poprawy
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {weakest.fullLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {weakest.watts}W ({weakest.value}%)
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
