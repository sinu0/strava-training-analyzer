import { Alert, Chip, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';
import EditableDashboard from '@/components/dashboard/EditableDashboard';
import { useSaveUiPreferences, useUiPreferences } from '@/hooks/useUiPreferences';

import TodayWidget from './TodayWidget';
import { useToday } from './useToday';

const statusLabels = {
  UNKNOWN: 'Brak danych',
  PARTIAL: 'Dane częściowe',
  AVAILABLE: 'Dane aktualne',
} as const;

const confidenceLabels = {
  LOW: 'Podstawa danych: niska',
  MEDIUM: 'Podstawa danych: częściowa',
  HIGH: 'Podstawa danych: pełna',
} as const;

export default function TodayPage() {
  const navigate = useNavigate();
  const today = useToday();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();

  if (today.isLoading || preferences.isLoading) {
    return <LoadingState message="Buduję dzisiejszy kokpit…" />;
  }
  if (today.isError || !today.data) {
    return (
      <ErrorState
        title="Nie udało się przygotować widoku Dzisiaj"
        message="Sprawdź synchronizację danych i spróbuj ponownie."
        onRetry={() => void today.refetch()}
      />
    );
  }
  if (preferences.isError || !preferences.data) {
    return (
      <ErrorState
        title="Nie udało się wczytać układu kokpitu"
        message="Dane treningowe są bezpieczne. Odśwież preferencje i spróbuj ponownie."
        onRetry={() => void preferences.refetch()}
      />
    );
  }

  const data = today.data;

  return (
    <PageContainer
      title="Dzisiaj"
      subtitle="Najważniejsza decyzja, kontekst i moduły w Twoim układzie."
      maxWidth={1440}
      actions={(
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={statusLabels[data.dataStatus]}
            color={data.dataStatus === 'AVAILABLE' ? 'success' : data.dataStatus === 'PARTIAL' ? 'warning' : 'default'}
            variant="outlined"
          />
          <Chip size="small" label={confidenceLabels[data.confidence.level]} variant="outlined" />
        </Stack>
      )}
    >
      {data.dataStatus !== 'AVAILABLE' && (
        <Alert severity={data.dataStatus === 'UNKNOWN' ? 'info' : 'warning'} sx={{ mb: 2.5 }}>
          {data.confidence.reasons.join(' · ')}
        </Alert>
      )}
      <EditableDashboard
        preferences={preferences.data}
        saving={savePreferences.isPending}
        onSave={async (nextPreferences) => {
          await savePreferences.mutateAsync(nextPreferences);
        }}
        renderWidget={(widget) => (
          <TodayWidget widget={widget} data={data} navigate={navigate} />
        )}
      />
    </PageContainer>
  );
}
