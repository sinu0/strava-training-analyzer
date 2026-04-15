export interface StreamDataPoint {
  index: number;
  time: number;
  power: number | null;
  hr: number | null;
  cadence: number | null;
  altitude: number | null;
  velocity: number | null;
}

export interface BrushRange {
  startIndex: number;
  endIndex: number;
}

export interface SelectionStats {
  avgPower: number | null;
  avgHr: number | null;
  avgCadence: number | null;
  avgSpeed: number | null;
  duration: number;
  distance: number;
  elevGain: number;
}
