export interface HrvTrend {
  current: number | null;
  periodAvg: number | null;
  sevenDayAvg: number | null;
  direction: string;
}

export interface SleepTrend {
  latestScore: number | null;
  avgScore: number | null;
  avgDurationSeconds: number | null;
}

export interface StressTrend {
  current: number | null;
  avg: number | null;
}

export interface RestingHrTrend {
  current: number | null;
  avg: number | null;
  direction: string;
}

export interface HealthOverview {
  latest: {
    date: string;
    restingHrBpm: number | null;
    hrvRmssd: number | null;
    sleepScore: number | null;
    sleepDurationSeconds: number | null;
    deepSleepSeconds: number | null;
    lightSleepSeconds: number | null;
    remSleepSeconds: number | null;
    awakeSleepSeconds: number | null;
    bodyBattery: number | null;
    stressAvg: number | null;
    steps: number | null;
    activeCalories: number | null;
  } | null;
  hrvTrend: HrvTrend;
  sleepTrend: SleepTrend;
  stressTrend: StressTrend;
  restingHrTrend: RestingHrTrend;
}

export interface HealthDay {
  date: string;
  restingHrBpm: number | null;
  hrvRmssd: number | null;
  sleepScore: number | null;
  sleepDurationSeconds: number | null;
  deepSleepSeconds: number | null;
  lightSleepSeconds: number | null;
  remSleepSeconds: number | null;
  awakeSleepSeconds: number | null;
  bodyBattery: number | null;
  stressAvg: number | null;
  steps: number | null;
  activeCalories: number | null;
}

export interface RecoveryStatus {
  score: number;
  level: string;
  description: string;
  alerts: string[];
}
