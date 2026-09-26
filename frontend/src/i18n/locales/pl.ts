/**
 * Polish messages — the source of truth for translation keys.
 * `en.ts` must mirror this structure (enforced by the `Messages` type).
 * Plural nodes are objects with an `other` form (plus `one`/`few`/`many` as the language needs).
 */
export const pl = {
  nav: {
    today: { label: 'Dzisiaj', description: 'Decyzja i kontekst dnia' },
    history: { label: 'Historia', description: 'Wykonane aktywności' },
    analysis: { label: 'Analiza', description: 'Trendy i obciążenie' },
    plan: { label: 'Plan', description: 'Kalendarz i scenariusze' },
    routes: { label: 'Trasy', description: 'Planowanie przejazdu' },
    segments: { label: 'Segmenty', description: 'Własne próby i rekordy' },
    weather: { label: 'Pogoda', description: 'Warunki dla treningu' },
    health: { label: 'Zdrowie', description: 'Regeneracja i masa ciała' },
    profile: { label: 'Profil', description: 'Strefy i dane sportowe' },
    data: { label: 'Dane', description: 'Import i jakość danych' },
    settings: { label: 'Ustawienia', description: 'Integracje i konfiguracja' },
    more: 'Więcej',
    mainGroup: 'Główne',
    mobileAriaLabel: 'Nawigacja główna',
  },
  sidebar: {
    tagline: 'cycling performance',
    privacy: 'Local-only · dane prywatne',
  },
  topBar: {
    toggleMenu: 'Przełącz menu',
    searchPlaceholder: 'Szukaj aktywności…',
    searchLabel: 'Szukaj aktywności',
    enableLightMode: 'Włącz jasny motyw',
    enableDarkMode: 'Włącz ciemny motyw',
    switchLanguage: 'Zmień język na angielski',
    profileMenu: 'Profil',
    user: 'Użytkownik',
    profile: 'Profil',
  },
  sync: {
    inProgress: 'Synchronizacja w toku…',
    connectInSettings: 'Połącz Stravę w ustawieniach, aby synchronizować treningi',
    rateLimited: 'API Strava zablokowane',
    failed: 'Synchronizacja nie powiodła się — sprawdź Dane i zadania',
    newActivities: {
      one: 'Sync: {count} nowa aktywność',
      few: 'Sync: {count} nowe aktywności',
      many: 'Sync: {count} nowych aktywności',
      other: 'Sync: {count} nowej aktywności',
    },
    recent: 'Sync ostatnich treningów',
    connectAction: 'Połącz Stravę, aby synchronizować treningi',
    syncAction: 'Synchronizuj ostatnie treningi',
  },
  more: {
    title: 'Więcej',
    subtitle: 'Pełna pogoda, profil sportowy, zdrowie oraz kontrola danych w jednym miejscu.',
    items: {
      weather: { label: 'Pogoda', description: 'Prognoza, lokalizacje i ustawienia' },
      profile: { label: 'Profil', description: 'FTP, tętno i ustawienia sportowe' },
      health: { label: 'Zdrowie', description: 'Ręczny check-in i dostępność danych' },
      weight: { label: 'Masa ciała', description: 'Historia oraz cel masy' },
      data: { label: 'Dane', description: 'Synchronizacja, przeliczenia i diagnostyka' },
      settings: { label: 'Ustawienia', description: 'Integracje i konfiguracja aplikacji' },
    },
    shortcutsError: 'Nie udało się wczytać ustawień skrótów mobilnych.',
    shortcutsLoading: 'Wczytywanie skrótów mobilnych…',
  },
  mobileShortcuts: {
    title: 'Skróty mobilne',
    description: 'Wybierz dokładnie cztery sekcje widoczne obok przycisku „Więcej”.',
    complete: 'Wybrano 4 skróty.',
    missing: {
      one: 'Wybierz jeszcze {count} skrót.',
      few: 'Wybierz jeszcze {count} skróty.',
      many: 'Wybierz jeszcze {count} skrótów.',
      other: 'Wybierz jeszcze {count} skrótu.',
    },
    save: 'Zapisz skróty',
    saveError: 'Nie udało się zapisać skrótów. Odśwież dane i spróbuj ponownie.',
  },
  shortcutPin: {
    pinned: '{label} w skrótach',
    pin: 'Przypnij {label}',
    replace: 'Zastąp {label}',
    saveError: 'Nie udało się zapisać skrótu.',
  },
  themeSettings: {
    title: 'Motyw aplikacji',
    description: 'Wybierz jasny lub ciemny wygląd. Zapisujemy tę preferencję lokalnie na tym urządzeniu.',
    ariaLabel: 'Wybór motywu aplikacji',
    dark: { label: 'Ciemny motyw', description: 'Domyślny, kontrastowy widok do pracy wieczorem.' },
    light: { label: 'Jasny motyw', description: 'Lekki widok inspirowany panelem treningowym.' },
  },
};
