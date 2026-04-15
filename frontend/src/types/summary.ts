export interface YearStats {
  year: number;
  totalActivities: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  totalElevationM: number;
  totalTss: number;
  avgPowerW: number;
  avgHrBpm: number;
  longestRideKm: number;
  highestTss: number;
}

export interface WeeklySummarySnapshot {
  weekLabel: string;
  weekStart: string;
  activitiesCount: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  totalTss: number;
  totalElevationM: number;
}

export interface MonthlySummary {
  monthLabel: string;
  year: number;
  month: number;
  activitiesCount: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  totalTss: number;
  totalElevationM: number;
}
