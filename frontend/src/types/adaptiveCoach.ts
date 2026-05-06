export interface SessionOptionDto {
  type: string;
  durationMinutes: number;
  targetTss: number;
  intensityFactor: number;
  difficulty: string;
  description: string;
  indoor: boolean;
  score: number;
  scoreBreakdown: Record<string, number>;
}

export interface GoalProgressDto {
  currentValue: number;
  targetValue: number;
  gap: number;
  gapPercent: number;
  projectedDaysToTarget: number;
  phase: string;
  weeklyProgressRate: number;
  status: string;
}

export interface FatigueDto {
  projectedAtl: number;
  projectedTsb: number;
  currentAtl: number;
  currentTsb: number;
}

export interface RiskDto {
  level: string;
  primaryRisk: string;
}

export interface AccountabilityDto {
  status: string;
  actualLoad: number;
  expectedLoad: number;
  gap: number;
  message: string;
  recommendedAction: string;
  timelineAdjustmentDays: number;
}

export interface ConsistencyDto {
  completionRatio: number;
  completedSessions: number;
  expectedSessions: number;
  gainMultiplier: number;
  status: string;
  recommendation: string;
}

export interface EfficiencyDto {
  completionRatio: number;
  rating: string;
}

export interface FatigueDebtDto {
  debt: number;
  severity: string;
  recoveryDaysNeeded: number;
  requiresRecovery: boolean;
}

export interface AdaptiveCoachResponse {
  decision: 'TRAIN' | 'RECOVER' | 'ACTIVE_RECOVERY' | 'REST';
  bestSession: SessionOptionDto;
  alternatives: SessionOptionDto[];
  allScoredSessions: SessionOptionDto[];
  reasoning: string[];
  goalProgress: GoalProgressDto;
  fatigue: FatigueDto;
  risk: RiskDto;
  accountability: AccountabilityDto;
  consistency: ConsistencyDto;
  efficiency: EfficiencyDto;
  fatigueDebt: FatigueDebtDto;
  insight: string;
  aiInterpretation: string;
}

export interface AdaptiveCoachRequest {
  goalType: string;
  targetMetric?: string;
  targetValue?: number;
  currentValue?: number;
  goalContext?: string;
  deadline?: string;
  progressPerWeek?: number;
  aiInput?: string;
  overrideState?: string;
  ctl?: number;
  atl?: number;
  tsb?: number;
  trainingMonotony?: number;
  readinessScore?: number;
  hrvRmssd?: number;
  baselineHrv?: number;
  restingHr?: number;
  baselineRestingHr?: number;
  sleepScore?: number;
  bodyBattery?: number;
  stressAvg?: number;
  timeAvailableMinutes?: number;
  weatherScore?: number;
  weatherDescription?: string;
  recentSessionOutcomes?: string[];
  hasHrvData?: boolean;
  hasWeatherData?: boolean;
  hasRecentActivities?: boolean;
  completedRecentSessions?: number;
  expectedRecentSessions?: number;
  ftp?: number;
  vo2maxEstimate?: number;
  durabilityIndex?: number;
  weightKg?: number;
}
