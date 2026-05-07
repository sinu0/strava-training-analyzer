export interface TrainingEvent {
  id: string;
  name: string;
  eventDate: string;
  type: string;
  priority: string;
  active: boolean;
  createdAt: string;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  ROAD_RACE: 'Wyścig szosowy',
  TT: 'Time Trial',
  GRAN_FONDO: 'Gran Fondo',
  CRIT: 'Kryterium',
  TRIATHLON: 'Triathlon',
  OTHER: 'Inny',
};

export const EVENT_PRIORITY_LABELS: Record<string, string> = {
  A: 'A — kluczowy',
  B: 'B — ważny',
  C: 'C — uzupełniający',
};

export interface EventProjection {
  eventName: string;
  daysToEvent: number;
  currentCtl: number;
  projectedCtl: number;
  currentTsb: number;
  fatigueScore: number;
  suggestedTaper: string;
  taperStartDays: number;
}
