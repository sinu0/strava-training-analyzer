/** Contract between the workout player and any source of live data (Bluetooth or simulation). */

export type DeviceKind = 'trainer' | 'heartRate';

export type DeviceState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export interface DeviceCapabilities {
  power: boolean;
  cadence: boolean;
  heartRate: boolean;
  speed: boolean;
  /** Trainer can hold a target power (ERG). */
  erg: boolean;
  /** Trainer accepts a resistance level. */
  resistance: boolean;
  simulation: boolean;
}

export interface DeviceStatus {
  kind: DeviceKind;
  state: DeviceState;
  name: string | null;
  batteryPct: number | null;
  error: string | null;
  capabilities: DeviceCapabilities;
  /** Target currently applied by the trainer, when known. */
  targetWatts: number | null;
}

export interface DeviceReading {
  powerWatts?: number | null;
  cadenceRpm?: number | null;
  heartRateBpm?: number | null;
  speedKph?: number | null;
}

export interface FitnessDevice {
  readonly kind: DeviceKind;
  status(): DeviceStatus;
  onStatus(listener: (status: DeviceStatus) => void): () => void;
  onReading(listener: (reading: DeviceReading, atMs: number) => void): () => void;
  disconnect(): Promise<void>;
}

export interface TrainerControl {
  setTargetPower(watts: number): Promise<void>;
  /** 0–100 % of the trainer's supported resistance range. */
  setResistance(percent: number): Promise<void>;
  /** Stops ERG/resistance control so the trainer spins freely (pause, finish). */
  release(): Promise<void>;
}

export type Trainer = FitnessDevice & TrainerControl;

export const NO_CAPABILITIES: DeviceCapabilities = {
  power: false, cadence: false, heartRate: false, speed: false, erg: false, resistance: false, simulation: false,
};

export function isTrainer(device: FitnessDevice | null | undefined): device is Trainer {
  return device?.kind === 'trainer';
}
