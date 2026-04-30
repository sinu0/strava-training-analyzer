import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import TopBar from '../components/layout/TopBar';
import theme from '../theme/theme';

vi.mock('../components/layout/StatusPill', () => ({
  default: () => <div>Status pill</div>,
}));

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderTopBar(pathname: string) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[pathname]}>
        <TopBar
          onToggleSidebar={vi.fn()}
          readiness={{ score: 70, level: 'high', tsb: 5, ctl: 60, atl: 55, description: 'good', dayLabel: 'Tempo' }}
          blockHealth={{
            status: 'STABLE_PRODUCTIVE',
            label: 'Blok stabilny',
            description: 'ok',
            adjustmentDays: 1,
            missedStimulusDays: 0,
            overloadDays: 0,
            keySignals: [],
          }}
          profileName="Jan Test"
        />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('TopBar', () => {
  it('shows home context on root route', () => {
    renderTopBar('/');

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Ostatni trening')).toBeDefined();
    expect(screen.getByText('Tempo')).toBeDefined();
    expect(screen.getByText('Blok stabilny')).toBeDefined();
  });

  it('shows home context on dashboard route', () => {
    renderTopBar('/dashboard');

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Ostatni trening')).toBeDefined();
  });
});
