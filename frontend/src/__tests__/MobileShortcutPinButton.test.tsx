import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MobileShortcutPinButton from '@/components/settings/MobileShortcutPinButton';
import { DEFAULT_UI_PREFERENCES } from '@/utils/uiPreferences';

describe('MobileShortcutPinButton', () => {
  it('pins a route by explicitly replacing one existing shortcut', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <MobileShortcutPinButton
        label="Trasy"
        path="/routes"
        preferences={structuredClone(DEFAULT_UI_PREFERENCES)}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Przypnij Trasy' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Zastąp Analiza' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]![0].mobileNavigation)
      .toEqual(['/', '/activities', '/routes', '/training']);
  });
});
