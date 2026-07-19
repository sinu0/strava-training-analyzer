import { describe, expect, it } from 'vitest';

import {
  DEFAULT_UI_PREFERENCES,
  migrateUiPreferences,
  moveDashboardWidget,
  resizeDashboardWidget,
} from '@/utils/uiPreferences';

describe('ui preferences', () => {
  it('provides a complete, versioned default dashboard', () => {
    expect(DEFAULT_UI_PREFERENCES.schemaVersion).toBe(1);
    expect(DEFAULT_UI_PREFERENCES.revision).toBe(0);
    expect(DEFAULT_UI_PREFERENCES.dashboard.widgets.map((widget) => widget.type)).toEqual([
      'decision',
      'lastActivity',
      'recovery',
      'load',
      'nextWorkout',
      'weather',
    ]);
    expect(DEFAULT_UI_PREFERENCES.dashboard.widgets.map((widget) => widget.span)).toEqual([8, 4, 4, 4, 6, 6]);
    expect(DEFAULT_UI_PREFERENCES.mobileNavigation).toHaveLength(4);
  });

  it('skips an unknown widget without breaking the dashboard', () => {
    const migrated = migrateUiPreferences({
      ...DEFAULT_UI_PREFERENCES,
      dashboard: {
        widgets: [
          ...DEFAULT_UI_PREFERENCES.dashboard.widgets,
          { id: 'future', type: 'future-widget', order: 10, span: 6, settings: {} },
        ],
      },
    });

    expect(migrated.preferences.dashboard.widgets).toHaveLength(6);
    expect(migrated.warnings).toEqual(['Pominięto nieznany widget: future-widget']);
  });

  it('reorders widgets and normalizes their order', () => {
    const widgets = DEFAULT_UI_PREFERENCES.dashboard.widgets;
    const moved = moveDashboardWidget(widgets, widgets[0]!.id, widgets[2]!.id);

    expect(moved.map((widget) => widget.type).slice(0, 3)).toEqual([
      'lastActivity',
      'recovery',
      'decision',
    ]);
    expect(moved.map((widget) => widget.order)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('cycles widget width within the 12-column grid', () => {
    const widget = DEFAULT_UI_PREFERENCES.dashboard.widgets[1]!;

    expect(resizeDashboardWidget(widget, 12).span).toBe(12);
    expect(resizeDashboardWidget(widget, 0).span).toBe(1);
  });
});
