export interface WeightRecord {
  id: string;
  weightKg: number;
  recordedDate: string;
  notes: string | null;
  createdAt: string;
}

export interface WeightGoal {
  id: string;
  targetWeightKg: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeightOverview {
  currentWeightKg: number | null;
  goal: WeightGoal | null;
  dailyCaloricNeed: number | null;
  dailyDeficitOrSurplus: number | null;
  weeksRemaining: number | null;
  history: WeightRecord[];
  weeklyTrainingCalories: number | null;
  adjustedDailyTdee: number | null;
  recommendedDailyCalories: number | null;
  weeklyWeightChange: number | null;
  dataConfidence: string | null;
}

export interface AddWeightRequest {
  weightKg: number;
  recordedDate: string;
  notes?: string;
}

export interface SetWeightGoalRequest {
  targetWeightKg: number;
  targetDate: string;
}
