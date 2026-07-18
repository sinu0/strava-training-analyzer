import type { ActivitySummary } from '@/types/activity';
import type { ActivityTrainingEffect } from '@/types/trainingEffect';

export interface HistoryPageResponse {
  items: ActivitySummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ActivityMetricValue {
  name: string;
  numericValue?: number | null;
  structuredValue?: Record<string, unknown> | null;
  calculatorVersion?: string | null;
  inputFingerprint?: string | null;
  asOf?: string | null;
  computedAt?: string | null;
}

export interface ActivityV2Detail {
  id: string;
  externalId: string;
  source: string;
  sportType: string;
  name: string;
  description?: string | null;
  startedAt: string;
  elapsedTimeSec?: number | null;
  movingTimeSec?: number | null;
  distanceM?: number | null;
  elevationGainM?: number | null;
  elevationLossM?: number | null;
  avgSpeedMs?: number | null;
  maxSpeedMs?: number | null;
  avgHeartrate?: number | null;
  maxHeartrate?: number | null;
  avgPowerW?: number | null;
  maxPowerW?: number | null;
  avgCadence?: number | null;
  maxCadence?: number | null;
  calories?: number | null;
  avgTempC?: number | null;
  summaryPolyline?: string | null;
  metrics: ActivityMetricValue[];
  trainingEffect?: ActivityTrainingEffect | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ActivityStreams {
  series: string[];
  originalPoints: number;
  returnedPoints: number;
  resolution: string;
  time?: number[] | null;
  power?: number[] | null;
  heartrate?: number[] | null;
  cadence?: number[] | null;
  altitude?: number[] | null;
  distance?: number[] | null;
  velocity?: number[] | null;
  latitude?: number[] | null;
  longitude?: number[] | null;
}
