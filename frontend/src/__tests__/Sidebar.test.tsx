import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect } from 'vitest';

import Sidebar from '../components/layout/Sidebar';
import theme from '../theme/theme';

it('renders the decision-first primary and secondary navigation', () => {
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <Sidebar width={240} open={true} />
      </MemoryRouter>
    </ThemeProvider>,
  );

  expect(screen.getByText('Dzisiaj')).toBeDefined();
  expect(screen.getByText('Historia')).toBeDefined();
  expect(screen.getByText('Analiza')).toBeDefined();
  expect(screen.getByText('Plan')).toBeDefined();
  expect(screen.getByText('Trasy')).toBeDefined();
  expect(screen.getByText('Pogoda')).toBeDefined();
  expect(screen.getByText('Zdrowie')).toBeDefined();
  expect(screen.getByText('Profil')).toBeDefined();
  expect(screen.getByText('Dane')).toBeDefined();
  expect(screen.getByText('Ustawienia')).toBeDefined();
});
