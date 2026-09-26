import FavoriteIcon from '@mui/icons-material/Favorite';
import LoopIcon from '@mui/icons-material/Loop';
import { Box, Stack, Typography } from '@mui/material';

import { localized } from '@/i18n';
import { Metric, StatusPill, Surface, type Tone } from '@/ui';

import { cockpitMessages } from './messages';

import type { ErgTarget } from '../devices/ergController';
import type { Compliance, MetricsWindow, SessionMetrics } from '../devices/liveMetrics';
import type { LiveValues } from '../devices/trainerSession';

const COMPLIANCE_TONE: Record<Compliance, Tone> = { in: 'success', below: 'warning', above: 'error', unknown: 'neutral' };
const COMPLIANCE_LABEL: Record<Compliance, string> = localized({
  pl: { in: 'w celu', below: 'poniżej celu', above: 'powyżej celu', unknown: 'brak celu' },
  en: { in: 'on target', below: 'below target', above: 'above target', unknown: 'no target' },
});

function summary(avg: number | null, max: number | null) {
  return cockpitMessages.t('liveMetrics.avgMax', { avg: avg ?? '—', max: max ?? '—' });
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
  const t = cockpitMessages.useT();
  return (
    <Surface variant="accent" radius="hero" padding="sm" aria-label={t('liveMetrics.ariaLabel')} component="section">
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: { xs: 1, sm: 3 } }}>
        <Metric
          align="center"
          size="lg"
          icon={<LoopIcon />}
          label={t('liveMetrics.cadence')}
          value={live.cadenceRpm ?? '—'}
          unit="rpm"
          hint={t('liveMetrics.avg', { value: step.avgCadence ?? '—' })}
        />
        <Stack spacing={0.75} sx={{ alignItems: 'center', minWidth: { xs: 120, sm: 200 } }}>
          <Box aria-live="off" sx={{ lineHeight: 1 }}>
            <Metric
              variant="hero"
              size="display"
              align="center"
              label={t('liveMetrics.power')}
              value={live.powerWatts ?? '—'}
              unit="W"
              tone={live.powerWatts == null ? undefined : COMPLIANCE_TONE[compliance]}
            />
          </Box>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {target ? <StatusPill size="sm" dot tone={COMPLIANCE_TONE[compliance]} label={t('liveMetrics.targetCompliance', { watts: target.watts, compliance: COMPLIANCE_LABEL[compliance] })} /> : null}
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            {t('liveMetrics.stepSummary', { summary: summary(step.avgPower, step.maxPower), np: session.normalizedPower ?? '—' })}
          </Typography>
        </Stack>
        <Metric
          align="center"
          size="lg"
          icon={<FavoriteIcon />}
          tone={live.heartRateBpm == null ? undefined : 'error'}
          label={t('liveMetrics.heartRate')}
          value={live.heartRateBpm ?? '—'}
          unit="bpm"
          hint={summary(step.avgHeartRate, session.maxHeartRate)}
        />
      </Box>
    </Surface>
  );
}
