export type TrainingIntent = 'VO2_MAX' | 'THRESHOLD' | 'ENDURANCE' | 'RECOVERY' | 'ANAEROBIC';

export type WorkoutOutcomeType = 'SUCCESS' | 'PARTIAL' | 'FAIL' | 'OVERACHIEVE';

export type HrResponseLevel = 'LOW' | 'OK' | 'HIGH';

export type FatigueDriftLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type ExecutionStabilityLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type FatigueStateLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type TrainingLoadTrendType = 'INCREASING' | 'STABLE' | 'DECREASING';

export interface WorkoutEvaluationRequest {
  trainingIntent: TrainingIntent;
  planned: PlannedWorkout;
  actual: ExecutedWorkout;
  derived: DerivedMetrics;
  historical: HistoricalContext;
  recovery: RecoveryContext;
  athleteFtpWatts?: number;
  athleteHrMaxBpm?: number;
  athleteRestingHrBpm?: number;
}

export interface PlannedWorkout {
  targetPowerW?: number;
  targetPowerPctFtp?: number;
  targetDurationSec?: number;
  plannedIntervals?: number;
  intervalDurationSec?: number;
  intervalPowerW?: number;
  intervalPowerPctFtp?: number;
  targetZoneDistribution?: Record<string, number>;
}

export interface ExecutedWorkout {
  avgPowerW?: number;
  normalizedPowerW?: number;
  actualDurationSec?: number;
  completedIntervals?: number;
  timeInZones?: Record<string, number>;
  avgHeartRateBpm?: number;
  maxHeartRateBpm?: number;
  avgCadence?: number;
}

export interface DerivedMetrics {
  tss?: number;
  intensityFactor?: number;
  decouplingPwHr?: number;
  variabilityIndex?: number;
  intervalPowerValues?: number[];
  intervalHeartRateValues?: number[];
}

export interface HistoricalContext {
  last7DaysTss?: number;
  last28DaysTss?: number;
  ctl?: number;
  atl?: number;
  tsb?: number;
  recentWorkoutOutcomes?: string[];
  recentIntensityFactor?: number;
}

export interface RecoveryContext {
  hrvTrend?: number;
  restingHrBpm?: number;
  sleepQuality?: number;
  subjectiveReadinessScore?: number;
}

export interface WorkoutEvaluationResponse {
  outcome: WorkoutOutcomeType;
  score: number;
  confidence: number;
  reasons: string[];
  analysis: {
    powerCompliance: number;
    intervalCompletion: number;
    timeInZoneAccuracy: number;
    hrResponse: HrResponseLevel;
    fatigueDrift: FatigueDriftLevel;
    executionStability: ExecutionStabilityLevel;
  };
  contextualFactors: {
    fatigueState: FatigueStateLevel;
    recentFailures: boolean;
    trainingLoadTrend: TrainingLoadTrendType;
  };
  insight: string;
  recommendation: string;
}
