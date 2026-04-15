import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { it, expect, vi } from 'vitest';

import ProfileGallery from '../components/profile/ProfileGallery';

vi.mock('../hooks/useAnalytics', () => ({
  useRecentActivities: () => ({ data: [] }),
}));

it('shows empty state when no photos', () => {
  render(
    <MemoryRouter>
      <ProfileGallery />
    </MemoryRouter>
  );

  expect(screen.getByText('Brak zdjęć do wyświetlenia')).toBeDefined();
});
