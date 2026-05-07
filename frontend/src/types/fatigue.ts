export interface FatigueState {
  score: number;
  level: string;
  atlFatigue: number;
  metabolicFatigue: number;
  loadFatigue: number;
  recoveryDebt: number;
  monotony: number;
  strain: number;
  weeklyRampRate: number;
  trend: string;
  calculatedAt: string;
  energyBudget: number;
  maxTssToday: number;
}

export interface LoadFocus {
  lowAerobicPct: number;
  highAerobicPct: number;
  anaerobicPct: number;
  lowAerobicTarget: number;
  highAerobicTarget: number;
  anaerobicTarget: number;
  zoneSeconds: Record<string, number>;
  totalSeconds: number;
}

export interface SessionSuggestion {
  type: string;
  label: string;
  durationMin: number;
  estimatedTss: number;
  estimatedIf: number;
  structure: string;
  rationale: string;
  roiScore: number;
  impact: string;
}

export interface TrainingStatus {
  status: string;
  label: string;
  description: string;
  ctlTrend: number;
  currentCtl: number;
  currentTsb: number;
  fatigue: number;
}

export interface WeeklyBrief {
  status: string;
  statusDescription: string;
  weeklyHours: number;
  weeklyTss: number;
  avg4WeekHours: number;
  avg4WeekTss: number;
  efTrend: number;
  fatigueScore: number;
  fatigueLastWeek: number;
  fatigueTrend: string;
  eventName: string | null;
  daysToEvent: number;
  projectedCtl: number;
  suggestedFocus: string;
  loadFocusLowPct: number;
  loadFocusHighPct: number;
  loadFocusAnaerobicPct: number;
}
