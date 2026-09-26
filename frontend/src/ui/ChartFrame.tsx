import { useTheme } from '@mui/material/styles';

import { useI18n } from '@/i18n';
import { getChartVisuals } from '@/utils/chartStyles';

import EmptyState from './feedback/EmptyState';
import ErrorState from './feedback/ErrorState';
import LoadingState from './feedback/LoadingState';
import Widget from './Widget';

import type { ReactNode } from 'react';

export interface ChartFrameProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  legend?: ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIllustration?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

/** Recharts styling bound to the active theme (grid, axes, tooltip, legend). */
export function useChartVisuals() {
  return getChartVisuals(useTheme());
}

/** Widget with the shared loading, error and empty states for charts. */
export default function ChartFrame({
  title, subtitle, icon, action, legend, loading = false, loadingMessage, error = null,
  empty = false, emptyTitle, emptyDescription, emptyIllustration, onRetry, children,
}: ChartFrameProps) {
  const { t } = useI18n();
  return (
    <Widget title={title} subtitle={subtitle} icon={icon} action={action ?? legend}>
      {loading ? <LoadingState message={loadingMessage ?? t('common.loadingChart')} />
        : error ? <ErrorState message={error} onRetry={onRetry} />
          : empty ? <EmptyState title={emptyTitle ?? t('common.noData')} description={emptyDescription} illustration={emptyIllustration} />
            : children}
    </Widget>
  );
}
