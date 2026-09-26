import { useCallback } from 'react';

import { useI18n } from '@/i18n/I18nContext';
import { getLanguage, getLocale, localeFor } from '@/i18n/runtime';
import { translate, type TranslationParams } from '@/i18n/translate';
import type { MessageKey, MessageShape } from '@/i18n/types';

export type Translator<Key extends string> = (key: Key, params?: TranslationParams) => string;

/**
 * Declares a feature-local message namespace. Polish is the key source; English must mirror it.
 * Both languages ship with the feature's lazy chunk, so the entry bundle does not grow.
 *
 * - `useT()` — hook for components (re-renders on a language switch),
 * - `t()` — for non-React code (formatters, label maps) called during render.
 */
export function defineMessages<Source extends object>(catalog: { pl: Source; en: MessageShape<Source> }) {
  type Key = MessageKey<Source>;

  const t: Translator<Key> = (key, params) => translate(catalog[getLanguage()], getLocale(), key, params);

  function useT(): Translator<Key> {
    const { language } = useI18n();
    return useCallback<Translator<Key>>(
      (key, params) => translate(catalog[language], localeFor(language), key, params),
      [language],
    );
  }

  return { t, useT };
}
