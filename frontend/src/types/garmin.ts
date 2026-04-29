export interface GarminStatus {
  connected: boolean;
  lastSyncAt: string | null;
  email: string | null;
  lastError: string | null;
}

export interface GarminHealthData {
  date: string;
  restingHrBpm: number | null;
  hrvRmssd: number | null;
  sleepScore: number | null;
  sleepDurationSeconds: number | null;
  deepSleepSeconds: number | null;
  lightSleepSeconds: number | null;
  remSleepSeconds: number | null;
  awakeSleepSeconds: number | null;
  bodyBattery: number | null;
  stressAvg: number | null;
  steps: number | null;
  activeCalories: number | null;
  garminSyncedAt: string | null;
}

export interface GarminSyncResult {
  synced: number;
  skipped: number;
  failed: number;
  errors?: string[];
}

export interface GarminBridgeStatus {
  online: boolean;
  busy: boolean;
  sessionReady: boolean;
  requiresInteraction: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
}
