import { defineMessages } from '@/i18n';

export const dataJobsMessages = defineMessages({
  pl: {
    title: 'Dane i zadania',
    subtitle: 'Kontroluj kompletność danych, import oraz bezpieczne przeliczanie metryk.',
    quality: {
      title: 'Jakość danych',
      loading: 'Sprawdzanie jakości…',
      error: 'Nie udało się pobrać jakości danych.',
      assessed: 'Ocenionych',
      available: 'Dostępnych',
      partial: 'Częściowych',
      unknown: 'Nieznanych',
      measuredPower: 'Moc zmierzona',
      estimatedPower: 'Moc szacowana',
      unknownPowerProvenance: 'Nieznane źródło mocy',
      unassessed: 'Nieocenionych: {count}. Uruchom „Przelicz metryki”, aby wykonać backfill ocen.',
    },
    run: {
      title: 'Uruchom zadanie',
      description: 'Każde zadanie zapisuje etap, próbę i błąd. Import nie uruchomi się równolegle drugi raz.',
      importRecent: 'Import ostatnich',
      importFull: 'Pełny import',
      importPowerProvenance: 'Uzupełnij źródło mocy',
      recalculate: 'Przelicz metryki',
      powerProvenanceCaption: 'Uzupełnienie źródła mocy pobiera ze Stravy wyłącznie jawne metadane pomiaru. Brakująca flaga pozostaje nieznana — aplikacja nie zgaduje jej na podstawie watów.',
    },
    job: {
      attempt: '{jobType} · próba {attempt}',
      retryInfo: 'Limit API. Zadanie wznowi się automatycznie {time}.',
      retry: 'Wznów od niezakończonego etapu',
    },
    empty: {
      title: 'Brak aktywnego zadania',
      description: 'Uruchom import lub przeliczenie metryk. Postęp i ewentualne błędy pojawią się w tym miejscu.',
    },
  },
  en: {
    title: 'Data and jobs',
    subtitle: 'Monitor data completeness, imports, and safe metric recalculation.',
    quality: {
      title: 'Data quality',
      loading: 'Checking quality…',
      error: 'Could not fetch data quality.',
      assessed: 'Assessed',
      available: 'Available',
      partial: 'Partial',
      unknown: 'Unknown',
      measuredPower: 'Measured power',
      estimatedPower: 'Estimated power',
      unknownPowerProvenance: 'Unknown power source',
      unassessed: 'Unassessed: {count}. Run "Recalculate metrics" to backfill ratings.',
    },
    run: {
      title: 'Run a job',
      description: 'Every job records its stage, attempt and error. An import will not run twice in parallel.',
      importRecent: 'Import recent',
      importFull: 'Full import',
      importPowerProvenance: 'Backfill power source',
      recalculate: 'Recalculate metrics',
      powerProvenanceCaption: 'Backfilling the power source fetches only explicit measurement metadata from Strava. A missing flag stays unknown — the app never guesses it from the watt values.',
    },
    job: {
      attempt: '{jobType} · attempt {attempt}',
      retryInfo: 'API limit reached. The job will resume automatically {time}.',
      retry: 'Resume from the unfinished stage',
    },
    empty: {
      title: 'No active job',
      description: 'Run an import or a metric recalculation. Progress and any errors will appear here.',
    },
  },
});
