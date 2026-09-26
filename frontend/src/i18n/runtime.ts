import type { Language } from '@/i18n/types';

const LOCALES: Record<Language, string> = { pl: 'pl-PL', en: 'en-GB' };

let currentLanguage: Language = 'pl';

/**
 * Active language for code outside React (formatters, label maps). Kept in sync by `I18nProvider`;
 * components re-render on a switch because they consume the i18n context.
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/** BCP 47 locale of the active language for `Intl` / `toLocale*String`. */
export function getLocale(): string {
  return LOCALES[currentLanguage];
}

export function localeFor(language: Language): string {
  return LOCALES[language];
}

export function setRuntimeLanguage(language: Language): void {
  currentLanguage = language;
}
