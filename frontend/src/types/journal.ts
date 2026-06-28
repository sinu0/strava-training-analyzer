export type JournalMood = 'GREAT' | 'GOOD' | 'OK' | 'TIRED' | 'BAD';

export interface JournalEntry {
  id: string;
  activityId: string;
  mood: JournalMood;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveJournalEntryRequest {
  activityId: string;
  mood: JournalMood;
  note?: string;
  tags?: string[];
}

export interface MoodMetric {
  count: number;
  avgPower: number | null;
  avgHeartRate: number | null;
  avgTss: number | null;
  avgDurationMinutes: number | null;
  avgDistanceKm: number | null;
}

export interface MoodCorrelation {
  totalEntries: number;
  byMood: Record<string, MoodMetric>;
}
