import { Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeModeProvider, useColorMode } from '@/context/ThemeModeContext';

function ModeProbe() {
  const { mode, toggleMode } = useColorMode();
  const theme = useTheme();
  return (
    <>
      <Typography data-testid="mode">{mode}:{theme.palette.mode}</Typography>
      <Button onClick={toggleMode}>Zmień motyw</Button>
    </>
  );
}

function renderProbe() {
  return render(
    <ThemeModeProvider>
      <ModeProbe />
    </ThemeModeProvider>,
  );
}

describe('ThemeModeProvider', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-color-mode');
  });

  it('starts in dark mode when there is no saved preference', () => {
    renderProbe();

    expect(screen.getByTestId('mode').textContent).toBe('dark:dark');
  });

  it('toggles to light mode and saves the choice', async () => {
    renderProbe();
    fireEvent.click(screen.getByRole('button', { name: 'Zmień motyw' }));

    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('light:light'));
    expect(window.localStorage.getItem('strava-analizator.color-mode')).toBe('light');
    expect(document.documentElement.dataset.colorMode).toBe('light');
  });

  it('restores a previously saved light choice', () => {
    window.localStorage.setItem('strava-analizator.color-mode', 'light');
    renderProbe();

    expect(screen.getByTestId('mode').textContent).toBe('light:light');
  });
});
