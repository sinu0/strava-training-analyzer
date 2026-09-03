export interface MatchedRidePoint {
  activityId: string;
  activityName: string;
  startedAt: string;
  averageSpeedKmh?: number | null;
  movingTimeSec?: number | null;
  averagePowerW?: number | null;
  averageHeartrate?: number | null;
  relativeEffort?: number | null;
  similarityPercent: number;
  smoothedSpeedKmh?: number | null;
}

export interface MatchedRideSummary {
  routeGroupId: string;
  routeFamilyId: string;
  rideCount: number;
  currentRank: number;
  similarityPercent: number;
  currentSpeedKmh?: number | null;
  changeFromPreviousKmh?: number | null;
  changeFromAverageKmh?: number | null;
  changeFromRecordKmh?: number | null;
  changeFromPreviousBestKmh?: number | null;
  newRecord: boolean;
  directionVariant: 'SAME' | 'REVERSE';
  trend: MatchedRidePoint[];
}

export interface RouteGroupDetail {
  routeGroupId: string;
  routeFamilyId: string;
  algorithmVersion: number;
  directionKey: string;
  rideCount: number;
  bestSpeedKmh?: number | null;
  averageSpeedKmh?: number | null;
  slowestSpeedKmh?: number | null;
  rides: MatchedRidePoint[];
}

export interface BackfillStatus {
  jobType: 'SEGMENTS' | 'ROUTES';
  status: string;
  processed: number;
  total: number;
  capability: string;
  rateLimitResetsAt?: string | null;
  errorMessage?: string | null;
  updatedAt: string;
}
