export type MetricKey = 'distance' | 'time' | 'power' | 'hr';
export interface MaxValues {
  distance: number;
  time: number;
  power: number;
  hr: number;
  minDistance: number;
  minTime: number;
  minPower: number;
  minHr: number;
}
