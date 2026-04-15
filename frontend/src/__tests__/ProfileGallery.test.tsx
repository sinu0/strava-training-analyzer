import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import ProfileGallery from '../components/profile/ProfileGallery';

vi.mock('../hooks/useAnalytics', () => ({
  useRecentActivities: () => ({ data: [{ id: 'a1', name: 'Morning Ride', startedAt: '2025-06-01', photoUrls: ['http://example.com/p1.jpg', 'http://example.com/p2.jpg'] }] }),
}));

describe('ProfileGallery', () => {
  it('opens lightbox on photo click', async () => {
    render(
      <MemoryRouter>
        <ProfileGallery />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByTestId('profile-photo-0'));

    expect(await screen.findByText('Otwórz aktywność')).toBeDefined();
  });

  it('still opens lightbox after hover before click', async () => {
    render(
      <MemoryRouter>
        <ProfileGallery />
      </MemoryRouter>
    );

    const trigger = await screen.findByTestId('profile-photo-0');
    fireEvent.mouseEnter(trigger);
    fireEvent.click(trigger);

    expect(await screen.findByText('Otwórz aktywność')).toBeDefined();
  });
});
