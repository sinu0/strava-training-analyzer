import FavoriteIcon from '@mui/icons-material/Favorite';
import LoopIcon from '@mui/icons-material/Loop';
import { Box, Stack, Typography } from '@mui/material';

import { Metric, StatusPill, Surface, type Tone } from '@/ui';

import type { ErgTarget } from '../devices/ergController';
import type { Compliance, MetricsWindow, SessionMetrics } from '../devices/liveMetrics';
import type { LiveValues } from '../devices/trainerSession';

const COMPLIANCE_TONE: Record<Compliance, Tone> = { in: 'success', below: 'warning', above: 'error', unknown: 'neutral' };
const COMPLIANCE_LABEL: Record<Compliance, string> = { in: 'w celu', below: 'poniżej celu', above: 'powyżej celu', unknown: 'brak celu' };

function summary(avg: number | null, max: number | null) {
  return `śr. ${avg ?? '—'} · maks ${max ?? '—'}`;
}

interface LiveMetricClusterProps {
  live: LiveValues;
  step: MetricsWindow;
  session: SessionMetrics;
  target: ErgTarget | null;
  compliance: Compliance;
}

/** Cadence | power | heart rate — the three numbers read from the saddle. */
export default function LiveMetricCluster({ live, step, session, target, compliance }: LiveMetricClusterProps) {
  return (
    <Surface variant="accent" radius="hero" padding="sm" aria-label="Dane na żywo" component="section">
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: { xs: 1, sm: 3 } }}>
        <Metric
          align="center"
          size="lg"
          icon={<LoopIcon />}
          label="Kadencja"
          value={live.cadenceRpm ?? '—'}
          unit="rpm"
          hint={`śr. ${step.avgCadence ?? '—'}`}
        />
        <Stack spacing={0.75} sx={{ alignItems: 'center', minWidth: { xs: 120, sm: 200 } }}>
          <Box aria-live="off" sx={{ lineHeight: 1 }}>
            <Metric
              variant="hero"
              size="display"
              align="center"
              label="Moc (3 s)"
              value={live.powerWatts ?? '—'}
              unit="W"
              tone={live.powerWatts == null ? undefined : COMPLIANCE_TONE[compliance]}
            />
          </Box>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {target ? <StatusPill size="sm" dot tone={COMPLIANCE_TONE[compliance]} label={`cel ${target.watts} W · ${COMPLIANCE_LABEL[compliance]}`} /> : null}
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            krok {summary(step.avgPower, step.maxPower)} · NP {session.normalizedPower ?? '—'}
          </Typography>
        </Stack>
        <Metric
          align="center"
          size="lg"
          icon={<FavoriteIcon />}
          tone={live.heartRateBpm == null ? undefined : 'error'}
          label="Tętno"
          value={live.heartRateBpm ?? '—'}
          unit="bpm"
          hint={summary(step.avgHeartRate, session.maxHeartRate)}
        />
      </Box>
    </Surface>
  );
}
