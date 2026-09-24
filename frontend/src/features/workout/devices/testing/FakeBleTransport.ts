import type { BleConnection, BleDeviceHandle, BleTransport, DeviceRequest } from '../ble/BleTransport';

type Listener = (value: DataView) => void;

interface FakeCharacteristic {
  value?: DataView;
  listeners: Set<Listener>;
  onWrite?: (value: DataView, peripheral: FakePeripheral) => void;
}

/** In-memory GATT server used by unit tests. */
export class FakePeripheral {
  readonly services = new Map<number, Map<number, FakeCharacteristic>>();
  readonly writes: Array<{ service: number; characteristic: number; bytes: number[] }> = [];
  connected = false;
  readonly disconnectListeners = new Set<() => void>();

  constructor(readonly id: string, readonly name: string) {}

  characteristic(service: number, characteristic: number, options: Partial<Omit<FakeCharacteristic, 'listeners'>> = {}): this {
    const chars = this.services.get(service) ?? new Map<number, FakeCharacteristic>();
    chars.set(characteristic, { listeners: new Set(), ...options });
    this.services.set(service, chars);
    return this;
  }

  get(service: number, characteristic: number): FakeCharacteristic {
    const found = this.services.get(service)?.get(characteristic);
    if (!found) throw new Error(`GATT characteristic ${characteristic.toString(16)} not found`);
    return found;
  }

  notify(service: number, characteristic: number, ...bytes: number[]) {
    const value = new DataView(Uint8Array.from(bytes).buffer);
    this.get(service, characteristic).listeners.forEach((listener) => listener(value));
  }

  dropConnection() {
    this.connected = false;
    this.disconnectListeners.forEach((listener) => listener());
  }
}

export class FakeBleTransport implements BleTransport {
  readonly peripherals = new Map<string, FakePeripheral>();
  available = true;
  /** Id returned by the next requestDevice call (the user's pick in the chooser). */
  chooser: string | null = null;
  failConnects = 0;
  connectCount = 0;
  requests: DeviceRequest[] = [];

  add(peripheral: FakePeripheral): FakePeripheral {
    this.peripherals.set(peripheral.id, peripheral);
    return peripheral;
  }

  async isAvailable() { return this.available; }

  async requestDevice(request: DeviceRequest): Promise<BleDeviceHandle> {
    this.requests.push(request);
    const chosen = this.chooser ? this.peripherals.get(this.chooser) : undefined;
    if (!chosen) throw new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError');
    return { id: chosen.id, name: chosen.name };
  }

  async knownDevices(): Promise<BleDeviceHandle[]> {
    return [...this.peripherals.values()].map((peripheral) => ({ id: peripheral.id, name: peripheral.name }));
  }

  async connect(device: BleDeviceHandle): Promise<BleConnection> {
    this.connectCount += 1;
    if (this.failConnects > 0) {
      this.failConnects -= 1;
      throw new DOMException('Connection failed', 'NetworkError');
    }
    const peripheral = this.peripherals.get(device.id);
    if (!peripheral) throw new DOMException('Unknown device', 'NotFoundError');
    peripheral.connected = true;
    return {
      device,
      hasService: async (service) => peripheral.services.has(service),
      read: async (service, characteristic) => {
        const value = peripheral.get(service, characteristic).value;
        if (!value) throw new DOMException('Not readable', 'NotSupportedError');
        return value;
      },
      write: async (service, characteristic, value) => {
        peripheral.writes.push({ service, characteristic, bytes: Array.from(new Uint8Array(value.buffer)) });
        peripheral.get(service, characteristic).onWrite?.(value, peripheral);
      },
      subscribe: async (service, characteristic, listener) => {
        const target = peripheral.get(service, characteristic);
        target.listeners.add(listener);
        return () => target.listeners.delete(listener);
      },
      onDisconnect: (listener) => {
        peripheral.disconnectListeners.add(listener);
        return () => peripheral.disconnectListeners.delete(listener);
      },
      disconnect: () => {
        peripheral.connected = false;
        peripheral.services.forEach((chars) => chars.forEach((char) => char.listeners.clear()));
      },
    };
  }
}
