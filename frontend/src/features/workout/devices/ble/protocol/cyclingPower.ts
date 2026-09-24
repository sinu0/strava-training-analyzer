export interface CrankRevolutions {
  /** Cumulative crank revolutions (uint16, wraps). */
  revolutions: number;
  /** Last crank event time in 1/1024 s (uint16, wraps). */
  eventTime: number;
}

export interface CyclingPowerMeasurement {
  powerWatts: number;
  balancePct: number | null;
  crank: CrankRevolutions | null;
}

/** Cycling Power Measurement (0x2A63), Cycling Power Service 0x1818. */
export function parseCyclingPower(data: DataView): CyclingPowerMeasurement {
  const flags = data.getUint16(0, true);
  let offset = 2;
  const powerWatts = data.getInt16(offset, true);
  offset += 2;
  let balancePct: number | null = null;
  if (flags & 0x0001) {
    balancePct = data.getUint8(offset) / 2;
    offset += 1;
  }
  if (flags & 0x0004) offset += 2; // accumulated torque
  if (flags & 0x0010) offset += 6; // wheel revolutions (uint32) + last wheel event (uint16)
  let crank: CrankRevolutions | null = null;
  if (flags & 0x0020) {
    crank = { revolutions: data.getUint16(offset, true), eventTime: data.getUint16(offset + 2, true) };
  }
  return { powerWatts, balancePct, crank };
}

/** Cadence in rpm from two crank samples; null when no new crank event arrived. */
export function crankCadence(previous: CrankRevolutions, next: CrankRevolutions): number | null {
  const revolutions = (next.revolutions - previous.revolutions + 0x10000) % 0x10000;
  const ticks = (next.eventTime - previous.eventTime + 0x10000) % 0x10000;
  if (revolutions === 0 || ticks === 0) return null;
  return Math.round((revolutions / (ticks / 1024)) * 60);
}
