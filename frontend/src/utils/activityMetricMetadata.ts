export interface ActivityMetricMetadata {
  label: string;
  unit?: string;
  decimals: number;
  description: string;
}

const METRICS: Record<string, ActivityMetricMetadata> = {
  training_stress_score: {
    label: 'Obciążenie treningowe',
    unit: 'pkt',
    decimals: 0,
    description: 'Łączy czas i intensywność sesji w jeden wskaźnik obciążenia.',
  },
  hr_tss: {
    label: 'Obciążenie z tętna',
    unit: 'pkt',
    decimals: 0,
    description: 'Szacowane obciążenie na podstawie czasu i odpowiedzi tętna.',
  },
  normalized_power: {
    label: 'Moc znormalizowana',
    unit: 'W',
    decimals: 0,
    description: 'Moc uwzględniająca koszt fizjologiczny zmiennego tempa jazdy.',
  },
  intensity_factor: {
    label: 'Współczynnik intensywności',
    decimals: 2,
    description: 'Relacja mocy znormalizowanej do aktualnego FTP.',
  },
  variability_index: {
    label: 'Zmienność mocy',
    decimals: 2,
    description: 'Relacja mocy znormalizowanej do średniej; niżej oznacza równiejsze tempo.',
  },
  efficiency_factor: {
    label: 'Efektywność',
    unit: 'W/bpm',
    decimals: 2,
    description: 'Ile mocy przypada na jedno uderzenie serca.',
  },
  aerobic_decoupling: {
    label: 'Dryf tętna',
    unit: '%',
    decimals: 1,
    description: 'Zmiana relacji mocy do tętna między pierwszą i drugą częścią treningu.',
  },
  power_fade: {
    label: 'Spadek mocy',
    unit: '%',
    decimals: 1,
    description: 'Zmiana zdolności utrzymania mocy pod koniec sesji.',
  },
  trimp: {
    label: 'TRIMP',
    unit: 'pkt',
    decimals: 0,
    description: 'Obciążenie wyliczone z czasu i intensywności tętna.',
  },
};

function normalizeMetricName(name: string) {
  return name.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function fallbackLabel(name: string) {
  const normalized = normalizeMetricName(name).replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getActivityMetricMetadata(name: string): ActivityMetricMetadata {
  return METRICS[normalizeMetricName(name)] ?? {
    label: fallbackLabel(name),
    decimals: 1,
    description: 'Dodatkowa metryka wyliczona dla tej aktywności.',
  };
}

export function formatActivityMetric(name: string, value: number) {
  const metadata = getActivityMetricMetadata(name);
  const formatted = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: metadata.decimals,
    maximumFractionDigits: metadata.decimals,
  }).format(value);
  return metadata.unit ? `${formatted} ${metadata.unit}` : formatted;
}
