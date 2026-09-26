import TuneIcon from '@mui/icons-material/Tune';
import { Slider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { StatusPill, Widget } from '@/ui';

import { cockpitMessages } from './messages';

import type { ControlMode } from '../devices/trainerSession';
import type { DeviceStatus } from '../devices/types';

interface ControlModeSwitchProps {
  mode: ControlMode;
  resistancePct: number;
  trainer: DeviceStatus | undefined;
  targetWatts: number | null;
  onMode(mode: ControlMode): void;
  onResistance(percent: number): void;
}

/** ERG, manual resistance or free ride — how the trainer is driven. */
export default function ControlModeSwitch({ mode, resistancePct, trainer, targetWatts, onMode, onResistance }: ControlModeSwitchProps) {
  const t = cockpitMessages.useT();
  const connected = trainer?.state === 'CONNECTED';
  const canErg = Boolean(connected && trainer?.capabilities.erg);
  const canResistance = Boolean(connected && trainer?.capabilities.resistance);
  const appliedWatts = trainer?.targetWatts ?? null;

  return (
    <Widget
      title={t('controlMode.title')}
      icon={<TuneIcon />}
      action={mode === 'erg' && appliedWatts != null ? <StatusPill size="sm" tone="primary" variant="solid" dot label={t('controlMode.ergBadge', { watts: appliedWatts })} /> : undefined}
    >
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={mode}
        onChange={(_, value: ControlMode | null) => value && onMode(value)}
        aria-label={t('controlMode.ariaLabel')}
      >
        <ToggleButton value="erg" disabled={!canErg}>ERG</ToggleButton>
        <ToggleButton value="resistance" disabled={!canResistance}>{t('controlMode.resistance')}</ToggleButton>
        <ToggleButton value="free">{t('controlMode.free')}</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'resistance' ? (
        <>
          <Typography id="resistance-label" variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>{t('controlMode.resistancePct', { pct: resistancePct })}</Typography>
          <Slider value={resistancePct} min={0} max={100} step={5} onChange={(_, value) => onResistance(value as number)} aria-labelledby="resistance-label" />
        </>
      ) : null}
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
        {!connected ? t('controlMode.needsConnection')
          : mode === 'erg' ? (targetWatts != null ? t('controlMode.ergHoldsTarget', { watts: targetWatts }) : t('controlMode.ergNoTarget'))
            : mode === 'resistance' ? t('controlMode.resistanceHint')
              : t('controlMode.freeHint')}
      </Typography>
    </Widget>
  );
}
