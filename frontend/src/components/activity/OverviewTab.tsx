import { Box, Grid, Typography } from '@mui/material';

import PeakEffortsDisplay from '@/components/activity/PeakEffortsDisplay';
import ActivityZonesBar from '@/components/ActivityZonesBar';
import PowerCurveChart from '@/components/PowerCurveChart';
import type { ActivityDetail } from '@/types/activity';

interface OverviewTabProps {
  activity: ActivityDetail;
}

const METRIC_LABELS: Record<string, string> = {
  normalizedPower: 'Znormalizowana moc (NP)',
  tss: 'TSS',
  'if': 'Współczynnik intensywności (IF)',
  ef: 'Współczynnik efektywności (EF)',
  aerobicDecoupling: 'Aerobic Decoupling',
  hrTss: 'HR TSS',
  variabilityIndex: 'Indeks zmienności (VI)',
};

const COMPLEX_METRICS = new Set([
  'powerCurve', 'timeInZones', 'power_curve', 'time_in_zones',
  'peak_efforts', 'w_prime_balance', 'grade_adjusted_pace',
]);

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Box
      sx={{
        bgcolor: '#0D1117',
        border: '1px solid #30363D',
        borderRadius: 2,
        p: 2,
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#E6EDF3',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.7rem', color: '#8B949E', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: '1rem',
        fontWeight: 700,
        color: '#E6EDF3',
        mb: 2,
        mt: 1,
      }}
    >
      {children}
    </Typography>
  );
}

export default function OverviewTab({ activity }: OverviewTabProps) {
  const simpleMetrics = activity.metrics
    ? Object.entries(activity.metrics).filter(([key, val]) =>
        !COMPLEX_METRICS.has(key) && (typeof val === 'number' || typeof val === 'string')
      )
    : [];

  const zonesMetric = activity.metrics?.timeInZones ?? activity.metrics?.time_in_zones;
  const powerCurveMetric = activity.metrics?.powerCurve ?? activity.metrics?.power_curve;
  const peakEffortsMetric = activity.metrics?.peak_efforts;

  const hasPeakEfforts = peakEffortsMetric != null && typeof peakEffortsMetric === 'object';
  const hasPowerCurve = powerCurveMetric != null && typeof powerCurveMetric === 'object';
  const hasZones = zonesMetric != null;

  return (
    <Box>
      {/* Training Metrics */}
      {simpleMetrics.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <SectionTitle>Metryki treningowe</SectionTitle>
          <Grid container spacing={2}>
            {simpleMetrics.map(([key, val]) => (
              <Grid item xs={6} sm={4} md={3} key={key}>
                <MetricCard
                  label={METRIC_LABELS[key] ?? key}
                  value={typeof val === 'number' ? val.toFixed(1) : String(val)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Peak Efforts */}
      {!!hasPeakEfforts && (
        <Box
          sx={{
            mb: 4,
            bgcolor: '#161B22',
            borderRadius: 3,
            border: '1px solid #30363D',
            p: 3,
          }}
        >
          <SectionTitle>Najlepsze wysiłki</SectionTitle>
          <PeakEffortsDisplay data={peakEffortsMetric} />
        </Box>
      )}

      {/* Power Curve */}
      {!!hasPowerCurve && (
        <Box
          sx={{
            mb: 4,
            bgcolor: '#161B22',
            borderRadius: 3,
            border: '1px solid #30363D',
            p: 3,
          }}
        >
          <SectionTitle>Krzywa mocy</SectionTitle>
          <PowerCurveChart data={powerCurveMetric as { efforts: Record<number, number> }} />
        </Box>
      )}

      {/* Zone Distribution */}
      {!!hasZones && (
        <Box
          sx={{
            mb: 4,
            bgcolor: '#161B22',
            borderRadius: 3,
            border: '1px solid #30363D',
            p: 3,
          }}
        >
          <SectionTitle>Strefy</SectionTitle>
          <ActivityZonesBar zonesJson={zonesMetric as string | Record<string, number>} />
        </Box>
      )}

      {/* Empty state */}
      {simpleMetrics.length === 0 && !hasPowerCurve && !hasZones && !hasPeakEfforts && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography sx={{ color: '#8B949E' }}>
            Brak danych do wyświetlenia w zakładce Przegląd.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
