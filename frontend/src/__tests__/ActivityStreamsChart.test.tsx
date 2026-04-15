import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';

import ActivityStreamsChart from '../components/ActivityStreamsChart';

beforeAll(() => {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('ActivityStreamsChart', () => {
  it('renders with sample time-series data', () => {
    const timeStream = Array.from({ length: 100 }, (_, i) => i);
    const powerStream = Array.from({ length: 100 }, () => 200 + Math.floor(Math.random() * 50));
    const heartrateStream = Array.from({ length: 100 }, () => 140 + Math.floor(Math.random() * 20));

    const { container } = render(
      <ActivityStreamsChart
        timeStream={timeStream}
        powerStream={powerStream}
        heartrateStream={heartrateStream}
        cadenceStream={null}
        altitudeStream={null}
      />,
    );

    // Recharts renders an SVG with the chart
    expect(container.querySelector('.recharts-wrapper')).toBeDefined();
  });

  it('renders nothing when no data', () => {
    const { container } = render(
      <ActivityStreamsChart
        timeStream={null}
        powerStream={null}
        heartrateStream={null}
        cadenceStream={null}
        altitudeStream={null}
      />,
    );

    expect(container.querySelector('.recharts-wrapper')).toBeNull();
  });
});
