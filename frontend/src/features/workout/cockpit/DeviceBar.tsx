import BluetoothIcon from '@mui/icons-material/Bluetooth';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Button, Stack } from '@mui/material';

import { StatusPill } from '@/ui';

import { deviceStateText, deviceTone } from './deviceLabels';
import { cockpitMessages } from './messages';

import type { DeviceKind, DeviceStatus } from '../devices/types';

interface DeviceBarProps {
  devices: Partial<Record<DeviceKind, DeviceStatus>>;
  recording: boolean;
  onOpen(): void;
}

/** Glanceable device health: trainer, strap and recording state. */
export default function DeviceBar({ devices, recording, onOpen }: DeviceBarProps) {
  const t = cockpitMessages.useT();
  const trainer = devices.trainer;
  const strap = devices.heartRate;
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
      <StatusPill
        size="sm"
        dot
        tone={deviceTone(trainer)}
        icon={<DirectionsBikeIcon />}
        label={trainer?.state === 'CONNECTED' ? `${trainer.name ?? t('deviceBar.trainerFallback')}${trainer.batteryPct != null ? ` · ${trainer.batteryPct}%` : ''}` : t('deviceBar.trainerStatus', { status: deviceStateText(trainer) })}
      />
      <StatusPill
        size="sm"
        dot
        tone={deviceTone(strap)}
        icon={<FavoriteIcon />}
        label={strap?.state === 'CONNECTED' ? `${strap.name ?? t('deviceBar.hrFallback')}${strap.batteryPct != null ? ` · ${strap.batteryPct}%` : ''}` : t('deviceBar.hrStatus', { status: deviceStateText(strap) })}
      />
      {recording ? <StatusPill size="sm" tone="error" variant="solid" icon={<FiberManualRecordIcon />} label="REC" /> : null}
      <Button size="small" variant="outlined" startIcon={<BluetoothIcon />} onClick={onOpen}>{t('deviceBar.devicesButton')}</Button>
    </Stack>
  );
}
