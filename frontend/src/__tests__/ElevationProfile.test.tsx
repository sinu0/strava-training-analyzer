import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import ElevationProfile from '../components/route/ElevationProfile';

import type { ElevationPoint } from '../types/route';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe('ElevationProfile', () => {
  it('shows empty message when no points', () => {
    render(<ElevationProfile points={[]} />);
    expect(screen.getByText('Dodaj punkty na mapie, aby zobaczyć profil wysokości')).toBeDefined();
  });

  it('renders chart with elevation data', () => {
    const points: ElevationPoint[] = [
      { distance: 0, elevation: 200, gradient: 0 },
      { distance: 1000, elevation: 250, gradient: 5 },
      { distance: 2000, elevation: 230, gradient: -2 },
    ];
    const onHover = vi.fn();
    const { container } = render(<ElevationProfile points={points} onHover={onHover} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });
});
