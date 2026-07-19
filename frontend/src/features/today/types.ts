export type DataAvailability = 'UNKNOWN' | 'PARTIAL' | 'AVAILABLE';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TodayActivity {
  id: string;
  sportType: string;
  name: string;
  startedAt: string;
  movingTimeSec?: number | null;
  distanceM?: number | null;
  elevationGainM?: number | null;
  avgHeartrate?: number | null;
  avgPowerW?: number | null;
  trainingScore?: number | null;
  primaryBenefit?: string | null;
  summaryPolyline?: string | null;
}

export interface TodayRecommendation {
  decision?: string | null;
  sessionType?: string | null;
  durationMinutes?: number | null;
  targetTss?: number | null;
  description?: string | null;
}

export interface TodayEvidence {
  code: string;
  message: string;
  source: string;
  asOf: string;
}

export interface TodayLoad {
  ctl42: number;
  atl7: number;
  form: number;
  asOf: string;
}

export interface TodayTraining {
  id: string;
  date: string;
  plannedType: string;
  plannedTss?: number | null;
  plannedDurationMin?: number | null;
  plannedDescription?: string | null;
}

export interface TodayResponse {
  asOf: string;
  dataStatus: DataAvailability;
  recommendation?: TodayRecommendation | null;
  evidence: TodayEvidence[];
  confidence: {
    level: ConfidenceLevel;
    reasons: string[];
  };
  lastActivity?: TodayActivity | null;
  load?: TodayLoad | null;
  nextTraining?: TodayTraining | null;
  sync: {
    status: string;
    lastSyncAt?: string | null;
    imported: number;
    skipped: number;
    rateLimitResetsAt?: string | null;
  };
}
