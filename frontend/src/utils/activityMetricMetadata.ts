import { getLocale, localized } from '@/i18n';
export interface ActivityMetricMetadata {
  label: string;
  unit?: string;
  decimals: number;
  description: string;
}

interface MetricDefinition {
  unit?: string;
  decimals: number;
}

const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  training_stress_score: { unit: 'pts', decimals: 0 },
  hr_tss: { unit: 'pts', decimals: 0 },
  normalized_power: { unit: 'W', decimals: 0 },
  intensity_factor: { decimals: 2 },
  variability_index: { decimals: 2 },
  efficiency_factor: { unit: 'W/bpm', decimals: 2 },
  aerobic_decoupling: { unit: '%', decimals: 1 },
  power_fade: { unit: '%', decimals: 1 },
  trimp: { unit: 'pts', decimals: 0 },
};

const TEXTS = localized<Record<string, { label: string; description: string }>>({
  pl: {
    training_stress_score: { label: 'Obciążenie treningowe', description: 'Łączy czas i intensywność sesji w jeden wskaźnik obciążenia.' },
    hr_tss: { label: 'Obciążenie z tętna', description: 'Szacowane obciążenie na podstawie czasu i odpowiedzi tętna.' },
    normalized_power: { label: 'Moc znormalizowana', description: 'Moc uwzględniająca koszt fizjologiczny zmiennego tempa jazdy.' },
    intensity_factor: { label: 'Współczynnik intensywności', description: 'Relacja mocy znormalizowanej do aktualnego FTP.' },
    variability_index: { label: 'Zmienność mocy', description: 'Relacja mocy znormalizowanej do średniej; niżej oznacza równiejsze tempo.' },
    efficiency_factor: { label: 'Efektywność', description: 'Ile mocy przypada na jedno uderzenie serca.' },
    aerobic_decoupling: { label: 'Dryf tętna', description: 'Zmiana relacji mocy do tętna między pierwszą i drugą częścią treningu.' },
    power_fade: { label: 'Spadek mocy', description: 'Zmiana zdolności utrzymania mocy pod koniec sesji.' },
    trimp: { label: 'TRIMP', description: 'Obciążenie wyliczone z czasu i intensywności tętna.' },
    fallback: { label: '', description: 'Dodatkowa metryka wyliczona dla tej aktywności.' },
  },
  en: {
    training_stress_score: { label: 'Training load', description: 'Combines session duration and intensity into a single load score.' },
    hr_tss: { label: 'Heart-rate load', description: 'Estimated load based on duration and heart-rate response.' },
    normalized_power: { label: 'Normalized power', description: 'Power that accounts for the physiological cost of a variable pace.' },
    intensity_factor: { label: 'Intensity factor', description: 'Ratio of normalized power to your current FTP.' },
    variability_index: { label: 'Power variability', description: 'Ratio of normalized to average power; lower means a steadier pace.' },
    efficiency_factor: { label: 'Efficiency', description: 'How much power you produce per heartbeat.' },
    aerobic_decoupling: { label: 'Heart-rate drift', description: 'Change in the power-to-heart-rate ratio between the first and second half.' },
    power_fade: { label: 'Power fade', description: 'Change in the ability to hold power towards the end of the session.' },
    trimp: { label: 'TRIMP', description: 'Load calculated from duration and heart-rate intensity.' },
    fallback: { label: '', description: 'Additional metric calculated for this activity.' },
  },
});

const POINTS_UNIT = localized({ pl: { value: 'pkt' }, en: { value: 'pts' } });

function normalizeMetricName(name: string) {
  return name.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function fallbackLabel(name: string) {
  const normalized = normalizeMetricName(name).replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getActivityMetricMetadata(name: string): ActivityMetricMetadata {
  const key = normalizeMetricName(name);
  const definition = METRIC_DEFINITIONS[key];
  if (!definition) {
    return { label: fallbackLabel(name), decimals: 1, description: TEXTS.fallback!.description };
  }
  const text = TEXTS[key]!;
  const unit = definition.unit === 'pts' ? POINTS_UNIT.value : definition.unit;
  return { ...definition, unit, label: text.label, description: text.description };
}

export function formatActivityMetric(name: string, value: number) {
  const metadata = getActivityMetricMetadata(name);
  const formatted = new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: metadata.decimals,
    maximumFractionDigits: metadata.decimals,
  }).format(value);
  return metadata.unit ? `${formatted} ${metadata.unit}` : formatted;
}
