import BluetoothDisabledIcon from '@mui/icons-material/BluetoothDisabled';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Alert, Box, Button, CircularProgress, Drawer, FormControlLabel, IconButton, Stack, Switch, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IconBubble, StatusPill, Surface } from '@/ui';

import { DEVICE_TITLE, deviceStateText, deviceTone } from './deviceLabels';
import { cockpitMessages } from './messages';

import type { DeviceKind, DeviceStatus } from '../devices/types';
import type { TrainerSessionApi } from '../devices/useTrainerSession';

function capabilityPills(status: DeviceStatus) {
  const { capabilities } = status;
  return [
    capabilities.erg && cockpitMessages.t('deviceSheet.capabilities.erg'),
    capabilities.resistance && cockpitMessages.t('deviceSheet.capabilities.resistance'),
    capabilities.power && cockpitMessages.t('deviceSheet.capabilities.power'),
    capabilities.cadence && cockpitMessages.t('deviceSheet.capabilities.cadence'),
    capabilities.heartRate && cockpitMessages.t('deviceSheet.capabilities.heartRate'),
  ].filter((value): value is string => Boolean(value));
}

function DeviceCard({ kind, api }: { kind: DeviceKind; api: TrainerSessionApi }) {
  const t = cockpitMessages.useT();
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
            {status?.name ?? (kind === 'trainer' ? t('deviceSheet.trainerFallbackName') : t('deviceSheet.hrFallbackName'))} · {deviceStateText(status)}
          </Typography>
        </Box>
        {connected ? (
          <Button size="small" onClick={() => void api.disconnect(kind)}>{t('deviceSheet.disconnect')}</Button>
        ) : (
          <Button size="small" variant="contained" disabled={busy} onClick={() => void api.connect(kind)} startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}>
            {t('deviceSheet.connect')}
          </Button>
        )}
      </Stack>
      {status ? (
        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.25 }}>
          {status.batteryPct != null ? <StatusPill size="sm" label={t('deviceSheet.battery', { pct: status.batteryPct })} tone={status.batteryPct < 20 ? 'warning' : 'neutral'} /> : null}
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
  const t = cockpitMessages.useT();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const unsupported = api.sourceKind === 'bluetooth' && api.bluetoothAvailable === false;

  return (
    <Drawer anchor={wide ? 'right' : 'bottom'} open={open} onClose={onClose} slotProps={{ paper: { sx: { width: wide ? 420 : 'auto', maxHeight: wide ? '100%' : '88dvh', p: 2.5 } } }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">{t('deviceSheet.title')}</Typography>
        <IconButton aria-label={t('deviceSheet.close')} onClick={onClose}><CloseIcon /></IconButton>
      </Stack>
      {api.sourceKind === 'simulation' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('deviceSheet.demoIntro')} <code>?devices=sim</code> {t('deviceSheet.demoSuffix')}
        </Alert>
      ) : null}
      {unsupported ? (
        <Alert severity="warning" icon={<BluetoothDisabledIcon />} sx={{ mb: 2 }}>
          {t('deviceSheet.unsupportedIntro')}
          {' '}<code>chrome://flags/#enable-web-bluetooth</code>{t('deviceSheet.unsupportedMiddle')}
          {' '}<a href="?devices=sim">{t('deviceSheet.demoModeLink')}</a>.
        </Alert>
      ) : null}
      <Stack spacing={1.5}>
        <DeviceCard kind="trainer" api={api} />
        <DeviceCard kind="heartRate" api={api} />
      </Stack>
      {api.connectError ? <Alert severity="error" sx={{ mt: 2 }}>{api.connectError}</Alert> : null}
      <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
        {t('deviceSheet.garminNote')}
      </Alert>
      <Surface variant="outlined" padding="sm" radius="panel" sx={{ mt: 2 }}>
        <FormControlLabel
          control={<Switch checked={recording} disabled={recordingLocked} onChange={(event) => onRecordingChange(event.target.checked)} />}
          label={t('deviceSheet.recordSwitch')}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('deviceSheet.recordHint')}
        </Typography>
      </Surface>
    </Drawer>
  );
}
