import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect } from 'vitest';

import Sidebar from '../components/layout/Sidebar';
import theme from '../theme/theme';

it('renders grouped navigation with Home and groups', () => {
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <Sidebar width={240} open={true} />
      </MemoryRouter>
    </ThemeProvider>,
  );

  expect(screen.getByText('Home')).toBeDefined();
  expect(screen.getByText('Centrum danych')).toBeDefined();
  expect(screen.getByText('Aktywności')).toBeDefined();
  expect(screen.getByText('Analityka')).toBeDefined();
  expect(screen.getByText('Ustawienia')).toBeDefined();
  // "Trening" and "Zdrowie" appear as both group labels and nav items
  expect(screen.getAllByText('Trening').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText('Zdrowie').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('Narzędzia')).toBeDefined();
});
