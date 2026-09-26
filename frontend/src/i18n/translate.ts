/** Plural forms selected with `Intl.PluralRules`; `other` is the required fallback. */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export type TranslationParams = Record<string, string | number>;

interface MessageTree {
  [key: string]: string | MessageTree;
}

function isPluralForms(node: unknown): node is PluralForms {
  return typeof node === 'object' && node !== null && typeof (node as PluralForms).other === 'string';
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] === undefined ? match : String(params[name]),
  );
}

/**
 * Resolves a dotted key in a message tree. Plural nodes are picked with the locale's plural rules
 * using `params.count`; `{name}` placeholders are replaced by params. A missing key returns the key itself.
 */
export function translate(
  messages: object,
  locale: string,
  key: string,
  params?: TranslationParams,
): string {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return key;
    node = (node as MessageTree)[part];
  }

  if (typeof node === 'string') return interpolate(node, params);
  if (isPluralForms(node)) {
    const count = Number(params?.count ?? 0);
    const form = new Intl.PluralRules(locale).select(count);
    return interpolate(node[form] ?? node.other, params);
  }
  return key;
}
