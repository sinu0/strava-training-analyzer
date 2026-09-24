/**
 * The only abstraction over Web Bluetooth. Devices talk to this port, so tests
 * and simulators replace the radio without touching protocol or UI code.
 */
export interface BleDeviceHandle {
  id: string;
  name: string | null;
}

export interface BleConnection {
  readonly device: BleDeviceHandle;
  hasService(service: number): Promise<boolean>;
  read(service: number, characteristic: number): Promise<DataView>;
  write(service: number, characteristic: number, value: DataView): Promise<void>;
  /** Starts notifications/indications; resolves to an unsubscribe function. */
  subscribe(service: number, characteristic: number, listener: (value: DataView) => void): Promise<() => void>;
  onDisconnect(listener: () => void): () => void;
  disconnect(): void;
}

export interface DeviceRequest {
  /** Any of these services identifies the device in the browser chooser. */
  anyOfServices: number[];
  optionalServices?: number[];
  namePrefixes?: string[];
}

export interface BleTransport {
  isAvailable(): Promise<boolean>;
  requestDevice(request: DeviceRequest): Promise<BleDeviceHandle>;
  /** Devices the user already granted, reconnectable without the chooser (when the browser supports it). */
  knownDevices(): Promise<BleDeviceHandle[]>;
  connect(device: BleDeviceHandle): Promise<BleConnection>;
}
