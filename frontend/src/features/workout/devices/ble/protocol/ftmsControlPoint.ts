/** Fitness Machine Control Point (0x2AD9) op codes used by the trainer controller. */
export const FtmsOpCode = {
  RequestControl: 0x00,
  Reset: 0x01,
  SetTargetResistance: 0x04,
  SetTargetPower: 0x05,
  StartOrResume: 0x07,
  StopOrPause: 0x08,
  SetIndoorBikeSimulation: 0x11,
  ResponseCode: 0x80,
} as const;

export const FtmsResult = {
  Success: 0x01,
  NotSupported: 0x02,
  InvalidParameter: 0x03,
  OperationFailed: 0x04,
  ControlNotPermitted: 0x05,
} as const;

export interface ControlPointResponse {
  requestOpCode: number;
  result: number;
  ok: boolean;
}

const MAX_TARGET_POWER = 2000;

function command(opCode: number, ...payload: number[]): DataView {
  return new DataView(Uint8Array.from([opCode, ...payload]).buffer);
}

function int16(value: number): [number, number] {
  const clamped = Math.max(-32768, Math.min(32767, Math.round(value)));
  const unsigned = clamped < 0 ? clamped + 0x10000 : clamped;
  return [unsigned & 0xff, unsigned >> 8];
}

export const encodeRequestControl = () => command(FtmsOpCode.RequestControl);
export const encodeReset = () => command(FtmsOpCode.Reset);
export const encodeStartOrResume = () => command(FtmsOpCode.StartOrResume);
export const encodeStopOrPause = (mode: 'stop' | 'pause') => command(FtmsOpCode.StopOrPause, mode === 'stop' ? 0x01 : 0x02);

/** ERG target in watts (sint16, resolution 1 W). */
export function encodeSetTargetPower(watts: number): DataView {
  return command(FtmsOpCode.SetTargetPower, ...int16(Math.max(0, Math.min(MAX_TARGET_POWER, watts))));
}

/** Resistance level (uint8, resolution 0.1, unitless). */
export function encodeSetTargetResistance(level: number): DataView {
  return command(FtmsOpCode.SetTargetResistance, Math.max(0, Math.min(255, Math.round(level * 10))));
}

export interface SimulationParameters {
  gradePct: number;
  windSpeedMps: number;
  /** Rolling resistance coefficient (resolution 0.0001). */
  crr: number;
  /** Wind resistance coefficient in kg/m (resolution 0.01). */
  cwKgPerM: number;
}

export function encodeSetIndoorBikeSimulation({ gradePct, windSpeedMps, crr, cwKgPerM }: SimulationParameters): DataView {
  return command(
    FtmsOpCode.SetIndoorBikeSimulation,
    ...int16(windSpeedMps * 1000),
    ...int16(gradePct * 100),
    Math.max(0, Math.min(255, Math.round(crr / 0.0001))),
    Math.max(0, Math.min(255, Math.round(cwKgPerM / 0.01))),
  );
}

export function parseControlPointResponse(data: DataView): ControlPointResponse | null {
  if (data.byteLength < 3 || data.getUint8(0) !== FtmsOpCode.ResponseCode) return null;
  const result = data.getUint8(2);
  return { requestOpCode: data.getUint8(1), result, ok: result === FtmsResult.Success };
}
