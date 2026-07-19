import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ThemeModeSettings from '@/components/settings/ThemeModeSettings';
import { ThemeModeProvider } from '@/context/ThemeModeContext';

function renderSettings() {
  return render(
    <ThemeModeProvider>
      <ThemeModeSettings />
    </ThemeModeProvider>,
  );
}

describe('ThemeModeSettings', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-color-mode');
  });

  it('exposes an explicit saved choice between dark and light themes', async () => {
    renderSettings();

    expect(screen.getByRole('heading', { name: 'Motyw aplikacji' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Jasny motyw' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Ciemny motyw' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Ciemny motyw' }).getAttribute('aria-pressed')).toBe('true'));
    expect(window.localStorage.getItem('strava-analizator.color-mode')).toBe('dark');
  });
});
