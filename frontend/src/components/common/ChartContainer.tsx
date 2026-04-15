import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import Section from '@/components/common/Section';

import type { ReactNode } from 'react';

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
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

/**
 * Wraps chart content with shared loading, error, and empty-state handling.
 */
export default function ChartContainer({
  title,
  subtitle,
  action,
  legend,
  loading = false,
  loadingMessage = 'Ładowanie wykresu...',
  error = null,
  empty = false,
  emptyTitle = 'Brak danych',
  emptyDescription,
  emptyIllustration,
  onRetry,
  children,
}: ChartContainerProps) {
  return (
    <Section title={title} subtitle={subtitle} action={action ?? legend}>
      {loading ? (
        <LoadingState message={loadingMessage} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : empty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} illustration={emptyIllustration} />
      ) : (
        children
      )}
    </Section>
  );
}
