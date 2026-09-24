export interface FitnessMachineCapabilities {
  cadence: boolean;
  power: boolean;
  heartRate: boolean;
  /** Target power (ERG) supported. */
  erg: boolean;
  resistance: boolean;
  simulation: boolean;
}

/** Fitness Machine Feature (0x2ACC): machine features (uint32) + target setting features (uint32). */
export function parseFitnessMachineFeature(data: DataView): FitnessMachineCapabilities {
  const machine = data.getUint32(0, true);
  const target = data.byteLength >= 8 ? data.getUint32(4, true) : 0;
  return {
    cadence: (machine & (1 << 1)) !== 0,
    heartRate: (machine & (1 << 10)) !== 0,
    power: (machine & (1 << 14)) !== 0,
    resistance: (target & (1 << 2)) !== 0,
    erg: (target & (1 << 3)) !== 0,
    simulation: (target & (1 << 13)) !== 0,
  };
}

export interface SupportedRange {
  min: number;
  max: number;
  increment: number;
}

/** Supported Power Range (0x2AD8) or Supported Resistance Level Range (0x2AD6, resolution 0.1). */
export function parseSupportedRange(data: DataView, resolution = 1): SupportedRange {
  const scale = (value: number) => Math.round(value * resolution * 1000) / 1000;
  return {
    min: scale(data.getInt16(0, true)),
    max: scale(data.getInt16(2, true)),
    increment: scale(data.getUint16(4, true)),
  };
}
