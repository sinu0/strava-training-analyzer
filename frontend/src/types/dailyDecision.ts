export interface WorkoutSuggestion {
  type: string;
  durationMin: number;
  targetTss: number;
  difficulty: string;
  intensityDescription: string;
  description: string;
  indoor: boolean;
}

export interface ConfidenceScore {
  score: number;
  label: string;
  description: string;
}

export interface DecisionReason {
  priority: string;
  signal: string;
  message: string;
  evidence: string;
}

export interface AlternativeOption {
  label: string;
  type: string;
  workout: WorkoutSuggestion;
  rationale: string;
}

export interface DailyDecisionDto {
  decision: 'RIDE' | 'MODIFY' | 'SKIP' | 'INDOOR';
  workout: WorkoutSuggestion;
  confidence: ConfidenceScore;
  risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  reasons: DecisionReason[];
  alternatives: AlternativeOption[];
}
