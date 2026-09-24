import { describe, expect, it, vi } from 'vitest';

import { WebBluetoothTransport } from '../ble/WebBluetoothTransport';
import { HEART_RATE_REQUEST, TRAINER_REQUEST } from '../bleDevices';

describe('Web Bluetooth adapter', () => {
  it('reports unavailability instead of throwing in unsupported browsers', async () => {
    const transport = new WebBluetoothTransport({} as Navigator);
    await expect(transport.isAvailable()).resolves.toBe(false);
    await expect(transport.knownDevices()).resolves.toEqual([]);
    await expect(transport.requestDevice(HEART_RATE_REQUEST)).rejects.toThrow(/Web Bluetooth/);
  });

  it('asks the chooser for FTMS, Cycling Power or Suito-named trainers', async () => {
    const requestDevice = vi.fn().mockResolvedValue({ id: 'abc', name: 'SUITO 42', gatt: {} });
    const transport = new WebBluetoothTransport({ bluetooth: { requestDevice, getAvailability: async () => true } } as unknown as Navigator);

    await expect(transport.requestDevice(TRAINER_REQUEST)).resolves.toEqual({ id: 'abc', name: 'SUITO 42' });
    expect(requestDevice).toHaveBeenCalledWith({
      filters: [{ services: [0x1826] }, { services: [0x1818] }, { namePrefix: 'SUITO' }, { namePrefix: 'Elite' }],
      optionalServices: [0x1826, 0x1818, 0x180f, 0x180a],
    });
  });
});
