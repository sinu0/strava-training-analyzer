export interface SyncStatus {
  status: string;
  timestamp: string | null;
  lastSyncAt?: string | null;
  imported: number;
  skipped: number;
  rateLimitResetsAt?: string | null;
}

export interface StravaConfig {
  clientId: string;
  clientIdSource: string;
  hasClientSecret: boolean;
  clientSecretSource: string;
  hasWebhookToken: boolean;
  webhookTokenSource: string;
}

export interface StravaConnectResponse {
  url: string;
}

export interface WeatherJobStatus {
  status: string;
  lastRunAt: string | null;
  locationsProcessed: number;
  locationsFailed: number;
  errorMessage: string | null;
}
