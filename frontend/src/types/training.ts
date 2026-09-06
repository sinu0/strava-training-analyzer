import { TRAINING_ZONE_COLORS } from '@/utils/colors';

export interface WeekPhase {
  weekLabel: string;
  weekStart: string;
  phase: 'BASE' | 'BUILD' | 'PEAK' | 'RECOVERY';
  avgCtl: number;
  avgAtl: number;
  avgTsb: number;
  totalTss: number;
  avgIntensityFactor: number;
  totalDurationMin: number;
}

export interface TrainingPhaseAnalysis {
  phases: WeekPhase[];
  currentPhase: string;
  recommendation: string;
  periodizationScore: number;
}

export interface DailyProjection {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

export interface RaceReadinessProjection {
  raceDate: string;
  daysUntilRace: number;
  currentCtl: number;
  currentAtl: number;
  currentTsb: number;
  projectedCtl: number;
  projectedTsb: number;
  formAssessment: string;
  taperRecommendation: string;
  projections: DailyProjection[];
}

// --- Workout Templates ---

export interface WorkoutStep {
  type: 'warmup' | 'interval' | 'steady' | 'cooldown' | 'recovery' | 'freeRide' | 'ramp' | 'intervalOn';
  name?: string;
  instructions?: string;
  durationType?: 'TIME' | 'OPEN' | 'LAP_BUTTON' | string;
  durationSec?: number;
  powerPctFtpLow?: number;
  powerPctFtpHigh?: number;
  heartRateBpmLow?: number;
  heartRateBpmHigh?: number;
  cadenceRpmLow?: number;
  cadenceRpmHigh?: number;
  repeat?: number;
  onDurationSec?: number;
  onPowerPctFtpLow?: number;
  onPowerPctFtpHigh?: number;
  onHeartRateBpmLow?: number;
  onHeartRateBpmHigh?: number;
  onCadenceRpmLow?: number;
  onCadenceRpmHigh?: number;
  offDurationSec?: number;
  offPowerPctFtpLow?: number;
  offPowerPctFtpHigh?: number;
  offHeartRateBpmLow?: number;
  offHeartRateBpmHigh?: number;
  offCadenceRpmLow?: number;
  offCadenceRpmHigh?: number;
}

export type WorkoutCategory =
  | 'RECOVERY'
  | 'ENDURANCE'
  | 'TEMPO'
  | 'SWEET_SPOT'
  | 'THRESHOLD'
  | 'VO2MAX'
  | 'ANAEROBIC'
  | 'SPRINT';

export interface WorkoutTemplate {
  id: string;
  revisionId?: string | null;
  revision?: number;
  name: string;
  category: WorkoutCategory;
  description: string | null;
  targetTss: number;
  targetDurationMin: number;
  relativeEffort: number;
  intensityFactor: number;
  steps: WorkoutStep[];
  createdBy: string;
  createdAt: string;
}

export const ZONE_COLORS_TRAINING: Record<string, string> = TRAINING_ZONE_COLORS;

export function getZoneForPower(pctFtp: number): string {
  if (pctFtp < 56) return 'Z1';
  if (pctFtp < 76) return 'Z2';
  if (pctFtp < 91) return 'Z3';
  if (pctFtp < 106) return 'Z4';
  if (pctFtp < 121) return 'Z5';
  if (pctFtp < 151) return 'Z6';
  return 'Z7';
}

export const CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  RECOVERY: 'Regeneracja',
  ENDURANCE: 'Wytrzymałość',
  TEMPO: 'Tempo',
  SWEET_SPOT: 'Sweet Spot',
  THRESHOLD: 'Próg',
  VO2MAX: 'VO2max',
  ANAEROBIC: 'Anaerobowy',
  SPRINT: 'Sprint',
};

// --- Training Plans ---

export type PlanStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED' | 'PARTIAL';
export type TrainingSessionRole =
  | 'LONG_ENDURANCE'
  | 'THRESHOLD_QUALITY'
  | 'VO2_QUALITY'
  | 'RECOVERY'
  | 'ENDURANCE';

export interface TrainingPlan {
  id: string;
  date: string;
  plannedType: string | null;
  plannedTss: number | null;
  plannedDurationMin: number | null;
  plannedDescription: string | null;
  actualActivityId: string | null;
  compliancePct: number | null;
  programId: string | null;
  workoutTemplateId: string | null;
  workoutTemplateRevisionId?: string | null;
  workoutTemplateRevision?: number | null;
  workoutTemplateName: string | null;
  workoutStepsSnapshot?: WorkoutStep[];
  ftpWatts?: number | null;
  lthrBpm?: number | null;
  maxHrBpm?: number | null;
  restingHrBpm?: number | null;
  deliveryMethod?: string | null;
  deliveryStatus?: string | null;
  activityMatchStatus?: string | null;
  targetPowerLowW: number | null;
  targetPowerHighW: number | null;
  sessionRole?: TrainingSessionRole | null;
  status: PlanStatus;
  notes: string | null;
}

export type WorkoutExecutionStatus = 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ABORTED';

export interface WorkoutExecution {
  id: string;
  scheduledWorkoutId: string;
  workoutTemplateRevision?: number | null;
  workoutNameSnapshot: string;
  stepsSnapshot: WorkoutStep[];
  ftpWatts: number | null;
  lthrBpm: number | null;
  maxHrBpm: number | null;
  restingHrBpm: number | null;
  startedAt: string;
  finishedAt: string | null;
  status: WorkoutExecutionStatus;
  currentStepIndex: number;
  workoutElapsedMs: number;
  stepElapsedMs: number;
  runningSince: string | null;
  intensityAdjustmentPct: number;
  skippedStepIndexes: number[];
  repeatedStepIndexes: number[];
  rpe: number | null;
  feeling: string | null;
  notes: string | null;
  activityId: string | null;
  activityMatchStatus: string;
  complianceStatus: 'UNKNOWN' | 'PARTIAL' | 'COMPLETE';
  complianceScore: number | null;
  complianceAlgorithmVersion: string;
  deliveryMethod: string;
  stateVersion: number;
  updatedAt: string;
}

export interface WorkoutDeliveryCapability {
  method: 'DOWNLOAD_FIT' | 'DOWNLOAD_ZWO' | 'ON_DEVICE' | 'GARMIN' | 'INTERVALS_ICU';
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string | null;
}

export interface CalendarActivity {
  id: string;
  name: string;
  sportType: string;
  durationMin: number | null;
  distanceKm: number | null;
  tss: number | null;
}

export interface CalendarDay {
  date: string;
  sessions?: CalendarSession[];
  activities?: CalendarActivity[];
  planned: TrainingPlan | null;
  actual: CalendarActivity | null;
  compliance: number | null;
  execution?: TrainingExecutionAssessment | null;
  projection?: TrainingDayProjection | null;
  adjustment?: TrainingAdjustmentSuggestion | null;
}

export interface CalendarSession {
  planned: TrainingPlan;
  actual: CalendarActivity | null;
  compliance: number | null;
  execution?: TrainingExecutionAssessment | null;
}

export interface TrainingPlanProgram {
  id: string;
  name: string;
  goal: string;
  goalPriority?: string;
  startDate: string;
  endDate: string;
  eventDate?: string | null;
  taperStartDate?: string | null;
  weeklyObjectives?: TrainingWeekObjective[];
  goalScorecards?: TrainingGoalScorecard[];
  targetWeeklyTss: number | null;
  targetWeeklyHours: number | null;
  weekdayAvailabilityMinutes?: number | null;
  weekendAvailabilityMinutes?: number | null;
  preferredLongRideDay?: string | null;
  environmentPreference?: string | null;
  generatedBy: string;
}

export interface GeneratePlanRequest {
  goal: string;
  goalPriority?: string;
  startDate: string;
  eventDate?: string | null;
  weeks: number;
  trainingDaysPerWeek: number;
  targetWeeklyTss: number;
  weekdayAvailabilityMinutes?: number;
  weekendAvailabilityMinutes?: number;
  preferredLongRideDay?: string;
  environmentPreference?: string;
}

export interface TrainingDayProjection {
  plannedTss: number | null;
  projectedCtl: number;
  projectedAtl: number;
  projectedTsb: number;
  projectedReadiness: number;
  dayType: string;
  dayLabel: string;
  taperDay: boolean;
}

export interface TrainingAdjustmentSuggestion {
  type: string;
  title: string;
  description: string;
  memoryHint?: string | null;
}

export interface RecordAdjustmentFeedbackRequest {
  date: string;
  planId: string | null;
  suggestionType: string;
  suggestionTitle: string;
  feedback: 'ACCEPTED' | 'REJECTED';
}

export interface TrainingExecutionAssessment {
  outcome: string;
  label: string;
  description: string;
  score: number | null;
  availability?: string;
  algorithmVersion?: string;
  tssCompliance: number | null;
  durationCompliance: number | null;
  intervalCompliance?: number | null;
  zoneCompliance?: number | null;
  stimulusMatch: boolean;
  primaryLimiter?: string | null;
  nextDayAdvice?: string | null;
}

export interface TrainingWeekObjective {
  weekStart: string;
  weekEnd: string;
  objectiveType: string;
  label: string;
  focus: string;
  plannedTss: number;
  maxQualityDays: number;
  keySessionTypes: string[];
  fuelingLabel: string;
  fuelingGuidance: string;
}

export interface TrainingGoalScorecard {
  weekStart: string;
  weekEnd: string;
  label: string;
  plannedTss: number;
  actualTss: number;
  plannedQualityDays: number;
  completedQualityDays: number;
  goalFocusLabel?: string | null;
  goalFocusRole?: TrainingSessionRole | null;
  plannedGoalSessions?: number;
  completedGoalSessions?: number;
  goalExecutionScore?: number | null;
  goalExecutionStatus?: 'STABLE' | 'ON_TARGET' | 'PARTIAL' | 'MISSED' | string;
  avgExecutionScore: number | null;
  onTrack: boolean;
}
