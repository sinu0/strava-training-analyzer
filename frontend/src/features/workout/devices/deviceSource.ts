import { WebBluetoothTransport } from './ble/WebBluetoothTransport';
import { connectHeartRate, connectTrainer, HEART_RATE_REQUEST, TRAINER_REQUEST } from './bleDevices';
import { createSimulatedRig, type SimulatedRig } from './simulation';

import type { BleTransport } from './ble/BleTransport';
import type { DeviceKind, FitnessDevice, Trainer } from './types';

export type DeviceSourceKind = 'bluetooth' | 'simulation';

/** Where the player gets its devices from: the real radio or the demo simulator. */
export interface DeviceSource {
  readonly kind: DeviceSourceKind;
  isAvailable(): Promise<boolean>;
  connectTrainer(): Promise<Trainer>;
  connectHeartRate(): Promise<FitnessDevice>;
  /** Reconnects devices remembered from earlier rides without the chooser, when the browser allows it. */
  reconnectKnown(kind: DeviceKind): Promise<FitnessDevice | null>;
  dispose(): void;
  /** Test/demo hook: the simulated rig, when this source is a simulation. */
  readonly simulation?: SimulatedRig;
}

const STORAGE_KEY = (kind: DeviceKind) => `trainer-device:${kind}`;

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* remembering the device is a convenience only */ }
}

export function bluetoothSource(transport: BleTransport = new WebBluetoothTransport()): DeviceSource {
  const remember = <T extends FitnessDevice>(kind: DeviceKind) => (device: T, id: string) => {
    writeStorage(STORAGE_KEY(kind), id);
    return device;
  };
  return {
    kind: 'bluetooth',
    isAvailable: () => transport.isAvailable(),
    async connectTrainer() {
      const handle = await transport.requestDevice(TRAINER_REQUEST);
      return remember<Trainer>('trainer')(await connectTrainer(transport, handle), handle.id);
    },
    async connectHeartRate() {
      const handle = await transport.requestDevice(HEART_RATE_REQUEST);
      return remember<FitnessDevice>('heartRate')(await connectHeartRate(transport, handle), handle.id);
    },
    async reconnectKnown(kind) {
      const id = readStorage(STORAGE_KEY(kind));
      if (!id) return null;
      const handle = (await transport.knownDevices()).find((candidate) => candidate.id === id);
      if (!handle) return null;
      try {
        return kind === 'trainer' ? await connectTrainer(transport, handle) : await connectHeartRate(transport, handle);
      } catch {
        return null;
      }
    },
    dispose() { /* devices own their connections */ },
  };
}

export function simulationSource(seed = 7): DeviceSource {
  const rig = createSimulatedRig({ seed });
  return {
    kind: 'simulation',
    simulation: rig,
    isAvailable: async () => true,
    connectTrainer: () => rig.connectTrainer(),
    connectHeartRate: () => rig.connectHeartRate(),
    reconnectKnown: async () => null,
    dispose: () => rig.dispose(),
  };
}

/** `?devices=sim` switches the player to the simulator (demo and end-to-end tests). */
export function resolveDeviceSource(search: string): DeviceSource {
  return new URLSearchParams(search).get('devices') === 'sim' ? simulationSource() : bluetoothSource();
}
