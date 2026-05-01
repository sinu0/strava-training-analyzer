export type FormState = 'PEAK' | 'BUILDING' | 'FATIGUED' | 'DETRAINED';
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';
export type SleepQuality = 'GOOD' | 'AVERAGE' | 'POOR';

export interface TrainingLoadState {
  ctl: number;
  atl: number;
  tsb: number;
}

export interface RecentTrends {
  ctlTrend: TrendDirection;
  fatigueTrend: TrendDirection;
}

export interface PerformanceIndicators {
  ftp: number;
  ftpTrend: TrendDirection;
  tte?: number;
  durability?: string;
}

export interface RecoverySignals {
  hrvTrend: TrendDirection;
  restingHrTrend: TrendDirection;
  sleepQuality: SleepQuality;
}

export interface PerformancePredictionRequest {
  trainingLoad: TrainingLoadState;
  recentTrends?: RecentTrends;
  performanceIndicators?: PerformanceIndicators;
  recoverySignals?: RecoverySignals;
  recentWorkouts?: Array<{ outcome: string }>;
}

export interface PeakWindow {
  startInDays: number;
  durationDays: number;
}

export interface PerformanceDto {
  ftp: number;
  power20min: number;
}

export interface PerformancePredictionResponse {
  formState: FormState;
  readinessScore: number;
  peakWindow: PeakWindow;
  performancePrediction: PerformanceDto;
  recommendations: string[];
  confidence: number;
}

export interface CurrentPerformanceState {
  ctl: number;
  atl: number;
  tsb: number;
  ctlTrend: TrendDirection;
  fatigueTrend: TrendDirection;
  ftp: number;
  ftpTrend: TrendDirection;
  hrvTrend: TrendDirection;
  restingHrTrend: TrendDirection;
  sleepQuality: SleepQuality;
  recentSuccessCount: number;
  recentTotalCount: number;
}
