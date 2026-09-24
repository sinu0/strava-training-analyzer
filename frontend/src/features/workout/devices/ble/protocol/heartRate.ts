export interface HeartRateMeasurement {
  heartRateBpm: number;
  /** null when the strap does not report skin contact. */
  contactDetected: boolean | null;
  energyExpendedKj: number | null;
  rrIntervalsMs: number[];
}

/** Heart Rate Measurement (0x2A37), Bluetooth Heart Rate Service 0x180D. */
export function parseHeartRate(data: DataView): HeartRateMeasurement {
  const flags = data.getUint8(0);
  const wide = (flags & 0x01) !== 0;
  const contactSupported = (flags & 0x04) !== 0;
  const contactDetected = contactSupported ? (flags & 0x02) !== 0 : null;
  let offset = 1;
  const heartRateBpm = wide ? data.getUint16(offset, true) : data.getUint8(offset);
  offset += wide ? 2 : 1;
  let energyExpendedKj: number | null = null;
  if (flags & 0x08) {
    energyExpendedKj = data.getUint16(offset, true);
    offset += 2;
  }
  const rrIntervalsMs: number[] = [];
  if (flags & 0x10) {
    for (; offset + 1 < data.byteLength; offset += 2) {
      rrIntervalsMs.push(Math.round((data.getUint16(offset, true) / 1024) * 1000));
    }
  }
  return { heartRateBpm, contactDetected, energyExpendedKj, rrIntervalsMs };
}
