import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import LanguageSettings from '@/components/settings/LanguageSettings';
import { I18nProvider } from '@/i18n';

function renderSettings() {
  return render(
    <I18nProvider>
      <LanguageSettings />
    </I18nProvider>,
  );
}

describe('LanguageSettings', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('lets the user switch the interface language and persists the choice', async () => {
    renderSettings();

    expect(screen.getByRole('heading', { name: 'Język / Language' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Polski' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true'));
    expect(window.localStorage.getItem('strava-analizator.language')).toBe('en');
    expect(await screen.findByText('Choose the app interface language.')).toBeDefined();
  });

  it('renders English texts when the stored language is English', async () => {
    window.localStorage.setItem('strava-analizator.language', 'en');
    renderSettings();

    expect(await screen.findByText('Choose the app interface language.')).toBeDefined();
  });
});
