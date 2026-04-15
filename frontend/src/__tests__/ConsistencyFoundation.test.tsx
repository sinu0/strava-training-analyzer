import { Alert, Button, ThemeProvider } from '@mui/material';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChartContainer from '@/components/common/ChartContainer';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorState from '@/components/common/ErrorState';
import FormDialog from '@/components/common/FormDialog';
import ScoreBadge from '@/components/common/ScoreBadge';
import { useCountdown } from '@/hooks/useCountdown';
import { useFormDialog } from '@/hooks/useFormDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { NotificationProvider, useNotification } from '@/hooks/useNotification';
import theme from '@/theme/theme';
import { STATUS_COLORS, WEATHER_SCORE_COLORS } from '@/utils/colors';
import { getApiErrorMessage } from '@/utils/errorHandling';
import { getReadinessScale } from '@/utils/readinessScales';
import { getScoreColor } from '@/utils/scoreColor';

import type { ReactNode } from 'react';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

function renderWithNotifications(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <NotificationProvider>{ui}</NotificationProvider>
    </ThemeProvider>,
  );
}

function Wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

describe('consistency foundation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('maps default score colors consistently', () => {
    expect(getScoreColor(90)).toBe(WEATHER_SCORE_COLORS.excellent);
    expect(getScoreColor(60)).toBe(WEATHER_SCORE_COLORS.good);
    expect(getScoreColor(40)).toBe(WEATHER_SCORE_COLORS.poor);
    expect(getScoreColor(10)).toBe(WEATHER_SCORE_COLORS.severe);
  });

  it('returns readiness scale metadata from shared ranges', () => {
    expect(getReadinessScale(97)).toMatchObject({
      label: 'Pełna moc',
      image: 'peak',
      color: STATUS_COLORS.success,
    });
    expect(getReadinessScale(38)).toMatchObject({
      label: 'Zmęczenie',
      image: 'tired',
      color: STATUS_COLORS.warning,
    });
  });

  it('extracts api message from axios errors', () => {
    const error = new AxiosError('Request failed', '500', undefined, undefined, {
      data: { message: 'Backend exploded' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: {} as never },
    } as never);

    expect(getApiErrorMessage(error, 'fallback')).toBe('Backend exploded');
    expect(getApiErrorMessage(new Error('x'), 'fallback')).toBe('fallback');
  });

  it('persists local storage state through the shared hook', () => {
    const { result } = renderHook(() => useLocalStorage('feed-view-mode', 'feed'), {
      wrapper: Wrapper,
    });

    expect(result.current[0]).toBe('feed');

    act(() => {
      result.current[1]('calendar');
    });

    expect(result.current[0]).toBe('calendar');
    expect(localStorage.getItem('feed-view-mode')).toBe('"calendar"');
  });

  it('opens, updates and resets form dialog state', () => {
    const { result } = renderHook(
      () => useFormDialog({ name: '', notes: '' }),
      { wrapper: Wrapper },
    );

    expect(result.current.open).toBe(false);

    act(() => {
      result.current.openDialog({ name: 'Jan' });
    });

    expect(result.current.open).toBe(true);
    expect(result.current.values.name).toBe('Jan');

    act(() => {
      result.current.setValue('notes', 'Test');
      result.current.closeDialog();
    });

    expect(result.current.open).toBe(false);
    expect(result.current.values).toEqual({ name: '', notes: '' });
  });

  it('counts down to the target date with a formatted label', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T18:00:00Z'));

    const { result } = renderHook(
      () => useCountdown('2026-04-05T18:01:30Z'),
      { wrapper: Wrapper },
    );

    expect(result.current.label).toBe('1m 30s');
    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current.label).toBe('1m 0s');
  });

  it('renders a reusable error state with retry action', () => {
    const onRetry = vi.fn();

    renderWithTheme(
      <ErrorState
        title="Błąd"
        message="Nie udało się pobrać danych"
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));

    expect(screen.getByText('Nie udało się pobrać danych')).toBeDefined();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders a reusable confirm dialog', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    renderWithTheme(
      <ConfirmDialog
        open
        title="Usuń"
        message="Czy na pewno?"
        confirmLabel="Tak"
        cancelLabel="Nie"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tak' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nie' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a reusable form dialog and submits content', () => {
    const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());

    renderWithTheme(
      <FormDialog
        open
        title="Dodaj wpis"
        submitLabel="Zapisz"
        onSubmit={onSubmit}
        onClose={() => {}}
      >
        <Alert severity="info">Form body</Alert>
      </FormDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(screen.getByText('Form body')).toBeDefined();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('handles loading, error, empty and content states in chart container', () => {
    const { rerender } = renderWithTheme(
      <ChartContainer title="Wykres" loading loadingMessage="Ładowanie wykresu" />,
    );

    expect(screen.getByText('Ładowanie wykresu')).toBeDefined();

    rerender(
      <ThemeProvider theme={theme}>
        <ChartContainer title="Wykres" error="Ups" />
      </ThemeProvider>,
    );

    expect(screen.getByText('Ups')).toBeDefined();

    rerender(
      <ThemeProvider theme={theme}>
        <ChartContainer title="Wykres" empty emptyTitle="Brak punktów" />
      </ThemeProvider>,
    );

    expect(screen.getByText('Brak punktów')).toBeDefined();

    rerender(
      <ThemeProvider theme={theme}>
        <ChartContainer title="Wykres">
          <div>Chart content</div>
        </ChartContainer>
      </ThemeProvider>,
    );

    expect(screen.getByText('Chart content')).toBeDefined();
  });

  it('renders score badge using shared ranges', () => {
    renderWithTheme(<ScoreBadge score={82} />);

    expect(screen.getByText('82/100')).toBeDefined();
    expect(screen.getByText('Świetne')).toBeDefined();
  });

  it('shows notifications from the shared provider', () => {
    function NotificationButton() {
      const { notifySuccess } = useNotification();
      return <Button onClick={() => notifySuccess('Zapisano zmiany')}>Pokaż</Button>;
    }

    renderWithNotifications(<NotificationButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Pokaż' }));

    expect(screen.getByText('Zapisano zmiany')).toBeDefined();
  });
});
