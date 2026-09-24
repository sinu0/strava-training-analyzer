import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll } from 'vitest';

import { EmptyState, Page } from '@/ui';

import TabsNav from '../components/common/TabsNav';
import theme from '../theme/theme';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

function renderWithThemeAndRouter(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>,
  );
}

describe('Page', () => {
  it('renders title and children', () => {
    renderWithTheme(<Page title="Page">Page content</Page>);
    expect(screen.getByText('Page')).toBeDefined();
    expect(screen.getByText('Page content')).toBeDefined();
  });

  it('renders subtitle', () => {
    renderWithTheme(<Page title="P" subtitle="Description">C</Page>);
    expect(screen.getByText('Description')).toBeDefined();
  });

  it('renders actions', () => {
    renderWithTheme(<Page title="P" actions={<button>Action</button>}>C</Page>);
    expect(screen.getByText('Action')).toBeDefined();
  });

  it('renders breadcrumbs when provided', () => {
    renderWithThemeAndRouter(
      <Page
        title="Aktywności"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Aktywności' },
        ]}
      >
        C
      </Page>,
    );

    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getAllByText('Aktywności').length).toBeGreaterThanOrEqual(1);
  });

  it('renders without title', () => {
    renderWithTheme(<Page>Just content</Page>);
    expect(screen.getByText('Just content')).toBeDefined();
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    renderWithTheme(<EmptyState title="Brak danych" description="Dodaj aktywność" />);
    expect(screen.getByText('Brak danych')).toBeDefined();
    expect(screen.getByText('Dodaj aktywność')).toBeDefined();
  });

  it('renders action button', () => {
    const onClick = () => {};
    renderWithTheme(<EmptyState title="Empty" action={{ label: 'Dodaj', onClick }} />);
    expect(screen.getByText('Dodaj')).toBeDefined();
  });

  it('renders without optional props', () => {
    renderWithTheme(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeDefined();
  });

  it('renders illustration image when provided', () => {
    const { container } = renderWithTheme(
      <EmptyState title="Brak aktywności" illustration="/illustrations/empty-activities.png" />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/illustrations/empty-activities.png');
  });

  it('hides default icon when illustration is provided', () => {
    const { container } = renderWithTheme(
      <EmptyState title="Brak" illustration="/illustrations/empty-ai.png" />,
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('TabsNav', () => {
  it('renders all tabs', () => {
    const tabs = [
      { label: 'Tab A', value: 0 },
      { label: 'Tab B', value: 1 },
      { label: 'Tab C', value: 2 },
    ];
    renderWithTheme(<TabsNav tabs={tabs} value={0} onChange={() => {}} />);
    expect(screen.getByText('Tab A')).toBeDefined();
    expect(screen.getByText('Tab B')).toBeDefined();
    expect(screen.getByText('Tab C')).toBeDefined();
  });

  it('calls onChange when tab is clicked', () => {
    let selectedValue = 0;
    const tabs = [
      { label: 'First', value: 0 },
      { label: 'Second', value: 1 },
    ];
    renderWithTheme(
      <TabsNav tabs={tabs} value={selectedValue} onChange={(v) => { selectedValue = v; }} />,
    );
    fireEvent.click(screen.getByText('Second'));
    expect(selectedValue).toBe(1);
  });
});
