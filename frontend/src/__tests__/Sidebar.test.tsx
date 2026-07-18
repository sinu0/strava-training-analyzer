import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect } from 'vitest';

import Sidebar from '../components/layout/Sidebar';
import theme from '../theme/theme';

it('renders the V2 decision-first navigation and keeps full weather accessible', () => {
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
  expect(screen.getByText('Pełna pogoda')).toBeDefined();
  expect(screen.getByText('Dane i zadania')).toBeDefined();
});
