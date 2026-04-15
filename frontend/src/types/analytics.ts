export interface PmcData {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  ctlDelta: number;
  atlDelta: number;
  tsbDelta: number;
}

export interface PowerCurve {
  efforts: Record<number, number>;
}

export interface WeeklySummary {
  weekStart: string;
  activityCount: number;
  totalDistanceM: number;
  totalTimeSec: number;
  totalElevationM: number;
  totalTss: number;
}

export interface ZoneDistribution {
  zoneType: string;
  zones: Record<string, number>;
  totalSeconds: number;
}

export interface TrendPoint {
  date: string;
  metricName: string;
  value: number;
}

export interface PeriodSummary {
  period?: string;
  from: string;
  to: string;
  activityCount: number;
  totalDistanceM: number;
  totalTimeSec: number;
  totalElevationM: number;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  outdoorScore: number;
  warnings: string[];
}

export interface HourlySlot {
  time: string;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface DailySlot {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitationSum: number;
  windSpeedMax: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface WeatherForecast {
  current: WeatherData;
  hourly: HourlySlot[];
  daily: DailySlot[];
}

export interface WeatherLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface HourScore {
  hour: string;
  score: number;
  temperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  humidity?: number;
  sunrise?: string;
  sunset?: string;
}

export interface GradientDay {
  date: string;
  dailyScore: number;
  bestWindowStart: string;
  bestWindowEnd: string;
  bestWindowScore: number;
  tempMin: number;
  tempMax: number;
  precipitationSum: number;
  windSpeedMax: number;
  weatherCode: number;
  weatherDescription: string;
  hourlyScores: HourScore[];
}

export interface WeatherGradient {
  locationName: string;
  current: WeatherData;
  days: GradientDay[];
}

export interface FtpProgress {
  currentFtp: number | null;
  trend: 'up' | 'down' | 'stagnant';
  changePercent: number;
  history: { date: string; value: number }[];
}

export interface ReadinessData {
  score: number;
  level: string;
  tsb: number;
  ctl: number;
  atl: number;
  description: string;
}


export interface WeeklyOptimalLoad {
  weekStart: string;
  activityCount: number;
  actualTss: number;
  ctl: number;
  optimalMin: number;
  optimalTarget: number;
  optimalMax: number;
  dangerThreshold: number;
  /** INSUFFICIENT | UNDER | OPTIMAL | OVER | DANGER | NO_DATA */
  status: string;
}

export interface DailyOptimalLoad {
  date: string;
  /** null for future projection days */
  actualTss: number | null;
  /** projected target for future days; null for historical rows */
  projectedTss: number | null;
  ctl: number;
  atl: number;
  tsb: number;
  optimalMin: number;
  optimalTarget: number;
  optimalMax: number;
  dangerThreshold: number;
  /** INSUFFICIENT | UNDER | OPTIMAL | OVER | DANGER | NO_DATA | FUTURE */
  status: string;
  future: boolean;
}


export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  unlocked: boolean;
  unlockedAt?: string;
}
