import { STATUS_COLORS } from '@/utils/colors';

export type PredictionTypeV2 =
  | 'FTP_PREDICTION'
  | 'FATIGUE_PREDICTION'
  | 'TRAINING_TYPE_RECOMMENDATION'
  | 'PERFORMANCE_TREND'
  | 'OVERTRAINING_RISK'
  | 'RACE_READINESS'
  | 'TRAINING_COACH_SUMMARY'
  | 'RACE_PACING_STRATEGY'
  | 'NUTRITION_PLAN'
  | 'RECOVERY_PLAN'
  | 'INJURY_RISK'
  | 'PEAK_TIMING';

export type Persona =
  | 'AGGRESSIVE_COACH'
  | 'BALANCED_ADVISOR'
  | 'CONSERVATIVE_SCIENTIST';

export const PERSONA_LABELS: Record<Persona, string> = {
  AGGRESSIVE_COACH: 'Agresywny trener',
  BALANCED_ADVISOR: 'Zrównoważony doradca',
  CONSERVATIVE_SCIENTIST: 'Konserwatywny naukowiec',
};

export const PERSONA_DESCRIPTIONS: Record<Persona, string> = {
  AGGRESSIVE_COACH: 'Naciskaj mocniej — dane pokazują, że dasz radę',
  BALANCED_ADVISOR: 'Oparte na danych, zrównoważone podejście',
  CONSERVATIVE_SCIENTIST: 'Oparte na dowodach, ostrożność przede wszystkim',
};

export const PERSONA_EMOJIS: Record<Persona, string> = {
  AGGRESSIVE_COACH: '🔥',
  BALANCED_ADVISOR: '⚖️',
  CONSERVATIVE_SCIENTIST: '🔬',
};

export const PREDICTION_TYPE_V2_LABELS: Record<PredictionTypeV2, string> = {
  FTP_PREDICTION: 'Predykcja FTP',
  FATIGUE_PREDICTION: 'Ocena zmęczenia',
  TRAINING_TYPE_RECOMMENDATION: 'Rekomendacja treningu',
  PERFORMANCE_TREND: 'Trend wydolności',
  OVERTRAINING_RISK: 'Ryzyko przetrenowania',
  RACE_READINESS: 'Gotowość wyścigowa',
  TRAINING_COACH_SUMMARY: 'Podsumowanie trenera AI',
  RACE_PACING_STRATEGY: 'Strategia tempa na wyścig',
  NUTRITION_PLAN: 'Plan żywieniowy',
  RECOVERY_PLAN: 'Plan regeneracji',
  INJURY_RISK: 'Ryzyko kontuzji',
  PEAK_TIMING: 'Timing szczytu formy',
};

export const PREDICTION_TYPE_V2_ICONS: Record<PredictionTypeV2, string> = {
  FTP_PREDICTION: 'BoltIcon',
  FATIGUE_PREDICTION: 'BatteryAlertIcon',
  TRAINING_TYPE_RECOMMENDATION: 'FitnessCenterIcon',
  PERFORMANCE_TREND: 'TrendingUpIcon',
  OVERTRAINING_RISK: 'WarningIcon',
  RACE_READINESS: 'EmojiEventsIcon',
  TRAINING_COACH_SUMMARY: 'AutoAwesomeIcon',
  RACE_PACING_STRATEGY: 'SpeedIcon',
  NUTRITION_PLAN: 'RestaurantIcon',
  RECOVERY_PLAN: 'BedtimeIcon',
  INJURY_RISK: 'HealingIcon',
  PEAK_TIMING: 'TimelineIcon',
};

export const PREDICTION_TYPE_V2_DESCRIPTIONS: Record<PredictionTypeV2, string> = {
  FTP_PREDICTION: 'Prognoza zmian progu mocy na podstawie trendu treningowego',
  FATIGUE_PREDICTION: 'Aktualna ocena poziomu zmęczenia i gotowości do wysiłku',
  TRAINING_TYPE_RECOMMENDATION: 'AI rekomenduje optymalny rodzaj treningu na dziś',
  PERFORMANCE_TREND: 'Wielowymiarowa analiza trendu wydolności',
  OVERTRAINING_RISK: 'Wykrywanie sygnałów przetrenowania zanim będzie za późno',
  RACE_READINESS: 'Ocena gotowości startowej na podstawie formy i zmęczenia',
  TRAINING_COACH_SUMMARY: 'Kompleksowe podsumowanie twojego treningu przez AI',
  RACE_PACING_STRATEGY: 'Optymalna strategia rozłożenia mocy na trasie wyścigu',
  NUTRITION_PLAN: 'Spersonalizowany plan odżywiania na trening i zawody',
  RECOVERY_PLAN: 'Plan regeneracji dopasowany do twojego obciążenia',
  INJURY_RISK: 'Ocena ryzyka kontuzji na podstawie wzorców treningowych',
  PEAK_TIMING: 'Prognoza optymalnego momentu szczytu formy',
};

export const PREDICTION_TYPE_V2_COLORS: Record<PredictionTypeV2, string> = {
  FTP_PREDICTION: STATUS_COLORS.accent,
  FATIGUE_PREDICTION: STATUS_COLORS.error,
  TRAINING_TYPE_RECOMMENDATION: STATUS_COLORS.success,
  PERFORMANCE_TREND: STATUS_COLORS.info,
  OVERTRAINING_RISK: STATUS_COLORS.warning,
  RACE_READINESS: STATUS_COLORS.highlight,
  TRAINING_COACH_SUMMARY: STATUS_COLORS.secondary,
  RACE_PACING_STRATEGY: '#FF8C00',
  NUTRITION_PLAN: '#00CED1',
  RECOVERY_PLAN: '#9370DB',
  INJURY_RISK: '#FF1493',
  PEAK_TIMING: '#40E0D0',
};

export interface PredictionRequestV2 {
  predictionType: PredictionTypeV2;
  persona?: Persona;
  modelId?: string;
  maxToolCalls?: number;
}

export interface ConfidenceBreakdown {
  dataQuality: number;
  trendClarity: number;
  modelCertainty: number;
}

export interface AlternativeScenario {
  scenario: string;
  action: string;
}

export interface WorkoutInterval {
  durationSec: number;
  powerTarget: string;
  cadence: string;
  description: string;
}

export interface StructuredWorkout {
  type: string;
  totalDurationMin: number;
  intervals: WorkoutInterval[];
  warmupDescription: string;
  cooldownDescription: string;
  notes?: string;
}

export interface ToolCallLogEntry {
  toolName: string;
  arguments: Record<string, unknown>;
  resultSummary: string;
  durationMs: number;
  error: boolean;
}

export interface PredictionResponseV2 {
  id: string;
  type: PredictionTypeV2;
  modelId: string;
  providerName: string;
  summary: string;
  insight: string;
  action: string;
  metrics: Record<string, string>;
  confidence: number;
  confidenceBreakdown: ConfidenceBreakdown;
  reasoning: string;
  warnings: string[];
  alternatives: AlternativeScenario[];
  references: string[];
  structuredWorkout?: StructuredWorkout;
  toolCallLog: ToolCallLogEntry[];
  tokensUsed: number;
  durationMs: number;
  createdAt: string;
}

export interface CompareRequest {
  predictionType: PredictionTypeV2;
  models: string[];
}

export interface KnowledgeStatus {
  ragAvailable: boolean;
  refreshScheduled: string;
}
