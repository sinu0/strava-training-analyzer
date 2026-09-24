import { FakePeripheral } from './FakeBleTransport';
import { GATT } from '../ble/gatt';
import { FtmsOpCode, FtmsResult } from '../ble/protocol/ftmsControlPoint';


function bytes(...values: number[]) {
  return new DataView(Uint8Array.from(values).buffer);
}

/** A Garmin HRM-Pro-like strap: heart rate + battery. */
export function fakeHeartRateStrap(id = 'hrm', name = 'HRM-Pro:123456') {
  return new FakePeripheral(id, name)
    .characteristic(GATT.heartRateService, GATT.heartRateMeasurement)
    .characteristic(GATT.batteryService, GATT.batteryLevel, { value: bytes(80) });
}

/**
 * An Elite Suito-like FTMS trainer. Control point writes are answered with the
 * given result through an indication, like real hardware.
 */
export function fakeFtmsTrainer({ id = 'suito', name = 'SUITO 12345', result = FtmsResult.Success as number } = {}) {
  const machine = (1 << 1) | (1 << 14);
  const target = (1 << 2) | (1 << 3) | (1 << 13);
  const peripheral = new FakePeripheral(id, name)
    .characteristic(GATT.fitnessMachineService, GATT.fitnessMachineFeature, {
      value: bytes(machine & 0xff, (machine >> 8) & 0xff, 0, 0, target & 0xff, (target >> 8) & 0xff, 0, 0),
    })
    .characteristic(GATT.fitnessMachineService, GATT.supportedPowerRange, { value: bytes(0, 0, 0xdc, 0x05, 1, 0) })
    .characteristic(GATT.fitnessMachineService, GATT.supportedResistanceRange, { value: bytes(0, 0, 0xe8, 0x03, 0x0a, 0) })
    .characteristic(GATT.fitnessMachineService, GATT.indoorBikeData)
    .characteristic(GATT.fitnessMachineService, GATT.fitnessMachineStatus)
    .characteristic(GATT.batteryService, GATT.batteryLevel, { value: bytes(64) });
  peripheral.characteristic(GATT.fitnessMachineService, GATT.fitnessMachineControlPoint, {
    onWrite: (value, owner) => {
      queueMicrotask(() => owner.notify(GATT.fitnessMachineService, GATT.fitnessMachineControlPoint, FtmsOpCode.ResponseCode, value.getUint8(0), result));
    },
  });
  return peripheral;
}

/** A power-meter-only trainer (Cycling Power Service, no FTMS control). */
export function fakePowerOnlyTrainer(id = 'cps', name = 'Smart Trainer') {
  return new FakePeripheral(id, name).characteristic(GATT.cyclingPowerService, GATT.cyclingPowerMeasurement);
}
