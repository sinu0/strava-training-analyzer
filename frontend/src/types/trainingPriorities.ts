export interface CpModelData {
  cp: number;
  wPrime: number;
  rSquared: number;
  cpPerKg: number;
  dataPoints: number;
  cpConfidence: number;
  currentFtp: number;
  ftpVsCpPct: number;
}

export interface IntervalSessionData {
  date: string;
  activityId: string;
  intervalType: 'THRESHOLD' | 'VO2MAX' | 'ANAEROBIC' | 'NEUROMUSCULAR' | 'ENDURANCE';
  intervalCount: number;
  avgDurationSec: number;
  avgPowerPct: number;
  totalWorkSec: number;
  restRatio: number;
  qualityScore: number;
}

export interface IntervalDetectionData {
  totalIntervalSessions: number;
  sessionsByType: Record<string, number>;
  recentSessions: IntervalSessionData[];
  avgQualityScore: number;
  trend: string;
  recommendation: string;
}

export interface FatigueFactorsData {
  atlFatigue: number;
  muscularFatigue: number;
  metabolicFatigue: number;
  ansFatigue: number;
  compositeScore: number;
  statusLabel: string;
  description: string;
}

export interface DurabilityProfileData {
  overallScore: number;
  trend: string;
  label: string;
  description: string;
  shortDurationResistance: number;
  mediumDurationResistance: number;
  longDurationResistance: number;
  avgAerobicDecoupling: number;
  avgPowerFade: number;
  fatigueResistanceIndex: number;
  recentWorkoutsCount: number;
  recommendation: string;
}

export interface PowerPhenotypeData {
  primaryType: string;
  secondaryType: string | null;
  powerProfileWkg: Record<string, number>;
  referenceScores: Record<string, number>;
  bestDuration: string;
  worstDuration: string;
  weaknessGapWkg: number;
  description: string;
  recommendation: string;
}

export interface TrainingPriorityItem {
  rank: number;
  title: string;
  subsystem: string;
  weeklyHours: number;
  impactScore: number;
  rationale: string;
  action: string;
  metricsSummary: string;
}

export interface TrainingPrioritiesData {
  cpModel: CpModelData | null;
  intervalDetection: IntervalDetectionData | null;
  fatigueFactors: FatigueFactorsData | null;
  durabilityProfile: DurabilityProfileData | null;
  powerPhenotype: PowerPhenotypeData | null;
  priorities: TrainingPriorityItem[];
}
