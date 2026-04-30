import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import HomeWidgetCard from '@/components/home/HomeWidgetCard';

import theme from '../theme/theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('HomeWidgetCard', () => {
  it('supports explicit min height and artwork fit controls for less cramped layouts', () => {
    renderWithTheme(
      <HomeWidgetCard
        title="Widget"
        subtitle="Dłuższy opis pomocniczy dla bardziej naturalnego układu."
        accentColor="#7dd3fc"
        aspectRatio="auto"
        minHeight={360}
        testId="home-widget-card"
        artwork={{
          src: '/illustrations/home-weather.jpg',
          alt: 'Test artwork',
          objectFit: 'contain',
          height: 120,
        }}
      >
        <div>Treść widgetu</div>
      </HomeWidgetCard>,
    );

    const card = screen.getByTestId('home-widget-card');
    const artwork = screen.getByRole('img', { name: 'Test artwork' });

    expect(Number.parseFloat(window.getComputedStyle(card).minHeight)).toBeGreaterThanOrEqual(360);
    expect(window.getComputedStyle(artwork).objectFit).toBe('contain');
  });
});
