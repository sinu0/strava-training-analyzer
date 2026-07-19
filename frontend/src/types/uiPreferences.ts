export const DASHBOARD_WIDGET_TYPES = [
  'decision',
  'recovery',
  'load',
  'lastActivity',
  'nextWorkout',
  'weather',
  'weeklyVolume',
  'goal',
] as const;

export type DashboardWidgetType = (typeof DASHBOARD_WIDGET_TYPES)[number];

export interface DashboardWidgetSettings {
  title?: string;
  compact?: boolean;
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  order: number;
  span: number;
  settings: DashboardWidgetSettings;
}

export interface UiPreferences {
  schemaVersion: number;
  revision: number;
  dashboard: {
    widgets: DashboardWidget[];
  };
  mobileNavigation: string[];
  warnings?: string[];
}
