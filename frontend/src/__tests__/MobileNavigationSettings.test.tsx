import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MobileNavigationSettings from '@/components/settings/MobileNavigationSettings';
import { DEFAULT_UI_PREFERENCES } from '@/utils/uiPreferences';

describe('MobileNavigationSettings', () => {
  it('replaces a shortcut and persists exactly four destinations', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <MobileNavigationSettings
        preferences={structuredClone(DEFAULT_UI_PREFERENCES)}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Analiza' }));
    expect(screen.getByText('Wybierz jeszcze 1 skrót.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Trasy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz skróty' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]![0].mobileNavigation)
      .toEqual(['/', '/activities', '/training', '/routes']);
  });
});
