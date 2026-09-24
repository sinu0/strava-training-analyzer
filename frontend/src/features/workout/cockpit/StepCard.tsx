import { Alert, Box, Stack, Typography } from '@mui/material';

import type { WorkoutExecution } from '@/types/training';
import { getZoneForPower } from '@/types/training';
import { Metric, ProgressTrack, StatusPill, Surface, useTokens } from '@/ui';

import { formatClock, formatDurationShort, stepLabel, stepTargetText } from './format';

import type { MetricsWindow } from '../devices/liveMetrics';

/** Current step: name, countdown, target, progress and step averages. */
export default function StepCard({ execution, stepMetrics }: { execution: WorkoutExecution; stepMetrics: MetricsWindow }) {
  const tokens = useTokens();
  const index = execution.currentStepIndex;
  const step = execution.stepsSnapshot[index];
  const next = execution.stepsSnapshot[index + 1];
  const target = stepTargetText(step, execution.ftpWatts, execution.intensityAdjustmentPct);
  const nextTarget = stepTargetText(next, execution.ftpWatts, execution.intensityAdjustmentPct);
  const durationMs = step?.durationSec != null && step.durationType !== 'LAP_BUTTON' && step.durationType !== 'OPEN' ? step.durationSec * 1000 : null;
  const progress = durationMs ? (execution.stepElapsedMs / durationMs) * 100 : 0;
  const avgPct = step?.powerPctFtpLow != null ? ((step.powerPctFtpLow + (step.powerPctFtpHigh ?? step.powerPctFtpLow)) / 2) : null;
  const zone = avgPct != null ? getZoneForPower(avgPct) : null;
  const zoneColor = zone ? tokens.chart.zone[zone as keyof typeof tokens.chart.zone] : tokens.chart.secondary;

  return (
    <Surface component="section" aria-label="Bieżący krok">
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusPill size="sm" eyebrow label={`Krok ${Math.min(index + 1, execution.stepsSnapshot.length)}/${execution.stepsSnapshot.length}`} />
        {zone ? <StatusPill size="sm" color={zoneColor} label={zone} /> : null}
        <StatusPill size="sm" variant="outline" label={target.pct} />
      </Stack>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-end', mt: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h3" aria-live="polite" sx={{ lineHeight: 1.1 }}>{stepLabel(step, index)}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {formatDurationShort(step?.durationSec)} @ <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{target.watts}</Box>{target.watts !== '—' ? ' W' : ''}
          </Typography>
        </Box>
        <Metric
          variant="hero"
          size="xl"
          align="center"
          label={durationMs ? 'do końca kroku' : 'czas kroku'}
          value={formatClock(durationMs ? durationMs - execution.stepElapsedMs : execution.stepElapsedMs)}
        />
      </Stack>
      <Box sx={{ mt: 2 }}>
        <ProgressTrack
          size="md"
          value={progress}
          color={zoneColor}
          ariaLabel="Postęp kroku"
          scale={[formatClock(execution.stepElapsedMs), durationMs ? formatClock(durationMs) : 'LAP']}
        />
      </Box>
      <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 3, mt: 2 }}>
        <Metric variant="stat" label="śr. moc kroku" value={stepMetrics.avgPower ?? '—'} unit="W" />
        <Metric variant="stat" label="śr. tętno kroku" value={stepMetrics.avgHeartRate ?? '—'} unit="bpm" />
        <Metric variant="stat" label="śr. kadencja" value={stepMetrics.avgCadence ?? '—'} unit="rpm" />
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
        Następny: {stepLabel(next, index + 1)}{next ? ` · ${formatDurationShort(next.durationSec)}${nextTarget.watts !== '—' ? ` @ ${nextTarget.watts} W` : ''}` : ''}
      </Typography>
      {step?.instructions ? <Alert severity="info" sx={{ mt: 2 }}>{step.instructions}</Alert> : null}
    </Surface>
  );
}
