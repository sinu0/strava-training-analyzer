import type { Tone } from '@/ui';

import type { DeviceStatus } from '../devices/types';

export const DEVICE_TITLE = { trainer: 'Trenażer', heartRate: 'Pasek HR' } as const;

export function deviceTone(status: DeviceStatus | undefined): Tone {
  if (!status) return 'neutral';
  if (status.state === 'CONNECTED') return status.error ? 'warning' : 'success';
  if (status.state === 'RECONNECTING' || status.state === 'CONNECTING') return 'warning';
  if (status.state === 'ERROR') return 'error';
  return 'neutral';
}

export function deviceStateText(status: DeviceStatus | undefined): string {
  if (!status) return 'nie połączono';
  return {
    IDLE: 'rozłączono', CONNECTING: 'łączenie…', CONNECTED: 'połączono', RECONNECTING: 'utracono — ponawiam…', ERROR: 'błąd',
  }[status.state];
}
