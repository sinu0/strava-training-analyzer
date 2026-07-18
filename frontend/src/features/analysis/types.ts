import type { DurabilityInsight, FtpProgress, PmcData, PowerCurve } from '@/types/analytics';

export interface PeriodSummary {
  from: string;
  to: string;
  activityCount: number;
  totalDistanceM: number;
  totalTimeSec: number;
  totalElevationM: number;
}

export interface PeriodComparison {
  period1: PeriodSummary;
  period2: PeriodSummary;
  availability: 'UNKNOWN' | 'PARTIAL' | 'AVAILABLE';
}

export interface LoadAnalytics {
  from: string;
  to: string;
  availability: 'UNKNOWN' | 'PARTIAL' | 'AVAILABLE';
  points: PmcData[];
}

export interface PowerAnalytics {
  from: string;
  to: string;
  availability: 'UNKNOWN' | 'PARTIAL' | 'AVAILABLE';
  curve: PowerCurve;
  ftp?: FtpProgress | null;
  durability?: DurabilityInsight | null;
}
