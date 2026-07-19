import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import TopBar from '../components/layout/TopBar';
import theme from '../theme/theme';

vi.mock('../components/layout/StatusPill', () => ({
  default: () => <div>Status pill</div>,
}));

vi.mock('../components/layout/TopBarSyncButton', () => ({
  default: () => <div>Sync button</div>,
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
        />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('TopBar', () => {
  it('shows only global application context on root route', () => {
    renderTopBar('/');

    expect(screen.getByText('Training Lab')).toBeDefined();
    expect(screen.queryByText('Dzisiaj')).toBeNull();
    expect(screen.queryByText('Decyzja treningowa')).toBeNull();
  });

  it('does not duplicate route-specific headings', () => {
    renderTopBar('/activities');

    expect(screen.getByText('Training Lab')).toBeDefined();
    expect(screen.queryByText('Aktywności')).toBeNull();
  });
});
