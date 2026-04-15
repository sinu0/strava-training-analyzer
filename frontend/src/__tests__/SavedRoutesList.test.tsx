import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SavedRoutesList from '../components/route/SavedRoutesList';

import type { PlannedRoute } from '../types/route';

const mockRoute: PlannedRoute = {
  id: 'r1',
  name: 'Trasa testowa',
  waypoints: [
    { index: 0, lat: 50.06, lng: 19.94 },
    { index: 1, lat: 50.08, lng: 19.96 },
  ],
  polyline: [[50.06, 19.94], [50.08, 19.96]],
  totalDistanceM: 15000,
  totalElevationGainM: 320,
  totalElevationLossM: 280,
  estimatedTimeSec: 3600,
  estimatedTss: 55,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('SavedRoutesList', () => {
  it('shows empty message when no routes', () => {
    render(
      <SavedRoutesList
        routes={[]}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onExportGpx={vi.fn()}
      />
    );
    expect(screen.getByText('Brak zapisanych tras')).toBeDefined();
  });

  it('renders route with stats', () => {
    render(
      <SavedRoutesList
        routes={[mockRoute]}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onExportGpx={vi.fn()}
      />
    );
    expect(screen.getByText('Trasa testowa')).toBeDefined();
    expect(screen.getByText('15.0 km')).toBeDefined();
    expect(screen.getByText('↑ 320 m')).toBeDefined();
    expect(screen.getByText('TSS 55')).toBeDefined();
  });

  it('calls onSelect when route clicked', () => {
    const onSelect = vi.fn();
    render(
      <SavedRoutesList
        routes={[mockRoute]}
        onSelect={onSelect}
        onDelete={vi.fn()}
        onExportGpx={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Trasa testowa'));
    expect(onSelect).toHaveBeenCalledWith(mockRoute);
  });

  it('highlights selected route', () => {
    render(
      <SavedRoutesList
        routes={[mockRoute]}
        selectedId="r1"
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onExportGpx={vi.fn()}
      />
    );
    const listItem = screen.getByText('Trasa testowa').closest('[role="button"]');
    expect(listItem?.classList.toString()).toContain('selected');
  });
});
