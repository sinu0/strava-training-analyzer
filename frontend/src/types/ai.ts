import { AI_PREDICTION_COLORS } from '@/utils/colors';

export interface PredictionRequest {
  predictionType: PredictionType;
  modelId?: string;
  extraParameters?: Record<string, string>;
}

export interface PredictionResponse {
  id: string;
  predictionType: string;
  modelId: string;
  providerName: string;
  summary: string;
  detail: string;
  structuredData: Record<string, unknown>;
  confidence: number;
  createdAt: string;
}

export interface AiModuleStatus {
  enabled: boolean;
  batchEnabled?: boolean;
  batchCron?: string;
  todayTipsReady?: boolean;
  activeProvider: string;
  activeModel: string;
  modelAvailable: boolean;
  availableProviders: string[];
  availablePredictionTypes: string[];
}

export type PredictionType =
  | 'FTP_PREDICTION'
  | 'FATIGUE_PREDICTION'
  | 'TRAINING_TYPE_RECOMMENDATION'
  | 'PERFORMANCE_TREND'
  | 'OVERTRAINING_RISK'
  | 'RACE_READINESS';

export const PREDICTION_TYPE_LABELS: Record<PredictionType, string> = {
  FTP_PREDICTION: 'Predykcja FTP',
  FATIGUE_PREDICTION: 'Ocena zmęczenia',
  TRAINING_TYPE_RECOMMENDATION: 'Rekomendacja treningu',
  PERFORMANCE_TREND: 'Trend wydolności',
  OVERTRAINING_RISK: 'Ryzyko przetrenowania',
  RACE_READINESS: 'Gotowość wyścigowa',
};

export const PREDICTION_TYPE_ICONS: Record<PredictionType, string> = {
  FTP_PREDICTION: 'BoltIcon',
  FATIGUE_PREDICTION: 'BatteryAlertIcon',
  TRAINING_TYPE_RECOMMENDATION: 'FitnessCenterIcon',
  PERFORMANCE_TREND: 'TrendingUpIcon',
  OVERTRAINING_RISK: 'WarningIcon',
  RACE_READINESS: 'EmojiEventsIcon',
};

export const PREDICTION_TYPE_COLORS: Record<PredictionType, string> = AI_PREDICTION_COLORS;

// AI Activity Note (Coach analysis per activity)
export interface AiActivityNote {
  id?: string;
  activityId: string;
  summary?: string;
  detail?: string;
  modelId?: string;
  providerName?: string;
  generatedAt?: string;
  queueStatus?: string | null;
}

export interface AiNoteAskRequest {
  question: string;
}

export interface AiNoteAskResponse {
  answer: string;
  modelId: string;
  providerName: string;
}
