import { describe, expect, it } from 'vitest';

import { parseBatteryLevel } from '../ble/protocol/battery';
import { crankCadence, parseCyclingPower } from '../ble/protocol/cyclingPower';
import {
  encodeRequestControl, encodeReset, encodeSetIndoorBikeSimulation, encodeSetTargetPower,
  encodeSetTargetResistance, encodeStartOrResume, encodeStopOrPause, FtmsOpCode, FtmsResult, parseControlPointResponse,
} from '../ble/protocol/ftmsControlPoint';
import { parseFitnessMachineFeature, parseSupportedRange } from '../ble/protocol/ftmsFeature';
import { parseHeartRate } from '../ble/protocol/heartRate';
import { parseIndoorBikeData } from '../ble/protocol/indoorBikeData';

function view(...bytes: number[]): DataView {
  return new DataView(Uint8Array.from(bytes).buffer);
}

function bytes(data: ArrayBuffer | DataView): number[] {
  const buffer = data instanceof DataView ? data.buffer : data;
  return Array.from(new Uint8Array(buffer));
}

describe('Heart Rate Measurement (0x2A37)', () => {
  it('reads uint8 heart rate with contact detected', () => {
    // flags: uint8 format, contact supported + detected (bits 1-2 = 0b11)
    expect(parseHeartRate(view(0b0000_0110, 142))).toEqual({ heartRateBpm: 142, contactDetected: true, energyExpendedKj: null, rrIntervalsMs: [] });
  });

  it('reads uint16 heart rate, energy and RR intervals', () => {
    // flags: uint16 (bit0) + energy (bit3) + RR (bit4); HR 300, energy 1000 kJ, RR 1024 and 512 (1/1024 s)
    const parsed = parseHeartRate(view(0b0001_1001, 0x2c, 0x01, 0xe8, 0x03, 0x00, 0x04, 0x00, 0x02));
    expect(parsed.heartRateBpm).toBe(300);
    expect(parsed.energyExpendedKj).toBe(1000);
    expect(parsed.rrIntervalsMs).toEqual([1000, 500]);
    expect(parsed.contactDetected).toBeNull();
  });

  it('reports lost contact when the sensor supports detection', () => {
    expect(parseHeartRate(view(0b0000_0100, 0)).contactDetected).toBe(false);
  });
});

describe('Cycling Power Measurement (0x2A63)', () => {
  it('reads instantaneous power only', () => {
    expect(parseCyclingPower(view(0x00, 0x00, 0xfa, 0x00))).toEqual({ powerWatts: 250, balancePct: null, crank: null });
  });

  it('skips optional fields to reach crank revolution data', () => {
    // flags: balance (bit0) + accumulated torque (bit2) + wheel (bit4) + crank (bit5) = 0x35
    const data = view(
      0x35, 0x00,
      0x2c, 0x01, // power 300
      100, // balance 50 %
      0x10, 0x00, // accumulated torque
      0x01, 0x00, 0x00, 0x00, 0x00, 0x08, // wheel revs + time
      0x0a, 0x00, 0x00, 0x04, // crank revs 10, event time 1024
    );
    expect(parseCyclingPower(data)).toEqual({ powerWatts: 300, balancePct: 50, crank: { revolutions: 10, eventTime: 1024 } });
  });

  it('negative power is preserved as signed', () => {
    expect(parseCyclingPower(view(0x00, 0x00, 0xff, 0xff)).powerWatts).toBe(-1);
  });

  it('derives cadence from crank deltas across counter rollover', () => {
    // one revolution in 0.75 s → 80 rpm
    expect(crankCadence({ revolutions: 65535, eventTime: 65000 }, { revolutions: 0, eventTime: (65000 + 768) % 65536 })).toBe(80);
    expect(crankCadence({ revolutions: 10, eventTime: 1024 }, { revolutions: 10, eventTime: 1024 })).toBeNull();
  });
});

describe('Indoor Bike Data (0x2AD2)', () => {
  it('reads speed, cadence and power with inverted More Data flag', () => {
    // flags: speed present (bit0 = 0), cadence (bit2), power (bit6) = 0x0044
    const data = view(0x44, 0x00, 0xb0, 0x0f, 0xb4, 0x00, 0xc8, 0x00);
    expect(parseIndoorBikeData(data)).toEqual({ speedKph: 40.16, cadenceRpm: 90, powerWatts: 200 });
  });

  it('skips average and energy fields and reads heart rate and elapsed time', () => {
    // More Data (no speed), avg speed, distance, resistance, power, energy, HR, elapsed time
    const flags = (1 << 0) | (1 << 1) | (1 << 4) | (1 << 5) | (1 << 6) | (1 << 8) | (1 << 9) | (1 << 11);
    const data = view(
      flags & 0xff, flags >> 8,
      0x10, 0x27, // avg speed
      0xe8, 0x03, 0x00, // distance 1000 m
      0x14, 0x00, // resistance 20
      0x96, 0x00, // power 150
      0x64, 0x00, 0x2c, 0x01, 0x05, // energy total, per hour, per minute
      0x8c, // HR 140
      0x3c, 0x00, // elapsed 60 s
    );
    expect(parseIndoorBikeData(data)).toEqual({ distanceM: 1000, resistanceLevel: 20, powerWatts: 150, heartRateBpm: 140, elapsedSec: 60 });
  });
});

describe('Fitness Machine Control Point (0x2AD9)', () => {
  it('encodes control, reset, start and stop commands', () => {
    expect(bytes(encodeRequestControl())).toEqual([0x00]);
    expect(bytes(encodeReset())).toEqual([0x01]);
    expect(bytes(encodeStartOrResume())).toEqual([0x07]);
    expect(bytes(encodeStopOrPause('pause'))).toEqual([0x08, 0x02]);
    expect(bytes(encodeStopOrPause('stop'))).toEqual([0x08, 0x01]);
  });

  it('encodes target power as signed int16 and clamps it', () => {
    expect(bytes(encodeSetTargetPower(250))).toEqual([0x05, 0xfa, 0x00]);
    expect(bytes(encodeSetTargetPower(-20))).toEqual([0x05, 0x00, 0x00]);
    expect(bytes(encodeSetTargetPower(5000))).toEqual([0x05, 0xd0, 0x07]);
  });

  it('encodes resistance in 0.1 units and simulation parameters', () => {
    expect(bytes(encodeSetTargetResistance(12.5))).toEqual([0x04, 125]);
    // wind 0 m/s, grade 5.00 %, crr 0.004, cw 0.51
    expect(bytes(encodeSetIndoorBikeSimulation({ gradePct: 5, windSpeedMps: 0, crr: 0.004, cwKgPerM: 0.51 })))
      .toEqual([0x11, 0x00, 0x00, 0xf4, 0x01, 40, 51]);
  });

  it('parses responses and rejects unrelated notifications', () => {
    expect(parseControlPointResponse(view(0x80, FtmsOpCode.SetTargetPower, FtmsResult.Success)))
      .toEqual({ requestOpCode: FtmsOpCode.SetTargetPower, result: FtmsResult.Success, ok: true });
    expect(parseControlPointResponse(view(0x80, FtmsOpCode.RequestControl, FtmsResult.ControlNotPermitted)).ok).toBe(false);
    expect(parseControlPointResponse(view(0x05, 0x00))).toBeNull();
  });
});

describe('Fitness Machine Feature (0x2ACC) and ranges', () => {
  it('maps feature bits to capabilities', () => {
    // machine: cadence (bit1) + power measurement (bit14); target: resistance (bit2) + power (bit3) + simulation (bit13)
    const machine = (1 << 1) | (1 << 14);
    const target = (1 << 2) | (1 << 3) | (1 << 13);
    const data = view(machine & 0xff, (machine >> 8) & 0xff, 0, 0, target & 0xff, (target >> 8) & 0xff, 0, 0);
    expect(parseFitnessMachineFeature(data)).toEqual({ cadence: true, power: true, heartRate: false, erg: true, resistance: true, simulation: true });
  });

  it('reads supported power and resistance ranges', () => {
    expect(parseSupportedRange(view(0x00, 0x00, 0xdc, 0x05, 0x01, 0x00))).toEqual({ min: 0, max: 1500, increment: 1 });
    expect(parseSupportedRange(view(0x00, 0x00, 0xe8, 0x03, 0x0a, 0x00), 0.1)).toEqual({ min: 0, max: 100, increment: 1 });
  });

  it('reads battery level', () => {
    expect(parseBatteryLevel(view(87))).toBe(87);
  });
});
