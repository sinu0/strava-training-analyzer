import type { BleConnection, BleDeviceHandle, BleTransport, DeviceRequest } from './BleTransport';

type BluetoothNavigator = Navigator & { bluetooth?: Bluetooth & { getDevices?: () => Promise<BluetoothDevice[]> } };

/** Browser adapter: the only module that touches `navigator.bluetooth`. */
export class WebBluetoothTransport implements BleTransport {
  private readonly devices = new Map<string, BluetoothDevice>();

  constructor(private readonly nav: BluetoothNavigator = navigator as BluetoothNavigator) {}

  async isAvailable(): Promise<boolean> {
    if (!this.nav.bluetooth) return false;
    try {
      return await this.nav.bluetooth.getAvailability();
    } catch {
      return false;
    }
  }

  async requestDevice(request: DeviceRequest): Promise<BleDeviceHandle> {
    const bluetooth = this.requireBluetooth();
    const filters: BluetoothLEScanFilter[] = [
      ...request.anyOfServices.map((service) => ({ services: [service] })),
      ...(request.namePrefixes ?? []).map((namePrefix) => ({ namePrefix })),
    ];
    const device = await bluetooth.requestDevice({
      filters,
      optionalServices: [...request.anyOfServices, ...(request.optionalServices ?? [])],
    });
    return this.remember(device);
  }

  async knownDevices(): Promise<BleDeviceHandle[]> {
    const getDevices = this.nav.bluetooth?.getDevices;
    if (!getDevices) return [];
    try {
      const devices = await getDevices.call(this.nav.bluetooth);
      return devices.map((device) => this.remember(device));
    } catch {
      return [];
    }
  }

  async connect(handle: BleDeviceHandle): Promise<BleConnection> {
    const device = this.devices.get(handle.id);
    if (!device?.gatt) throw new Error('Urządzenie nie jest już dostępne. Połącz je ponownie z listy.');
    const server = await device.gatt.connect();
    const services = new Map<number, BluetoothRemoteGATTService | null>();
    const service = async (uuid: number) => {
      if (!services.has(uuid)) services.set(uuid, await server.getPrimaryService(uuid).catch(() => null));
      const found = services.get(uuid);
      if (!found) throw new Error(`Brak usługi Bluetooth 0x${uuid.toString(16)}`);
      return found;
    };
    const characteristic = async (serviceUuid: number, uuid: number) => (await service(serviceUuid)).getCharacteristic(uuid);

    return {
      device: handle,
      hasService: async (uuid) => service(uuid).then(() => true, () => false),
      read: async (serviceUuid, uuid) => (await characteristic(serviceUuid, uuid)).readValue(),
      write: async (serviceUuid, uuid, value) => {
        const target = await characteristic(serviceUuid, uuid);
        const bytes = new Uint8Array(value.byteLength);
        bytes.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
        await (target.writeValueWithResponse ? target.writeValueWithResponse(bytes) : target.writeValue(bytes));
      },
      subscribe: async (serviceUuid, uuid, listener) => {
        const target = await characteristic(serviceUuid, uuid);
        const onChange = (event: Event) => {
          const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
          if (value) listener(value);
        };
        target.addEventListener('characteristicvaluechanged', onChange);
        await target.startNotifications();
        return () => {
          target.removeEventListener('characteristicvaluechanged', onChange);
          if (device.gatt?.connected) void target.stopNotifications().catch(() => undefined);
        };
      },
      onDisconnect: (listener) => {
        device.addEventListener('gattserverdisconnected', listener);
        return () => device.removeEventListener('gattserverdisconnected', listener);
      },
      disconnect: () => device.gatt?.disconnect(),
    };
  }

  private requireBluetooth() {
    if (!this.nav.bluetooth) {
      throw new Error('Ta przeglądarka nie obsługuje Web Bluetooth. Użyj Chrome lub Edge na komputerze albo Chrome na Androidzie (HTTPS).');
    }
    return this.nav.bluetooth;
  }

  private remember(device: BluetoothDevice): BleDeviceHandle {
    this.devices.set(device.id, device);
    return { id: device.id, name: device.name ?? null };
  }
}
