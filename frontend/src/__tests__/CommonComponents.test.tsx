import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll } from 'vitest';

import ChartWrapper from '../components/common/ChartWrapper';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/common/PageContainer';
import Section from '../components/common/Section';
import StatDisplay from '../components/common/StatDisplay';
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

describe('Section', () => {
  it('renders title and children', () => {
    renderWithTheme(<Section title="Test Title">Content here</Section>);
    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Content here')).toBeDefined();
  });

  it('renders subtitle when provided', () => {
    renderWithTheme(<Section title="T" subtitle="Sub text">Child</Section>);
    expect(screen.getByText('Sub text')).toBeDefined();
  });

  it('renders action slot', () => {
    renderWithTheme(<Section title="T" action={<button>Act</button>}>Child</Section>);
    expect(screen.getByText('Act')).toBeDefined();
  });

  it('renders without title', () => {
    renderWithTheme(<Section>No title content</Section>);
    expect(screen.getByText('No title content')).toBeDefined();
  });
});

describe('PageContainer', () => {
  it('renders title and children', () => {
    renderWithTheme(<PageContainer title="Page">Page content</PageContainer>);
    expect(screen.getByText('Page')).toBeDefined();
    expect(screen.getByText('Page content')).toBeDefined();
  });

  it('renders subtitle', () => {
    renderWithTheme(<PageContainer title="P" subtitle="Description">C</PageContainer>);
    expect(screen.getByText('Description')).toBeDefined();
  });

  it('renders actions', () => {
    renderWithTheme(<PageContainer title="P" actions={<button>Action</button>}>C</PageContainer>);
    expect(screen.getByText('Action')).toBeDefined();
  });

  it('renders breadcrumbs when provided', () => {
    renderWithThemeAndRouter(
      <PageContainer
        title="Aktywności"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Aktywności' },
        ]}
      >
        C
      </PageContainer>,
    );

    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getAllByText('Aktywności').length).toBeGreaterThanOrEqual(1);
  });

  it('renders without title', () => {
    renderWithTheme(<PageContainer>Just content</PageContainer>);
    expect(screen.getByText('Just content')).toBeDefined();
  });
});

describe('StatDisplay', () => {
  it('renders value and label', () => {
    renderWithTheme(<StatDisplay value={250} label="FTP" unit="W" />);
    expect(screen.getByText('250')).toBeDefined();
    expect(screen.getByText('FTP')).toBeDefined();
    expect(screen.getByText('W')).toBeDefined();
  });

  it('shows positive trend', () => {
    renderWithTheme(<StatDisplay value={100} label="Test" trend={5.2} />);
    expect(screen.getByText('+5.2%')).toBeDefined();
  });

  it('shows negative trend', () => {
    renderWithTheme(<StatDisplay value={100} label="Test" trend={-3.1} />);
    expect(screen.getByText('-3.1%')).toBeDefined();
  });

  it('respects size prop', () => {
    const { container } = renderWithTheme(<StatDisplay value="42" label="Metric" size="lg" />);
    const h4 = container.querySelector('.MuiTypography-h4');
    expect(h4).toBeDefined();
    expect(h4?.textContent).toBe('42');
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

describe('ChartWrapper', () => {
  it('renders title and children', () => {
    renderWithTheme(<ChartWrapper title="Chart Title"><div>Chart goes here</div></ChartWrapper>);
    expect(screen.getByText('Chart Title')).toBeDefined();
    expect(screen.getByText('Chart goes here')).toBeDefined();
  });

  it('renders legend slot', () => {
    renderWithTheme(
      <ChartWrapper title="C" legend={<span>Legend items</span>}>
        <div>Chart</div>
      </ChartWrapper>,
    );
    expect(screen.getByText('Legend items')).toBeDefined();
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
