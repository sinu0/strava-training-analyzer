export type PlanType = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type StrategyFocus = 'BUILD' | 'MAINTAIN' | 'TAPER';

export interface OptimizePlanRequest {
  weeks: number;
  trainingDaysPerWeek: number;
  targetWeeklyTss: number;
  currentCtl: number;
  currentAtl: number;
  ftp: number;
  eventDate?: string | null;
  goalPriority?: string;
}

export interface OptimizedSession {
  day: string;
  type: string;
  durationMinutes: number;
  intensity: string;
  tss: number;
  goal: string;
}

export interface IntensityDistribution {
  low: number;
  moderate: number;
  high: number;
}

export interface PlanResult {
  type: PlanType;
  score: number;
  adaptationGain: number;
  fatigueCost: number;
  estimatedTss: number;
  intensityDistribution: IntensityDistribution;
  sessions: OptimizedSession[];
}

export interface PlanStrategy {
  focus: StrategyFocus;
  reasoning: string;
}

export interface OptimizePlanResponse {
  plans: PlanResult[];
  loadSummary: string[];
  constraintViolations: string[];
  strategy: PlanStrategy;
  confidence: number;
}

export interface ApplyOptimizedPlanRequest {
  name: string;
  goalPriority: string;
  targetWeeklyTss: number;
  sessions: Array<{
    day: string;
    type: string;
    durationMinutes: number;
    tss: number;
    goal: string;
  }>;
}
