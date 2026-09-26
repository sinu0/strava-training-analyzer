import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { pl } from '@/i18n/locales/pl';
import { translate, type TranslationParams } from '@/i18n/translate';
import type { Language, Messages, TranslationKey } from '@/i18n/types';

const STORAGE_KEY = 'strava-analizator.language';

// Polish ships in the entry chunk; other languages are fetched on first use to keep the bundle budget.
const LOADERS: Record<Language, () => Promise<Messages>> = {
  pl: () => Promise.resolve(pl),
  en: () => import('@/i18n/locales/en').then((module) => module.en),
};
const LOCALES: Record<Language, string> = { pl: 'pl-PL', en: 'en-GB' };

interface I18nContextValue {
  language: Language;
  /** BCP 47 locale for `Intl` / `toLocale*String` formatting. */
  locale: string;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

function createValue(
  language: Language,
  messages: Messages,
  setLanguage: (language: Language) => void,
  toggleLanguage: () => void,
): I18nContextValue {
  const locale = LOCALES[language];
  return {
    language,
    locale,
    setLanguage,
    toggleLanguage,
    t: (key, params) => translate(messages, locale, key, params),
  };
}

const I18nContext = createContext<I18nContextValue | null>(null);
const FALLBACK_I18N = createValue('pl', pl, () => undefined, () => undefined);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'pl';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'pl' ? stored : 'pl';
  } catch {
    return 'pl';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  // The active catalog follows `language` once its messages are loaded (Polish meanwhile).
  const [catalog, setCatalog] = useState<{ language: Language; messages: Messages }>({ language: 'pl', messages: pl });

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // The language stays usable for the session in private or restricted browsers.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'pl' ? 'en' : 'pl');
  }, [language, setLanguage]);

  useEffect(() => {
    if (catalog.language === language) return undefined;
    let cancelled = false;
    void LOADERS[language]().then((messages) => {
      if (!cancelled) setCatalog({ language, messages });
    });
    return () => {
      cancelled = true;
    };
  }, [catalog.language, language]);

  useEffect(() => {
    document.documentElement.lang = catalog.language;
  }, [catalog.language]);

  const value = useMemo(
    () => createValue(catalog.language, catalog.messages, setLanguage, toggleLanguage),
    [catalog, setLanguage, toggleLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Returns the active language, its locale and the `t()` translator (Polish when no provider is mounted). */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext) ?? FALLBACK_I18N;
}
