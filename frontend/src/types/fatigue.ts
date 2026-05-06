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
