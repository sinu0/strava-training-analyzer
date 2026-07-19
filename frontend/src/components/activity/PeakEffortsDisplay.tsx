import { Box, Grid, Typography } from '@mui/material';

interface PeakEffortsData {
  power?: Record<string, number>;
  heartrate?: Record<string, number>;
  speed?: Record<string, number>;
}

interface PeakColumnProps {
  label: string;
  color: string;
  unit: string;
  values: Record<string, number>;
}

function PeakColumn({ label, color, unit, values }: PeakColumnProps) {
  return (
    <Grid
      size={{
        xs: 12,
        sm: 6,
        md: 4
      }}>
      <Typography sx={{ color, fontSize: '0.8rem', fontWeight: 700, mb: 1 }}>{label}</Typography>
      {Object.entries(values).map(([duration, value]) => (
        <Box
          key={duration}
          sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: 1, borderColor: 'divider' }}
        >
          <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{duration}</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'baseline' }}>
            <Typography sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(value)}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{unit}</Typography>
          </Box>
        </Box>
      ))}
    </Grid>
  );
}

interface PeakEffortsDisplayProps {
  data: unknown;
}

export default function PeakEffortsDisplay({ data }: PeakEffortsDisplayProps) {
  if (!data || typeof data !== 'object') return null;
  const peaks = data as PeakEffortsData;

  const hasPower = peaks.power && Object.keys(peaks.power).length > 0;
  const hasHr = peaks.heartrate && Object.keys(peaks.heartrate).length > 0;
  const hasSpeed = peaks.speed && Object.keys(peaks.speed).length > 0;

  if (!hasPower && !hasHr && !hasSpeed) return null;

  return (
    <Grid container spacing={3}>
      {!!hasPower && <PeakColumn label="⚡ Moc (W)" color="primary.main" unit="W" values={peaks.power!} />}
      {!!hasHr && <PeakColumn label="❤ Tętno (bpm)" color="error.main" unit="bpm" values={peaks.heartrate!} />}
      {!!hasSpeed && <PeakColumn label="🚀 Prędkość (m/s)" color="info.main" unit="m/s" values={peaks.speed!} />}
    </Grid>
  );
}
