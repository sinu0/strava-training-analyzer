import { vi } from 'vitest';

import { NO_CAPABILITIES } from '../types';

import type { DeviceKind, DeviceReading, DeviceStatus, FitnessDevice, Trainer } from '../types';

/** Minimal in-memory device for session tests; push readings and statuses by hand. */
export function stubDevice(kind: DeviceKind, capabilities: Partial<DeviceStatus['capabilities']> = {}) {
  let status: DeviceStatus = {
    kind, state: 'CONNECTED', name: kind === 'trainer' ? 'SUITO' : 'HRM', batteryPct: 90, error: null,
    capabilities: { ...NO_CAPABILITIES, ...capabilities }, targetWatts: null,
  };
  const readingListeners = new Set<(reading: DeviceReading, at: number) => void>();
  const statusListeners = new Set<(value: DeviceStatus) => void>();
  const device = {
    kind,
    status: () => status,
    onStatus: (listener: (value: DeviceStatus) => void) => { statusListeners.add(listener); return () => { statusListeners.delete(listener); }; },
    onReading: (listener: (reading: DeviceReading, at: number) => void) => { readingListeners.add(listener); return () => { readingListeners.delete(listener); }; },
    disconnect: vi.fn(async () => undefined),
    setTargetPower: vi.fn(async (watts: number) => { status = { ...status, targetWatts: watts }; }),
    setResistance: vi.fn(async () => undefined),
    release: vi.fn(async () => undefined),
    push(reading: DeviceReading, at: number) { readingListeners.forEach((listener) => listener(reading, at)); },
    setStatus(patch: Partial<DeviceStatus>) { status = { ...status, ...patch }; statusListeners.forEach((listener) => listener(status)); },
  };
  return device as typeof device & (typeof kind extends 'trainer' ? Trainer : FitnessDevice);
}
