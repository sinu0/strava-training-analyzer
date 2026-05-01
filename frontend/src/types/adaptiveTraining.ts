export type TrainingIntent = 'VO2_MAX' | 'THRESHOLD' | 'ENDURANCE' | 'RECOVERY' | 'ANAEROBIC';

export type WorkoutOutcomeType = 'SUCCESS' | 'PARTIAL' | 'FAIL' | 'OVERACHIEVE';

export type FatigueDriftLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type HrvTrend = 'UP' | 'STABLE' | 'DOWN';

export type RestingHrTrend = 'UP' | 'STABLE' | 'DOWN';

export type SleepQuality = 'GOOD' | 'AVERAGE' | 'POOR';

export type FatigueStateLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type PerformanceTrend = 'SUCCESS' | 'MIXED' | 'FAIL';

export type ProgressionAction = 'PROGRESS' | 'MAINTAIN' | 'REGRESS';

export type AdjustmentAction = 'KEEP' | 'MODIFY' | 'REPLACE' | 'REMOVE';

export type IntensityAdjustment = 'UP' | 'DOWN' | 'SAME';

export type VolumeAdjustment = 'UP' | 'DOWN' | 'SAME';

export interface PlannedWorkoutInput {
  type: TrainingIntent;
  targetPower?: number;
  duration?: number;
  intervals?: number;
}

export interface RecentWorkoutInput {
  outcome: WorkoutOutcomeType;
  score: number;
  workoutType: TrainingIntent;
  fatigueDrift?: FatigueDriftLevel;
  hrResponse?: string;
}

export interface TrainingLoadStateInput {
  ctl: number;
  atl: number;
  tsb: number;
}

export interface FatigueSignalsInput {
  hrvTrend: HrvTrend;
  restingHrTrend: RestingHrTrend;
  sleepQuality: SleepQuality;
  subjectiveReadiness: number;
}

export interface ProgressionStateInput {
  vo2Level: number;
  thresholdLevel: number;
  enduranceLevel: number;
  recentIntensityDistribution?: string;
}

export interface AdaptiveTrainingRequest {
  plannedWorkouts: PlannedWorkoutInput[];
  recentWorkouts: RecentWorkoutInput[];
  trainingLoad: TrainingLoadStateInput;
  fatigueSignals: FatigueSignalsInput;
  progressionState: ProgressionStateInput;
}

export interface NewWorkout {
  type: TrainingIntent;
  intensityAdjustment: IntensityAdjustment;
  volumeAdjustment: VolumeAdjustment;
}

export interface WorkoutAdjustment {
  day: string;
  action: AdjustmentAction;
  reason: string;
  newWorkout: NewWorkout;
}

export interface AdaptiveStrategy {
  fatigueState: FatigueStateLevel;
  performanceTrend: PerformanceTrend;
  progressionAction: ProgressionAction;
}

export interface AdaptiveTrainingResponse {
  adjustments: WorkoutAdjustment[];
  strategy: AdaptiveStrategy;
  warnings: string[];
  insight: string;
}
