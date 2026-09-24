import { GATT } from './ble/gatt';
import { parseBatteryLevel } from './ble/protocol/battery';
import { crankCadence, parseCyclingPower, type CrankRevolutions } from './ble/protocol/cyclingPower';
import {
  encodeRequestControl, encodeSetTargetPower, encodeSetTargetResistance, encodeStartOrResume, encodeStopOrPause,
  FtmsResult, parseControlPointResponse,
} from './ble/protocol/ftmsControlPoint';
import { parseFitnessMachineFeature, parseSupportedRange, type SupportedRange } from './ble/protocol/ftmsFeature';
import { parseHeartRate } from './ble/protocol/heartRate';
import { parseIndoorBikeData } from './ble/protocol/indoorBikeData';
import { NO_CAPABILITIES } from './types';

import type { BleConnection, BleDeviceHandle, BleTransport, DeviceRequest } from './ble/BleTransport';
import type { DeviceCapabilities, DeviceKind, DeviceReading, DeviceStatus, FitnessDevice, Trainer } from './types';

export const HEART_RATE_REQUEST: DeviceRequest = {
  anyOfServices: [GATT.heartRateService],
  optionalServices: [GATT.batteryService],
};

export const TRAINER_REQUEST: DeviceRequest = {
  anyOfServices: [GATT.fitnessMachineService, GATT.cyclingPowerService],
  optionalServices: [GATT.batteryService, GATT.deviceInformation],
  namePrefixes: ['SUITO', 'Elite'],
};

const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];
const COMMAND_TIMEOUT_MS = 3_000;
const CADENCE_STALE_MS = 3_000;
/** FTMS encodes the target resistance as UINT8 with 0.1 resolution. */
const MAX_RESISTANCE_LEVEL = 25.5;
const CONTROL_REFUSED = 'Inna aplikacja lub licznik steruje trenażerem. Wyłącz sterowanie trenażerem w Garminie/Zwifcie i spróbuj ponownie.';

type Listener<T extends unknown[]> = (...args: T) => void;

/**
 * Connection lifecycle shared by every Bluetooth device: status, listeners and
 * reconnection with backoff until the rider disconnects on purpose.
 */
abstract class BleDevice implements FitnessDevice {
  private current: DeviceStatus;
  private readonly statusListeners = new Set<Listener<[DeviceStatus]>>();
  private readonly readingListeners = new Set<Listener<[DeviceReading, number]>>();
  private readonly cleanups: Array<() => void> = [];
  private connection: BleConnection | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByUser = false;

  protected constructor(
    readonly kind: DeviceKind,
    protected readonly transport: BleTransport,
    protected readonly handle: BleDeviceHandle,
  ) {
    this.current = {
      kind, state: 'IDLE', name: handle.name, batteryPct: null, error: null, capabilities: NO_CAPABILITIES, targetWatts: null,
    };
  }

  status() { return this.current; }

  onStatus(listener: Listener<[DeviceStatus]>) {
    this.statusListeners.add(listener);
    return () => { this.statusListeners.delete(listener); };
  }

  onReading(listener: Listener<[DeviceReading, number]>) {
    this.readingListeners.add(listener);
    return () => { this.readingListeners.delete(listener); };
  }

  async start(): Promise<void> {
    this.closedByUser = false;
    this.update({ state: 'CONNECTING', error: null });
    await this.open();
  }

  async disconnect(): Promise<void> {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.teardown();
    this.connection?.disconnect();
    this.connection = null;
    this.update({ state: 'IDLE' });
  }

  protected update(patch: Partial<DeviceStatus>) {
    this.current = { ...this.current, ...patch };
    this.statusListeners.forEach((listener) => listener(this.current));
  }

  protected emit(reading: DeviceReading) {
    const at = Date.now();
    this.readingListeners.forEach((listener) => listener(reading, at));
  }

  protected link(): BleConnection {
    if (!this.connection) throw new Error('Urządzenie nie jest połączone');
    return this.connection;
  }

  protected track(cleanup: () => void) { this.cleanups.push(cleanup); }

  /** Subscribes, reads capabilities and restores state on the fresh connection. */
  protected abstract setup(connection: BleConnection): Promise<void>;

  private async open() {
    const connection = await this.transport.connect(this.handle);
    this.connection = connection;
    this.track(connection.onDisconnect(() => this.handleDrop()));
    try {
      const battery = await connection.read(GATT.batteryService, GATT.batteryLevel).then(parseBatteryLevel).catch(() => null);
      await this.setup(connection);
      this.reconnectAttempt = 0;
      this.update({ state: 'CONNECTED', batteryPct: battery ?? this.current.batteryPct });
    } catch (error) {
      this.teardown();
      connection.disconnect();
      this.connection = null;
      throw error;
    }
  }

  private teardown() {
    this.cleanups.splice(0).forEach((cleanup) => cleanup());
  }

  private handleDrop() {
    if (this.closedByUser) return;
    this.teardown();
    this.connection = null;
    this.update({ state: 'RECONNECTING' });
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)] ?? 30_000;
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.closedByUser) return;
      this.open().catch(() => {
        if (!this.closedByUser) this.scheduleReconnect();
      });
    }, delay);
  }
}

class HeartRateBleDevice extends BleDevice {
  constructor(transport: BleTransport, handle: BleDeviceHandle) {
    super('heartRate', transport, handle);
  }

  protected async setup(connection: BleConnection) {
    this.update({ capabilities: { ...NO_CAPABILITIES, heartRate: true } });
    this.track(await connection.subscribe(GATT.heartRateService, GATT.heartRateMeasurement, (value) => {
      const measurement = parseHeartRate(value);
      const valid = measurement.contactDetected !== false && measurement.heartRateBpm > 0;
      this.emit({ heartRateBpm: valid ? measurement.heartRateBpm : null });
    }));
  }
}

interface PendingCommand {
  opCode: number;
  resolve: (ok: boolean) => void;
}

/** FTMS trainer (e.g. Elite Suito) with ERG/resistance control, or a Cycling Power fallback without control. */
class TrainerBleDevice extends BleDevice implements Trainer {
  private ftms = false;
  private hasControl = false;
  private resistanceRange: SupportedRange | null = null;
  private powerRange: SupportedRange | null = null;
  private pending: PendingCommand | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private lastCrank: { sample: CrankRevolutions; changedAt: number } | null = null;
  private lastTarget: number | null = null;

  constructor(transport: BleTransport, handle: BleDeviceHandle) {
    super('trainer', transport, handle);
  }

  protected async setup(connection: BleConnection) {
    this.hasControl = false;
    this.ftms = await connection.hasService(GATT.fitnessMachineService);
    if (this.ftms) {
      await this.setupFtms(connection);
    } else if (await connection.hasService(GATT.cyclingPowerService)) {
      await this.setupCyclingPower(connection);
    } else {
      throw new Error('Urządzenie nie udostępnia danych mocy (FTMS ani Cycling Power)');
    }
  }

  async setTargetPower(watts: number): Promise<void> {
    this.requireControlSupport('erg');
    const bounded = this.powerRange ? Math.max(this.powerRange.min, Math.min(this.powerRange.max, watts)) : watts;
    await this.command(encodeSetTargetPower(bounded));
    this.lastTarget = bounded;
    this.update({ targetWatts: bounded });
  }

  async setResistance(percent: number): Promise<void> {
    this.requireControlSupport('resistance');
    const range = this.resistanceRange ?? { min: 0, max: MAX_RESISTANCE_LEVEL, increment: 0.1 };
    const top = Math.min(MAX_RESISTANCE_LEVEL, range.max);
    const bottom = Math.max(0, Math.min(range.min, top));
    const level = bottom + ((top - bottom) * Math.max(0, Math.min(100, percent))) / 100;
    await this.command(encodeSetTargetResistance(level));
    this.lastTarget = null;
    this.update({ targetWatts: null });
  }

  async release(): Promise<void> {
    this.lastTarget = null;
    this.update({ targetWatts: null });
    if (!this.ftms || !this.hasControl) return;
    await this.command(encodeStopOrPause('pause')).catch(() => undefined);
  }

  private requireControlSupport(kind: 'erg' | 'resistance') {
    if (!this.status().capabilities[kind]) {
      throw new Error(kind === 'erg' ? 'Ten trenażer nie obsługuje trybu ERG przez Bluetooth' : 'Ten trenażer nie obsługuje sterowania oporem');
    }
  }

  private async setupFtms(connection: BleConnection) {
    const features = parseFitnessMachineFeature(await connection.read(GATT.fitnessMachineService, GATT.fitnessMachineFeature));
    this.powerRange = await connection.read(GATT.fitnessMachineService, GATT.supportedPowerRange)
      .then((value) => parseSupportedRange(value)).catch(() => null);
    this.resistanceRange = await connection.read(GATT.fitnessMachineService, GATT.supportedResistanceRange)
      .then((value) => parseSupportedRange(value, 0.1)).catch(() => null);
    const capabilities: DeviceCapabilities = {
      ...NO_CAPABILITIES,
      // Indoor Bike Data carries instantaneous power on every FTMS trainer we target.
      power: true,
      cadence: features.cadence,
      heartRate: features.heartRate,
      speed: true,
      erg: features.erg,
      resistance: features.resistance,
      simulation: features.simulation,
    };
    this.update({ capabilities });

    this.track(await connection.subscribe(GATT.fitnessMachineService, GATT.indoorBikeData, (value) => {
      const data = parseIndoorBikeData(value);
      const reading: DeviceReading = {};
      if (data.powerWatts != null) reading.powerWatts = Math.max(0, data.powerWatts);
      if (data.cadenceRpm != null) reading.cadenceRpm = data.cadenceRpm;
      if (data.speedKph != null) reading.speedKph = data.speedKph;
      if (data.heartRateBpm) reading.heartRateBpm = data.heartRateBpm;
      this.emit(reading);
    }));
    this.track(await connection.subscribe(GATT.fitnessMachineService, GATT.fitnessMachineControlPoint, (value) => {
      const response = parseControlPointResponse(value);
      if (response && this.pending && response.requestOpCode === this.pending.opCode) {
        const pending = this.pending;
        this.pending = null;
        pending.resolve(response.ok);
      }
    }));

    if (capabilities.erg || capabilities.resistance) {
      await this.takeControl();
      if (this.hasControl) {
        await this.command(encodeStartOrResume()).catch(() => undefined);
        if (this.lastTarget != null) await this.setTargetPower(this.lastTarget).catch(() => undefined);
      }
    }
  }

  private async setupCyclingPower(connection: BleConnection) {
    this.update({ capabilities: { ...NO_CAPABILITIES, power: true, cadence: true } });
    this.track(await connection.subscribe(GATT.cyclingPowerService, GATT.cyclingPowerMeasurement, (value) => {
      const measurement = parseCyclingPower(value);
      const reading: DeviceReading = { powerWatts: Math.max(0, measurement.powerWatts) };
      const now = Date.now();
      if (measurement.crank) {
        if (this.lastCrank) {
          const cadence = crankCadence(this.lastCrank.sample, measurement.crank);
          if (cadence != null) {
            reading.cadenceRpm = cadence;
            this.lastCrank = { sample: measurement.crank, changedAt: now };
          } else if (now - this.lastCrank.changedAt > CADENCE_STALE_MS) {
            reading.cadenceRpm = 0;
          }
        } else {
          this.lastCrank = { sample: measurement.crank, changedAt: now };
        }
      }
      this.emit(reading);
    }));
  }

  private async takeControl() {
    const ok = await this.send(encodeRequestControl());
    this.hasControl = ok;
    this.update({ error: ok ? null : CONTROL_REFUSED });
    return ok;
  }

  /** Serialises control point writes: one command at a time, each awaiting its indication. */
  private command(value: DataView): Promise<void> {
    const run = async () => {
      if (!this.hasControl && !(await this.takeControl())) {
        throw new Error('Trenażer odmówił przejęcia sterowania');
      }
      const ok = await this.send(value);
      if (!ok) throw new Error('Trenażer odrzucił polecenie sterowania');
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private send(value: DataView): Promise<boolean> {
    const opCode = value.getUint8(0);
    return new Promise<boolean>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending?.opCode === opCode) this.pending = null;
        reject(new Error('Trenażer nie potwierdził polecenia w ciągu 3 s'));
      }, COMMAND_TIMEOUT_MS);
      this.pending = {
        opCode,
        resolve: (ok) => {
          clearTimeout(timer);
          if (!ok && opCode !== 0x00) this.update({ error: 'Trenażer odrzucił polecenie sterowania' });
          resolve(ok);
        },
      };
      this.link().write(GATT.fitnessMachineService, GATT.fitnessMachineControlPoint, value).catch((error: unknown) => {
        clearTimeout(timer);
        this.pending = null;
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }
}

/** Opens the browser chooser (or reuses a granted device) and connects a heart rate strap. */
export async function connectHeartRate(transport: BleTransport, handle?: BleDeviceHandle): Promise<FitnessDevice> {
  const device = new HeartRateBleDevice(transport, handle ?? await transport.requestDevice(HEART_RATE_REQUEST));
  await device.start();
  return device;
}

/** Opens the browser chooser (or reuses a granted device) and connects a smart trainer. */
export async function connectTrainer(transport: BleTransport, handle?: BleDeviceHandle): Promise<Trainer> {
  const device = new TrainerBleDevice(transport, handle ?? await transport.requestDevice(TRAINER_REQUEST));
  await device.start();
  return device;
}

export { FtmsResult };
