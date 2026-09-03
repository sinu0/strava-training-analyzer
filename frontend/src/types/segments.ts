export interface SegmentSummary {
  id: number;
  name: string;
  activityType?: string | null;
  distanceM?: number | null;
  averageGrade?: number | null;
  maximumGrade?: number | null;
  elevationHighM?: number | null;
  elevationLowM?: number | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  city?: string | null;
  country?: string | null;
  localFavorite: boolean;
  routePolyline?: string | null;
  effortCount: number;
  bestElapsedTimeSec?: number | null;
  latestEffortAt?: string | null;
}

export interface SegmentEffort {
  id: string;
  externalId?: number | null;
  segmentId: number;
  segmentName: string;
  activityId: string;
  activityName?: string | null;
  startedAt: string;
  sequence: number;
  startIndex?: number | null;
  endIndex?: number | null;
  elapsedTimeSec?: number | null;
  movingTimeSec?: number | null;
  distanceM?: number | null;
  averagePowerW?: number | null;
  averageHeartrate?: number | null;
  averageSpeedMs?: number | null;
  averageCadence?: number | null;
  elevationGainM?: number | null;
  deviceWatts?: boolean | null;
  personalRank: number;
  differenceToBestSec?: number | null;
  recordAtTime: boolean;
  previousBestElapsedTimeSec?: number | null;
  achievementLabel?: string | null;
  routePolyline?: string | null;
}

export interface SegmentPage {
  items: SegmentSummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface SegmentDetail {
  segment: SegmentSummary;
  efforts: SegmentEffort[];
  backfillStatus: string;
  personalBestConfirmed: boolean;
}

export interface ActivitySegments {
  activityId: string;
  routePolyline?: string | null;
  availability: 'AVAILABLE' | 'PENDING' | 'UNAVAILABLE';
  backfillStatus: string;
  personalBestConfirmed: boolean;
  efforts: SegmentEffort[];
}

export interface SegmentComparisonPoint {
  distanceM: number;
  timeSec?: number | null;
  timeDeltaSec?: number | null;
  powerW?: number | null;
  heartrate?: number | null;
  speedMs?: number | null;
  cadence?: number | null;
  altitudeM?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SegmentComparisonSeries {
  effortId: string;
  activityId: string;
  activityName?: string | null;
  startedAt: string;
  elapsedTimeSec?: number | null;
  points: SegmentComparisonPoint[];
}

export interface SegmentComparison {
  segmentId: number;
  referenceEffortId: string;
  distanceM: number;
  series: SegmentComparisonSeries[];
}
