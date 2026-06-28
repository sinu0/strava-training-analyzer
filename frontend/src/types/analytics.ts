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

export interface WeatherScoringProfile {
  rideWindowStartHour: number;
  rideWindowEndHour: number;
  idealTemperatureMin: number;
  idealTemperatureMax: number;
  acceptableTemperatureMin: number;
  acceptableTemperatureMax: number;
  comfortableWindMax: number;
  riskyWindMax: number;
  drizzleMmMax: number;
  rainMmMax: number;
  temperatureWeight: number;
  windWeight: number;
  precipitationWeight: number;
  conditionWeight: number;
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
  dayType?: string;
  dayLabel?: string;
  dayFocus?: string;
  sessionVariants?: ReadinessSessionVariant[];
  tomorrowHint?: string;
  bestQualityWindowLabel?: string;
  qualityWindowSummary?: string;
  qualityWindows?: ReadinessQualityWindow[];
  healthSignals?: ReadinessHealthSignals;
  checkIn?: ReadinessCheckIn;
}

export interface ReadinessQualityWindow {
  date: string;
  label: string;
  score: number;
  recommendation: string;
  focus: string;
}

export interface ReadinessSessionVariant {
  title: string;
  durationMinutes: number;
  targetPower: string;
  targetTss: number;
  fuelingHint: string;
  recoveryHint: string;
}

export interface ReadinessHealthSignals {
  sourceDate: string;
  sleepScore?: number | null;
  bodyBattery?: number | null;
  restingHrBpm?: number | null;
  restingHrDelta?: number | null;
  scoreAdjustment: number;
}

export interface ReadinessCheckIn {
  date: string;
  sleepQuality: number;
  legFreshness: number;
  motivation: number;
  soreness: number;
  scoreAdjustment: number;
  updatedAt?: string | null;
}

export interface SaveReadinessCheckInInput {
  sleepQuality: number;
  legFreshness: number;
  motivation: number;
  soreness: number;
}

export interface DurabilityWorkout {
  activityId: string;
  date: string;
  name: string;
  durationMin: number;
  tss?: number | null;
  aerobicDecoupling?: number | null;
  powerFade?: number | null;
  durabilityScore?: number | null;
}

export interface DurabilityInsight {
  trend: string;
  label: string;
  description: string;
  avgAerobicDecoupling: number;
  avgPowerFade: number;
  avgDurabilityScore: number;
  workouts: DurabilityWorkout[];
}

export interface ProgressionLevel {
  system: string;
  label: string;
  level: number;
  currentLoad: number;
  previousLoad: number;
  targetLoad: number;
  trend: string;
  description: string;
  nextRecommendation: string;
}

export interface BlockHealth {
  status: string;
  label: string;
  description: string;
  objectiveLabel?: string | null;
  programGoal?: string | null;
  goalExecutionStatus?: string | null;
  goalExecutionScore?: number | null;
  adjustmentDays: number;
  missedStimulusDays: number;
  overloadDays: number;
  keySignals: string[];
  nextFocus?: string | null;
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

export interface WeeklyBudget {
  optimalTss: number;
  completedTss: number;
  remainingTss: number;
  percentComplete: number;
  status: string;
  weekStart: string;
  weekEnd: string;
}

export interface DailyOptimalLoad {
  date: string;
  actualTss: number | null;
  projectedTss: number | null;
  ctl: number;
  atl: number;
  tsb: number;
  optimalMin: number;
  optimalTarget: number;
  optimalMax: number;
  dangerThreshold: number;
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
