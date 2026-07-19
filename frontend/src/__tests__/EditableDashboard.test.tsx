import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import EditableDashboard from '@/components/dashboard/EditableDashboard';
import { DEFAULT_UI_PREFERENCES } from '@/utils/uiPreferences';

describe('EditableDashboard', () => {
  it('removes, resizes and saves widgets', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <EditableDashboard
        preferences={structuredClone(DEFAULT_UI_PREFERENCES)}
        onSave={onSave}
        renderWidget={(widget) => <div>{widget.type}</div>}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj układ' }));
    fireEvent.click(screen.getByRole('button', { name: 'Usuń widget Regeneracja' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zmniejsz widget Obciążenie' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zapisz układ' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const saved = onSave.mock.calls[0]![0];
    expect(saved.dashboard.widgets.some((widget: { type: string }) => widget.type === 'recovery')).toBe(false);
    expect(saved.dashboard.widgets.find((widget: { type: string }) => widget.type === 'load').span).toBe(3);
  });

  it('adds a widget and exposes a keyboard drag handle', () => {
    render(
      <EditableDashboard
        preferences={structuredClone(DEFAULT_UI_PREFERENCES)}
        onSave={vi.fn()}
        renderWidget={(widget) => <div>{widget.type}</div>}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edytuj układ' }));
    expect(screen.getAllByRole('button', { name: /Przenieś widget/ })[0]).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj widget' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cel treningowy' }));

    expect(screen.getByText('goal')).toBeDefined();
  });

  it('can restore the default dashboard after removing every widget', () => {
    render(
      <EditableDashboard
        preferences={{
          ...structuredClone(DEFAULT_UI_PREFERENCES),
          dashboard: { widgets: [] },
        }}
        onSave={vi.fn()}
        renderWidget={(widget) => <div>{widget.type}</div>}
      />,
    );

    expect(screen.getByText('Pulpit jest pusty')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Przywróć domyślny układ' }));
    expect(screen.getByText('decision')).toBeDefined();
  });
});
