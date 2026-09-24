export interface IndoorBikeData {
  speedKph?: number;
  cadenceRpm?: number;
  powerWatts?: number;
  heartRateBpm?: number;
  distanceM?: number;
  resistanceLevel?: number;
  elapsedSec?: number;
}

/** Indoor Bike Data (0x2AD2), Fitness Machine Service 0x1826. Only present fields are returned. */
export function parseIndoorBikeData(data: DataView): IndoorBikeData {
  const flags = data.getUint16(0, true);
  const result: IndoorBikeData = {};
  let offset = 2;
  const has = (bit: number) => (flags & (1 << bit)) !== 0;

  // Bit 0 is "More Data": instantaneous speed is present when it is NOT set.
  if (!has(0)) { result.speedKph = data.getUint16(offset, true) / 100; offset += 2; }
  if (has(1)) offset += 2; // average speed
  if (has(2)) { result.cadenceRpm = data.getUint16(offset, true) / 2; offset += 2; }
  if (has(3)) offset += 2; // average cadence
  if (has(4)) {
    result.distanceM = data.getUint16(offset, true) + (data.getUint8(offset + 2) << 16);
    offset += 3;
  }
  if (has(5)) { result.resistanceLevel = data.getInt16(offset, true); offset += 2; }
  if (has(6)) { result.powerWatts = data.getInt16(offset, true); offset += 2; }
  if (has(7)) offset += 2; // average power
  if (has(8)) offset += 5; // expended energy: total, per hour, per minute
  if (has(9)) { result.heartRateBpm = data.getUint8(offset); offset += 1; }
  if (has(10)) offset += 1; // metabolic equivalent
  if (has(11)) { result.elapsedSec = data.getUint16(offset, true); offset += 2; }
  return result;
}
