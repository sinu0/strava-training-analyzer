export interface DateRange {
  from: string;
  to: string;
}

export interface QueryToggleOptions {
  enabled?: boolean;
}

export interface ActivityFilters {
  sportType?: string;
  from?: string;
  to?: string;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  minDurationMin?: number;
  maxDurationMin?: number;
  minAvgPowerW?: number;
  maxAvgPowerW?: number;
  minAvgHr?: number;
  maxAvgHr?: number;
  page?: number;
  size?: number;
}

export type InfiniteActivityFilters = Omit<ActivityFilters, 'page' | 'size'>;

export interface ComparePeriodsResponse<T> {
  period1: T;
  period2: T;
}
