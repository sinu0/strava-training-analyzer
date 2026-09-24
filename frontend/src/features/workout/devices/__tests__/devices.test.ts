import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GATT } from '../ble/gatt';
import { FtmsResult } from '../ble/protocol/ftmsControlPoint';
import { connectHeartRate, connectTrainer, HEART_RATE_REQUEST, TRAINER_REQUEST } from '../bleDevices';
import { FakeBleTransport } from '../testing/FakeBleTransport';
import { fakeFtmsTrainer, fakeHeartRateStrap, fakePowerOnlyTrainer } from '../testing/peripherals';

async function flush() {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

describe('heart rate strap', () => {
  it('connects through the chooser, reports battery and heart rate', async () => {
    const transport = new FakeBleTransport();
    const strap = transport.add(fakeHeartRateStrap());
    transport.chooser = strap.id;
    const device = await connectHeartRate(transport);
    const readings: number[] = [];
    device.onReading((reading) => { if (reading.heartRateBpm != null) readings.push(reading.heartRateBpm); });

    strap.notify(GATT.heartRateService, GATT.heartRateMeasurement, 0b0000_0110, 138);

    expect(transport.requests[0]).toEqual(HEART_RATE_REQUEST);
    expect(device.status()).toMatchObject({ state: 'CONNECTED', name: 'HRM-Pro:123456', batteryPct: 80 });
    expect(device.status().capabilities.heartRate).toBe(true);
    expect(readings).toEqual([138]);
  });

  it('reports no heart rate while the strap has lost skin contact', async () => {
    const transport = new FakeBleTransport();
    const strap = transport.add(fakeHeartRateStrap());
    transport.chooser = strap.id;
    const device = await connectHeartRate(transport);
    const readings: Array<number | null | undefined> = [];
    device.onReading((reading) => readings.push(reading.heartRateBpm));
    strap.notify(GATT.heartRateService, GATT.heartRateMeasurement, 0b0000_0100, 0);
    expect(readings).toEqual([null]);
  });
});

describe('FTMS trainer (Elite Suito)', () => {
  it('takes control, exposes ERG and streams power, cadence and speed', async () => {
    const transport = new FakeBleTransport();
    const suito = transport.add(fakeFtmsTrainer());
    transport.chooser = suito.id;
    const trainer = await connectTrainer(transport);
    const readings: unknown[] = [];
    trainer.onReading((reading) => readings.push(reading));

    suito.notify(GATT.fitnessMachineService, GATT.indoorBikeData, 0x44, 0x00, 0xb0, 0x0f, 0xb4, 0x00, 0xc8, 0x00);

    expect(transport.requests[0]).toEqual(TRAINER_REQUEST);
    expect(trainer.status()).toMatchObject({ state: 'CONNECTED', name: 'SUITO 12345', batteryPct: 64 });
    expect(trainer.status().capabilities).toMatchObject({ erg: true, resistance: true, power: true, cadence: true, speed: true });
    expect(suito.writes[0]?.bytes).toEqual([0x00]);
    expect(readings).toEqual([{ powerWatts: 200, cadenceRpm: 90, speedKph: 40.16 }]);
  });

  it('writes ERG targets through the control point and reports the applied target', async () => {
    const transport = new FakeBleTransport();
    const suito = transport.add(fakeFtmsTrainer());
    transport.chooser = suito.id;
    const trainer = await connectTrainer(transport);

    await trainer.setTargetPower(215);
    await trainer.setResistance(50);
    await trainer.release();

    expect(suito.writes.map((write) => write.bytes)).toEqual([[0x00], [0x07], [0x05, 0xd7, 0x00], [0x04, 128], [0x08, 0x02]]);
    expect(trainer.status().targetWatts).toBeNull();
  });

  it('surfaces a refused command without breaking the session', async () => {
    const transport = new FakeBleTransport();
    const suito = transport.add(fakeFtmsTrainer({ result: FtmsResult.ControlNotPermitted }));
    transport.chooser = suito.id;
    const trainer = await connectTrainer(transport);

    await expect(trainer.setTargetPower(200)).rejects.toThrow(/sterowania/);
    expect(trainer.status().state).toBe('CONNECTED');
    expect(trainer.status().error).toMatch(/Inna aplikacja/);
  });

  it('falls back to the Cycling Power service without ERG and derives cadence', async () => {
    const transport = new FakeBleTransport();
    const meter = transport.add(fakePowerOnlyTrainer());
    transport.chooser = meter.id;
    const trainer = await connectTrainer(transport);
    const cadence: Array<number | null | undefined> = [];
    trainer.onReading((reading) => cadence.push(reading.cadenceRpm));

    meter.notify(GATT.cyclingPowerService, GATT.cyclingPowerMeasurement, 0x20, 0x00, 0xfa, 0x00, 0x0a, 0x00, 0x00, 0x04);
    meter.notify(GATT.cyclingPowerService, GATT.cyclingPowerMeasurement, 0x20, 0x00, 0xfa, 0x00, 0x0b, 0x00, 0x00, 0x07);

    expect(trainer.status().capabilities).toMatchObject({ erg: false, resistance: false, power: true, cadence: true });
    expect(cadence).toEqual([undefined, 80]);
    await expect(trainer.setTargetPower(200)).rejects.toThrow(/ERG/);
  });
});

describe('automatic reconnection', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reconnects with backoff after the link drops and restores ERG', async () => {
    const transport = new FakeBleTransport();
    const suito = transport.add(fakeFtmsTrainer());
    transport.chooser = suito.id;
    const trainer = await connectTrainer(transport);
    await trainer.setTargetPower(180);
    const states: string[] = [];
    trainer.onStatus((status) => states.push(status.state));

    transport.failConnects = 1;
    suito.dropConnection();
    expect(trainer.status().state).toBe('RECONNECTING');

    await vi.advanceTimersByTimeAsync(1_000);
    await flush();
    expect(trainer.status().state).toBe('RECONNECTING');
    await vi.advanceTimersByTimeAsync(2_000);
    await flush();

    expect(trainer.status().state).toBe('CONNECTED');
    expect(transport.connectCount).toBe(3);
    expect(suito.writes[suito.writes.length - 1]?.bytes).toEqual([0x05, 0xb4, 0x00]);
    expect(states).toContain('RECONNECTING');
  });

  it('does not reconnect after the rider disconnects on purpose', async () => {
    const transport = new FakeBleTransport();
    const strap = transport.add(fakeHeartRateStrap());
    transport.chooser = strap.id;
    const device = await connectHeartRate(transport);
    await device.disconnect();
    strap.dropConnection();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(device.status().state).toBe('IDLE');
    expect(transport.connectCount).toBe(1);
  });
});
