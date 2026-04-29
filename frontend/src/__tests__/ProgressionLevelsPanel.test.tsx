import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ProgressionLevelsPanel from '@/components/training/ProgressionLevelsPanel';

describe('ProgressionLevelsPanel', () => {
  it('renders progression cards', () => {
    render(
      <ProgressionLevelsPanel
        levels={[
          {
            system: 'THRESHOLD',
            label: 'Próg',
            level: 6,
            currentLoad: 82,
            previousLoad: 55,
            targetLoad: 70,
            trend: 'UP',
            description: 'Próg rośnie stabilnie.',
            nextRecommendation: 'Broń jednej jakościowej sesji progowej.',
          },
        ]}
      />,
    );

    expect(screen.getByText('Próg')).toBeDefined();
    expect(screen.getByText('Poziom 6/10')).toBeDefined();
    expect(screen.getByText('Próg rośnie stabilnie.')).toBeDefined();
    expect(screen.getByText(/Broń jednej jakościowej sesji progowej/)).toBeDefined();
  });
});
