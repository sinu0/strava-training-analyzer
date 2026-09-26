import { getLanguage } from '@/i18n/runtime';
import type { Language } from '@/i18n/types';

/**
 * A constant (label map, option list) whose contents follow the active language.
 * Reads resolve at access time, so module-level maps stay correct after a language switch.
 */
export function localized<T extends object>(byLanguage: Record<Language, T>): T {
  const current = () => byLanguage[getLanguage()] as Record<PropertyKey, unknown>;
  // An array target keeps `Array.isArray` true for option lists.
  const target = (Array.isArray(byLanguage.pl) ? [] : {}) as T;
  return new Proxy(target, {
    get: (_target, property) => {
      const value = current()[property];
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(current()) : value;
    },
    has: (_target, property) => property in current(),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_target, property) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(current(), property);
      if (!descriptor) return undefined;
      // Array `length` is non-configurable on the target too; everything else must be configurable
      // because the (empty) target does not hold it.
      return property === 'length' && Array.isArray(target) ? descriptor : { ...descriptor, configurable: true };
    },
  });
}
