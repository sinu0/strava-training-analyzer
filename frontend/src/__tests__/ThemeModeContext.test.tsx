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

  it('starts in light mode when there is no saved preference', () => {
    renderProbe();

    expect(screen.getByTestId('mode').textContent).toBe('light:light');
  });

  it('toggles to dark mode and saves the choice', async () => {
    renderProbe();
    fireEvent.click(screen.getByRole('button', { name: 'Zmień motyw' }));

    await waitFor(() => expect(screen.getByTestId('mode').textContent).toBe('dark:dark'));
    expect(window.localStorage.getItem('strava-analizator.color-mode')).toBe('dark');
    expect(document.documentElement.dataset.colorMode).toBe('dark');
  });

  it('restores a previously saved dark choice', () => {
    window.localStorage.setItem('strava-analizator.color-mode', 'dark');
    renderProbe();

    expect(screen.getByTestId('mode').textContent).toBe('dark:dark');
  });
});
