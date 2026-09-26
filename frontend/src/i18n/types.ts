import type { pl } from '@/i18n/locales/pl';
import type { PluralForms } from '@/i18n/translate';

type Source = typeof pl;

/** Dotted paths to every translatable leaf (strings and plural nodes). */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends { other: string }
      ? `${Prefix}${K}`
      : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Same structure as the Polish source, with any string values and language-specific plural forms. */
type Shape<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K] extends { other: string } ? PluralForms : Shape<T[K]>;
};

export type TranslationKey = Leaves<Source>;
export type Messages = Shape<Source>;

export type Language = 'pl' | 'en';
