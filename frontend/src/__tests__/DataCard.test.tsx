import InsightsIcon from '@mui/icons-material/Insights';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import DataCard from '../components/common/DataCard';
import theme from '../theme/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('DataCard', () => {
  it('renders title, subtitle and children', () => {
    renderWithTheme(
      <DataCard title="Analiza" subtitle="Ostatnie 7 dni">
        <div>Treść karty</div>
      </DataCard>,
    );

    expect(screen.getByText('Analiza')).toBeDefined();
    expect(screen.getByText('Ostatnie 7 dni')).toBeDefined();
    expect(screen.getByText('Treść karty')).toBeDefined();
  });

  it('renders optional icon in the header', () => {
    renderWithTheme(
      <DataCard title="Statystyki" icon={<InsightsIcon data-testid="card-icon" fontSize="small" />}>
        <div>C</div>
      </DataCard>,
    );

    expect(screen.getByTestId('card-icon')).toBeDefined();
  });

  it('renders header action slot', () => {
    renderWithTheme(
      <DataCard title="Karta" action={<button>Akcja</button>}>
        <div>C</div>
      </DataCard>,
    );

    expect(screen.getByText('Akcja')).toBeDefined();
  });
});
