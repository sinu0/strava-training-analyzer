export interface Challenge {
  id: string;
  name: string;
  description?: string;
  type: 'DISTANCE' | 'ELEVATION' | 'FREQUENCY' | 'STREAK' | 'TSS';
  targetValue: number;
  targetUnit: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'ABANDONED';
  currentValue: number;
  progressPercent: number;
  daysLeft: number;
  completedAt?: string;
  createdAt: string;
}

export interface SaveChallengeRequest {
  name: string;
  description?: string;
  type: string;
  targetValue: number;
  targetUnit: string;
  startDate: string;
  endDate: string;
}

export interface ChallengeTemplate {
  name: string;
  description: string;
  type: string;
  targetValue: number;
  targetUnit: string;
}

export interface Nudge {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  data?: Record<string, string>;
}
