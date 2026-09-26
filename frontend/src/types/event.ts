import { localized } from '@/i18n';
export interface TrainingEvent {
  id: string;
  name: string;
  eventDate: string;
  type: string;
  priority: string;
  active: boolean;
  createdAt: string;
}

export const EVENT_TYPE_LABELS: Record<string, string> = localized<Record<string, string>>({
  pl: {
    ROAD_RACE: 'Wyścig szosowy',
    TT: 'Time Trial',
    GRAN_FONDO: 'Gran Fondo',
    CRIT: 'Kryterium',
    TRIATHLON: 'Triathlon',
    OTHER: 'Inny',
  },
  en: {
    ROAD_RACE: 'Road race',
    TT: 'Time Trial',
    GRAN_FONDO: 'Gran Fondo',
    CRIT: 'Criterium',
    TRIATHLON: 'Triathlon',
    OTHER: 'Other',
  },
});

export const EVENT_PRIORITY_LABELS: Record<string, string> = localized<Record<string, string>>({
  pl: { A: 'A — kluczowy', B: 'B — ważny', C: 'C — uzupełniający' },
  en: { A: 'A — key', B: 'B — important', C: 'C — supporting' },
});

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
