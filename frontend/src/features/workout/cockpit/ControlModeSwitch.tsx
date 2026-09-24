import TuneIcon from '@mui/icons-material/Tune';
import { Slider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { StatusPill, Widget } from '@/ui';

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
  const connected = trainer?.state === 'CONNECTED';
  const canErg = Boolean(connected && trainer?.capabilities.erg);
  const canResistance = Boolean(connected && trainer?.capabilities.resistance);
  const appliedWatts = trainer?.targetWatts ?? null;

  return (
    <Widget
      title="Sterowanie"
      icon={<TuneIcon />}
      action={mode === 'erg' && appliedWatts != null ? <StatusPill size="sm" tone="primary" variant="solid" dot label={`ERG ${appliedWatts} W`} /> : undefined}
    >
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={mode}
        onChange={(_, value: ControlMode | null) => value && onMode(value)}
        aria-label="Tryb sterowania trenażerem"
      >
        <ToggleButton value="erg" disabled={!canErg}>ERG</ToggleButton>
        <ToggleButton value="resistance" disabled={!canResistance}>Opór</ToggleButton>
        <ToggleButton value="free">Wolna</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'resistance' ? (
        <>
          <Typography id="resistance-label" variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>Opór: {resistancePct}%</Typography>
          <Slider value={resistancePct} min={0} max={100} step={5} onChange={(_, value) => onResistance(value as number)} aria-labelledby="resistance-label" />
        </>
      ) : null}
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
        {!connected ? 'Połącz trenażer, aby sterować oporem.'
          : mode === 'erg' ? (targetWatts != null ? `Trenażer trzyma cel ${targetWatts} W niezależnie od przełożenia i kadencji.` : 'Ten krok nie ma celu mocy — trenażer jedzie swobodnie.')
            : mode === 'resistance' ? 'Stały opór — moc zależy od Twojej kadencji i przełożenia.'
              : 'Trenażer bez sterowania. Jedź według podpowiedzi celu.'}
      </Typography>
    </Widget>
  );
}
