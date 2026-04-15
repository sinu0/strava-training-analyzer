export interface AthleteZone {
  id: string;
  zoneType: string;
  zoneNumber: number;
  zoneName: string | null;
  minValue: number;
  maxValue: number | null;
  color: string | null;
  validFrom: string;
  validTo: string | null;
}

export interface AthleteProfile {
  id: string;
  name: string;
  email: string | null;
  ftpWatts: number | null;
  lthrBpm: number | null;
  maxHrBpm: number | null;
  restingHrBpm: number | null;
  weightKg: number | null;
  dateOfBirth: string | null;
  stravaConnected: boolean;
  stravaAthleteId: number | null;
  currentZones: AthleteZone[];
  createdAt: string;
  updatedAt: string;
}
