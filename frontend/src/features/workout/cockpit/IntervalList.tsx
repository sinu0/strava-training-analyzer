import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { WorkoutExecution, WorkoutStep } from '@/types/training';
import { getZoneForPower } from '@/types/training';
import { StatusPill, useTokens, Widget } from '@/ui';

import { formatClock, formatDurationShort, stepLabel, stepTargetText } from './format';
import { cockpitMessages } from './messages';

function stepPct(step: WorkoutStep): number | null {
  const low = step.powerPctFtpLow ?? step.onPowerPctFtpLow;
  const high = step.powerPctFtpHigh ?? step.onPowerPctFtpHigh ?? low;
  return low == null || high == null ? null : (low + high) / 2;
}

function durationOf(step: WorkoutStep): number {
  if (step.repeat && step.onDurationSec) return step.repeat * (step.onDurationSec + (step.offDurationSec ?? 0));
  return step.durationSec ?? 0;
}

/** Workout plan with zone colours, repeats and the current step highlighted. */
export default function IntervalList({ execution }: { execution: WorkoutExecution }) {
  const t = cockpitMessages.useT();
  const tokens = useTokens();
  const steps = execution.stepsSnapshot;
  const remainingMs = steps.slice(execution.currentStepIndex).reduce((total, step) => total + durationOf(step) * 1000, 0) - execution.stepElapsedMs;

  return (
    <Widget
      title={t('intervalList.title')}
      icon={<FormatListBulletedIcon />}
      action={<StatusPill size="sm" label={t('intervalList.remaining', { time: formatClock(Math.max(0, remainingMs)) })} />}
    >
      <Box component="ol" aria-label={t('intervalList.ariaLabel')} sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 0.75, maxHeight: { md: 420 }, overflowY: 'auto' }}>
        {steps.map((step, index) => {
          const pct = stepPct(step);
          const zone = pct != null ? getZoneForPower(pct) : null;
          const color = zone ? tokens.chart.zone[zone as keyof typeof tokens.chart.zone] : tokens.chart.tick;
          const current = index === execution.currentStepIndex;
          const done = index < execution.currentStepIndex;
          const target = stepTargetText(step, execution.ftpWatts, execution.intensityAdjustmentPct);
          return (
            <Box
              component="li"
              // Steps are an ordered snapshot of the plan; their position is their identity.
              // eslint-disable-next-line react/no-array-index-key
              key={`${index}-${step.type}`}
              aria-current={current ? 'step' : undefined}
              sx={{
                display: 'grid',
                gridTemplateColumns: '4px 1fr auto',
                gap: 1.25,
                alignItems: 'center',
                p: 1,
                pr: 1.25,
                borderRadius: `${tokens.radius.control}px`,
                bgcolor: current ? tokens.activeOverlay : 'transparent',
                border: '1px solid',
                borderColor: current ? alpha(tokens.chart.primary, 0.4) : 'transparent',
                opacity: done ? 0.5 : 1,
              }}
            >
              <Box sx={{ alignSelf: 'stretch', borderRadius: 4, bgcolor: color }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: current ? 750 : 600 }}>
                  {step.repeat ? `${step.repeat}× ` : ''}{stepLabel(step, index)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {step.repeat && step.onDurationSec
                    ? `${formatDurationShort(step.onDurationSec)} / ${formatDurationShort(step.offDurationSec ?? 0)}`
                    : formatDurationShort(step.durationSec)}
                </Typography>
              </Box>
              <Stack sx={{ alignItems: 'flex-end' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{target.watts}{target.watts !== '—' ? ' W' : ''}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{target.pct}</Typography>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Widget>
  );
}
