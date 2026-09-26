import type { pl } from '@/i18n/locales/pl';
import type { PluralForms } from '@/i18n/translate';

/** Dotted paths to every translatable leaf (strings and plural nodes). */
export type MessageKey<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends { other: string }
      ? `${Prefix}${K}`
      : MessageKey<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Same structure as the Polish source, with any string values and language-specific plural forms. */
export type MessageShape<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends { other: string } ? PluralForms : MessageShape<T[K]>;
};

export type TranslationKey = MessageKey<typeof pl>;
export type Messages = MessageShape<typeof pl>;

export type Language = 'pl' | 'en';
