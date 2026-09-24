import BluetoothDisabledIcon from '@mui/icons-material/BluetoothDisabled';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Alert, Box, Button, CircularProgress, Drawer, FormControlLabel, IconButton, Stack, Switch, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IconBubble, StatusPill, Surface } from '@/ui';

import { DEVICE_TITLE, deviceStateText, deviceTone } from './deviceLabels';

import type { DeviceKind, DeviceStatus } from '../devices/types';
import type { TrainerSessionApi } from '../devices/useTrainerSession';

function capabilityPills(status: DeviceStatus) {
  const { capabilities } = status;
  return [
    capabilities.erg && 'ERG',
    capabilities.resistance && 'opór',
    capabilities.power && 'moc',
    capabilities.cadence && 'kadencja',
    capabilities.heartRate && 'tętno',
  ].filter((value): value is string => Boolean(value));
}

function DeviceCard({ kind, api }: { kind: DeviceKind; api: TrainerSessionApi }) {
  const status = api.snapshot.devices[kind];
  const connected = status && status.state !== 'IDLE';
  const busy = Boolean(api.connecting[kind]);
  return (
    <Surface variant="muted" padding="sm" radius="panel">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <IconBubble tone={deviceTone(status)}>{kind === 'trainer' ? <DirectionsBikeIcon /> : <FavoriteIcon />}</IconBubble>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" component="h3">{DEVICE_TITLE[kind]}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {status?.name ?? (kind === 'trainer' ? 'Elite Suito lub inny trenażer FTMS' : 'Garmin HRM-Dual / Pro / 600')} · {deviceStateText(status)}
          </Typography>
        </Box>
        {connected ? (
          <Button size="small" onClick={() => void api.disconnect(kind)}>Rozłącz</Button>
        ) : (
          <Button size="small" variant="contained" disabled={busy} onClick={() => void api.connect(kind)} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}>
            Połącz
          </Button>
        )}
      </Stack>
      {status ? (
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.25 }}>
          {status.batteryPct != null ? <StatusPill size="sm" label={`bateria ${status.batteryPct}%`} tone={status.batteryPct < 20 ? 'warning' : 'neutral'} /> : null}
          {capabilityPills(status).map((label) => <StatusPill key={label} size="sm" variant="outline" label={label} />)}
        </Stack>
      ) : null}
      {status?.error ? <Alert severity="warning" sx={{ mt: 1.25 }}>{status.error}</Alert> : null}
    </Surface>
  );
}

interface DeviceSheetProps {
  open: boolean;
  onClose(): void;
  api: TrainerSessionApi;
  recording: boolean;
  onRecordingChange(value: boolean): void;
  recordingLocked: boolean;
}

/** Pairing and device health, plus the in-app recording switch. */
export default function DeviceSheet({ open, onClose, api, recording, onRecordingChange, recordingLocked }: DeviceSheetProps) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const unsupported = api.sourceKind === 'bluetooth' && api.bluetoothAvailable === false;

  return (
    <Drawer anchor={wide ? 'right' : 'bottom'} open={open} onClose={onClose} slotProps={{ paper: { sx: { width: wide ? 420 : 'auto', maxHeight: wide ? '100%' : '88dvh', p: 2.5 } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">Urządzenia</Typography>
        <IconButton aria-label="Zamknij panel urządzeń" onClick={onClose}><CloseIcon /></IconButton>
      </Stack>
      {api.sourceKind === 'simulation' ? <Alert severity="info" sx={{ mb: 2 }}>Tryb demo: trenażer i pasek są symulowane. Usuń <code>?devices=sim</code> z adresu, aby użyć prawdziwych urządzeń.</Alert> : null}
      {unsupported ? (
        <Alert severity="warning" icon={<BluetoothDisabledIcon />} sx={{ mb: 2 }}>
          Ta przeglądarka nie udostępnia Web Bluetooth. Użyj Chrome/Edge na komputerze (na Linuksie z BlueZ; w razie potrzeby włącz
          {' '}<code>chrome://flags/#enable-web-bluetooth</code>) albo Chrome na Androidzie przez HTTPS. Możesz też sprawdzić kokpit w
          {' '}<a href="?devices=sim">trybie demo</a>.
        </Alert>
      ) : null}
      <Stack spacing={1.5}>
        <DeviceCard kind="trainer" api={api} />
        <DeviceCard kind="heartRate" api={api} />
      </Stack>
      {api.connectError ? <Alert severity="error" sx={{ mt: 2 }}>{api.connectError}</Alert> : null}
      <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
        Jeśli jednocześnie nagrywasz na Garminie, pozwól mu tylko odczytywać dane z Suito (bez sterowania trenażerem). Trenażer może słuchać jednej aplikacji sterującej.
      </Alert>
      <Surface variant="outlined" padding="sm" radius="panel" sx={{ mt: 2 }}>
        <FormControlLabel
          control={<Switch checked={recording} disabled={recordingLocked} onChange={(event) => onRecordingChange(event.target.checked)} />}
          label="Nagrywaj przejazd w aplikacji"
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Zapisuje moc, tętno i kadencję co sekundę i pozwala pobrać plik FIT po treningu. Wyłączone: przejazd nagrywa Garmin, ocena przyjdzie po synchronizacji ze Stravą.
        </Typography>
      </Surface>
    </Drawer>
  );
}
