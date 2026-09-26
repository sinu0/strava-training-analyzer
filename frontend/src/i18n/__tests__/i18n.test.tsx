import { Button, Typography } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { defineMessages } from '@/i18n/defineMessages';
import { I18nProvider, useI18n } from '@/i18n/I18nContext';
import { en } from '@/i18n/locales/en';
import { pl } from '@/i18n/locales/pl';
import { localized } from '@/i18n/localized';
import { setRuntimeLanguage } from '@/i18n/runtime';
import { translate } from '@/i18n/translate';

function collectKeys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : collectKeys(value as object, `${prefix}${key}.`),
  );
}

describe('translate', () => {
  it('resolves nested keys and interpolates params', () => {
    const messages = { a: { b: 'Cześć {name}!' } };
    expect(translate(messages, 'pl-PL', 'a.b', { name: 'Ania' })).toBe('Cześć Ania!');
  });

  it('selects the plural form using the locale rules', () => {
    const messages = { item: { one: '{count} skrót', few: '{count} skróty', many: '{count} skrótów', other: '{count} skrótu' } };
    expect(translate(messages, 'pl-PL', 'item', { count: 1 })).toBe('1 skrót');
    expect(translate(messages, 'pl-PL', 'item', { count: 3 })).toBe('3 skróty');
    expect(translate(messages, 'pl-PL', 'item', { count: 5 })).toBe('5 skrótów');
  });

  it('returns the key when a translation is missing', () => {
    expect(translate({}, 'en-GB', 'missing.key')).toBe('missing.key');
  });
});

describe('locales', () => {
  it('English defines exactly the same keys as Polish (plural forms may differ)', () => {
    const plKeys = new Set(collectKeys(pl).map((key) => key.replace(/\.(one|few|many|other)$/, '')));
    const enKeys = new Set(collectKeys(en).map((key) => key.replace(/\.(one|few|many|other)$/, '')));
    expect([...enKeys].sort()).toEqual([...plKeys].sort());
  });
});

function Probe() {
  const { language, locale, t, toggleLanguage } = useI18n();
  return (
    <>
      <Typography data-testid="probe">{language}:{locale}:{t('nav.today.label')}</Typography>
      <Button onClick={toggleLanguage}>toggle</Button>
    </>
  );
}

describe('I18nProvider', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = '';
  });

  it('defaults to Polish', () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    expect(screen.getByTestId('probe').textContent).toBe('pl:pl-PL:Dzisiaj');
    expect(document.documentElement.lang).toBe('pl');
  });

  it('switches to English and persists the choice', async () => {
    render(<I18nProvider><Probe /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('en:en-GB:Today'));
    expect(document.documentElement.lang).toBe('en');
    expect(window.localStorage.getItem('strava-analizator.language')).toBe('en');
  });

  it('restores the stored language', async () => {
    window.localStorage.setItem('strava-analizator.language', 'en');
    render(<I18nProvider><Probe /></I18nProvider>);
    await waitFor(() => expect(screen.getByTestId('probe').textContent).toBe('en:en-GB:Today'));
  });

  it('falls back to Polish without a provider', () => {
    render(<Probe />);
    expect(screen.getByTestId('probe').textContent).toBe('pl:pl-PL:Dzisiaj');
  });
});

const featureMessages = defineMessages({
  pl: { greeting: 'Cześć {name}', items: { one: '{count} trening', few: '{count} treningi', many: '{count} treningów', other: '{count} treningu' } },
  en: { greeting: 'Hi {name}', items: { one: '{count} workout', other: '{count} workouts' } },
});

function FeatureProbe() {
  const t = featureMessages.useT();
  const { toggleLanguage } = useI18n();
  return (
    <>
      <Typography data-testid="feature">{t('greeting', { name: 'Ola' })} · {t('items', { count: 5 })} · {featureMessages.t('greeting', { name: 'X' })}</Typography>
      <Button onClick={toggleLanguage}>toggle</Button>
    </>
  );
}

describe('defineMessages', () => {
  afterEach(() => window.localStorage.clear());

  it('translates feature-local messages in the active language, in hooks and plain calls', async () => {
    render(<I18nProvider><FeatureProbe /></I18nProvider>);
    expect(screen.getByTestId('feature').textContent).toBe('Cześć Ola · 5 treningów · Cześć X');
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    await waitFor(() => expect(screen.getByTestId('feature').textContent).toBe('Hi Ola · 5 workouts · Hi X'));
  });
});

describe('localized', () => {
  beforeEach(() => setRuntimeLanguage('pl'));
  afterEach(() => setRuntimeLanguage('pl'));

  it('resolves object and array contents in the active language', () => {
    const labels = localized({ pl: { A: 'Próg', B: 'Tempo' }, en: { A: 'Threshold', B: 'Tempo' } });
    const options = localized({ pl: ['jeden', 'dwa'], en: ['one', 'two'] });
    expect(labels.A).toBe('Próg');
    expect(options.map((value) => value.toUpperCase())).toEqual(['JEDEN', 'DWA']);
    setRuntimeLanguage('en');
    expect(labels.A).toBe('Threshold');
    expect(Object.entries(labels)).toEqual([['A', 'Threshold'], ['B', 'Tempo']]);
    expect(options.length).toBe(2);
    expect([...options]).toEqual(['one', 'two']);
    expect(Array.isArray(options)).toBe(true);
    expect(Object.keys(options)).toEqual(['0', '1']);
  });
});
