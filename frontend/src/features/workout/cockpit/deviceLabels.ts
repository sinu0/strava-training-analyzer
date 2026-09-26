import { localized } from '@/i18n';
import type { Tone } from '@/ui';

import { cockpitMessages } from './messages';

import type { DeviceStatus } from '../devices/types';

export const DEVICE_TITLE = localized({
  pl: { trainer: 'Trenażer', heartRate: 'Pasek HR' },
  en: { trainer: 'Trainer', heartRate: 'HR strap' },
});

export function deviceTone(status: DeviceStatus | undefined): Tone {
  if (!status) return 'neutral';
  if (status.state === 'CONNECTED') return status.error ? 'warning' : 'success';
  if (status.state === 'RECONNECTING' || status.state === 'CONNECTING') return 'warning';
  if (status.state === 'ERROR') return 'error';
  return 'neutral';
}

export function deviceStateText(status: DeviceStatus | undefined): string {
  if (!status) return cockpitMessages.t('deviceLabels.state.none');
  return {
    IDLE: cockpitMessages.t('deviceLabels.state.idle'),
    CONNECTING: cockpitMessages.t('deviceLabels.state.connecting'),
    CONNECTED: cockpitMessages.t('deviceLabels.state.connected'),
    RECONNECTING: cockpitMessages.t('deviceLabels.state.reconnecting'),
    ERROR: cockpitMessages.t('deviceLabels.state.error'),
  }[status.state];
}
