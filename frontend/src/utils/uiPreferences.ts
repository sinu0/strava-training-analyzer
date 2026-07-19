import {
  DASHBOARD_WIDGET_TYPES,
  type DashboardWidget,
  type DashboardWidgetType,
  type UiPreferences,
} from '@/types/uiPreferences';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  widget('decision-main', 'decision', 0, 12),
  widget('recovery-main', 'recovery', 1, 4),
  widget('load-main', 'load', 2, 4),
  widget('last-activity-main', 'lastActivity', 3, 4),
  widget('next-workout-main', 'nextWorkout', 4, 6),
  widget('weather-main', 'weather', 5, 6),
];

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  schemaVersion: 1,
  revision: 0,
  dashboard: { widgets: DEFAULT_WIDGETS },
  mobileNavigation: ['/', '/activities', '/analytics', '/training'],
  warnings: [],
};

function widget(
  id: string,
  type: DashboardWidgetType,
  order: number,
  span: number,
): DashboardWidget {
  return { id, type, order, span, settings: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWidgetType(value: unknown): value is DashboardWidgetType {
  return typeof value === 'string'
    && DASHBOARD_WIDGET_TYPES.includes(value as DashboardWidgetType);
}

export function migrateUiPreferences(raw: unknown): {
  preferences: UiPreferences;
  warnings: string[];
} {
  if (!isRecord(raw) || !isRecord(raw.dashboard) || !Array.isArray(raw.dashboard.widgets)) {
    return {
      preferences: structuredClone(DEFAULT_UI_PREFERENCES),
      warnings: ['Przywrócono domyślny układ po wykryciu nieprawidłowych preferencji.'],
    };
  }

  const warnings: string[] = Array.isArray(raw.warnings)
    ? raw.warnings.filter((warning): warning is string => typeof warning === 'string')
    : [];
  const ids = new Set<string>();
  const widgets: DashboardWidget[] = [];

  for (const candidate of raw.dashboard.widgets) {
    if (!isRecord(candidate) || !isWidgetType(candidate.type)) {
      const unknownType = isRecord(candidate) && typeof candidate.type === 'string'
        ? candidate.type
        : 'nieznany';
      warnings.push(`Pominięto nieznany widget: ${unknownType}`);
      continue;
    }
    const id = typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id
      : `${candidate.type}-${widgets.length + 1}`;
    if (ids.has(id)) {
      warnings.push(`Pominięto zduplikowany widget: ${id}`);
      continue;
    }
    ids.add(id);
    widgets.push({
      id,
      type: candidate.type,
      order: widgets.length,
      span: Math.min(12, Math.max(1, Number(candidate.span) || 6)),
      settings: isRecord(candidate.settings) ? candidate.settings : {},
    });
  }

  const navigation = Array.isArray(raw.mobileNavigation)
    ? raw.mobileNavigation.filter((path): path is string => typeof path === 'string').slice(0, 4)
    : DEFAULT_UI_PREFERENCES.mobileNavigation;

  return {
    preferences: {
      schemaVersion: 1,
      revision: typeof raw.revision === 'number' ? raw.revision : 0,
      dashboard: { widgets },
      mobileNavigation: navigation.length === 4
        ? navigation
        : [...DEFAULT_UI_PREFERENCES.mobileNavigation],
      warnings,
    },
    warnings,
  };
}

export function moveDashboardWidget(
  widgets: DashboardWidget[],
  activeId: string,
  overId: string,
): DashboardWidget[] {
  const from = widgets.findIndex((item) => item.id === activeId);
  const to = widgets.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return widgets;
  const result = [...widgets];
  const [moved] = result.splice(from, 1);
  if (!moved) return widgets;
  result.splice(to, 0, moved);
  return result.map((item, order) => ({ ...item, order }));
}

export function resizeDashboardWidget(widgetToResize: DashboardWidget, span: number): DashboardWidget {
  return { ...widgetToResize, span: Math.min(12, Math.max(1, span)) };
}

export function createDashboardWidget(
  type: DashboardWidgetType,
  order: number,
): DashboardWidget {
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    order,
    span: type === 'decision' ? 12 : 6,
    settings: {},
  };
}
