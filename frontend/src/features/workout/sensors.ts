export type SensorConnectionState = 'UNAVAILABLE' | 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface SensorCapabilities {
  power: boolean;
  heartRate: boolean;
  cadence: boolean;
}

export interface SensorReading {
  timestamp: number;
  powerWatts: number | null;
  heartRateBpm: number | null;
  cadenceRpm: number | null;
}

export interface SensorGateway {
  capabilities(): SensorCapabilities;
  connectionState(): SensorConnectionState;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(listener: (reading: SensorReading) => void): () => void;
}

export interface TrainerCapabilities {
  erg: boolean;
  resistance: boolean;
}

export interface TrainerController {
  capabilities(): TrainerCapabilities;
  setTargetPower(watts: number): Promise<void>;
  setResistance(percent: number): Promise<void>;
  stop(): Promise<void>;
}

export class NoSensorGateway implements SensorGateway {
  capabilities(): SensorCapabilities { return { power: false, heartRate: false, cadence: false }; }
  connectionState(): SensorConnectionState { return 'UNAVAILABLE'; }
  async connect(): Promise<void> { return Promise.resolve(); }
  async disconnect(): Promise<void> { return Promise.resolve(); }
  subscribe(): () => void { return () => undefined; }
}

export class NoTrainerController implements TrainerController {
  capabilities(): TrainerCapabilities { return { erg: false, resistance: false }; }
  async setTargetPower(): Promise<void> { return Promise.resolve(); }
  async setResistance(): Promise<void> { return Promise.resolve(); }
  async stop(): Promise<void> { return Promise.resolve(); }
}
