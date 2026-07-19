import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { useUiPreferences } from '@/hooks/useUiPreferences';
import theme from '@/theme/theme';
import { DEFAULT_UI_PREFERENCES } from '@/utils/uiPreferences';

vi.mock('@/hooks/useUiPreferences', () => ({
  useUiPreferences: vi.fn(),
}));

function LocationProbe() {
  return <output>{useLocation().pathname}</output>;
}

describe('MobileBottomNav', () => {
  it('renders four saved shortcuts and More', () => {
    vi.mocked(useUiPreferences).mockReturnValue({
      data: {
        ...structuredClone(DEFAULT_UI_PREFERENCES),
        mobileNavigation: ['/', '/activities', '/training', '/routes'],
      },
    } as ReturnType<typeof useUiPreferences>);

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <MobileBottomNav />
          <LocationProbe />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: 'Dzisiaj' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Historia' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Plan' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Trasy' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Więcej' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Analiza' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Trasy' }));
    expect(screen.getByText('/routes')).toBeDefined();
  });
});
