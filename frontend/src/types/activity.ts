export interface ActivitySummary {
  id: string;
  externalId: string;
  sportType: string;
  name: string;
  startedAt: string;
  movingTimeSec: number;
  distanceM: number;
  elevationGainM: number | null;
  avgHeartrate: number | null;
  avgPowerW: number | null;
  avgSpeedMs: number | null;
  calories: number | null;
  summaryPolyline?: string | null;
  photoUrls?: string[] | null;
}

export interface ActivityDetail {
  id: string;
  externalId: string;
  source: string;
  sportType: string;
  name: string;
  description: string | null;
  startedAt: string;
  elapsedTimeSec: number;
  movingTimeSec: number;
  distanceM: number;
  elevationGainM: number | null;
  elevationLossM: number | null;
  avgSpeedMs: number | null;
  maxSpeedMs: number | null;
  avgHeartrate: number | null;
  maxHeartrate: number | null;
  avgPowerW: number | null;
  maxPowerW: number | null;
  avgCadence: number | null;
  maxCadence: number | null;
  calories: number | null;
  avgTempC: number | null;
  summaryPolyline: string | null;
  photoUrls?: string[] | null;
  powerStream: number[] | null;
  heartrateStream: number[] | null;
  cadenceStream: number[] | null;
  altitudeStream: number[] | null;
  timeStream: number[] | null;
  latStream: number[] | null;
  lngStream: number[] | null;
  distanceStream: number[] | null;
  velocityStream: number[] | null;
  laps: ActivityLap[] | null;
  metrics: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLap {
  lapIndex: number;
  name?: string;
  startIndex: number | null;
  endIndex: number | null;
  distanceM: number;
  elapsedTimeSec: number;
  movingTimeSec: number;
  avgSpeedMs: number | null;
  maxSpeedMs: number | null;
  avgHeartrate: number | null;
  maxHeartrate: number | null;
  avgPowerW: number | null;
  maxPowerW: number | null;
  avgCadence: number | null;
  totalElevationGain: number | null;
  normalizedPowerW: number | null;
  variabilityIndex: number | null;
  powerDropPct: number | null;
  intensityClass: string | null;
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: number[][];
}

export interface GeoJsonFeature {
  type: string;
  geometry?: GeoJsonGeometry;
  properties?: Record<string, string>;
  features?: GeoJsonFeature[];
}

export interface ActivityHeatmapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface HeatmapSegmentData {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
  count: number;
}

export interface ActivityHeatmapData {
  segments: HeatmapSegmentData[];
  routeCount: number;
  bounds: ActivityHeatmapBounds | null;
  totalDistanceKm: number;
  maxCount: number;
  status: 'ready' | 'rebuilding';
}

export interface ActivitySummaryPage {
  items: ActivitySummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ActivityTimelineEntry {
  year: number;
  month: number;
  count: number;
}
