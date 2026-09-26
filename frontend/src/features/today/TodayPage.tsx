import { Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import EditableDashboard from '@/components/dashboard/EditableDashboard';
import PwaCapabilityBanner from '@/components/PwaCapabilityBanner';
import { useSaveUiPreferences, useUiPreferences } from '@/hooks/useUiPreferences';
import { useI18n } from '@/i18n';
import { ErrorState, LoadingState, Page, StatusPill } from '@/ui';

import { todayMessages } from './messages';
import TodayWidget from './TodayWidget';
import { useToday } from './useToday';

export default function TodayPage() {
  const navigate = useNavigate();
  const today = useToday();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();
  const t = todayMessages.useT();
  const { t: common } = useI18n();

  if (today.isLoading || preferences.isLoading) {
    return <LoadingState message={t('buildingCockpit')} />;
  }
  if (today.isError || !today.data) {
    return (
      <ErrorState
        title={t('todayErrorTitle')}
        message={t('todayErrorMessage')}
        onRetry={() => void today.refetch()}
      />
    );
  }
  if (preferences.isError || !preferences.data) {
    return (
      <ErrorState
        title={t('layoutErrorTitle')}
        message={t('layoutErrorMessage')}
        onRetry={() => void preferences.refetch()}
      />
    );
  }

  const data = today.data;

  return (
    <Page
      title={common('nav.today.label')}
      subtitle={t('subtitle')}
      maxWidth={1440}
      meta={(
        <>
          <StatusPill
            size="sm"
            variant="outline"
            label={t(`status.${data.dataStatus}`)}
            tone={data.dataStatus === 'AVAILABLE' ? 'success' : data.dataStatus === 'PARTIAL' ? 'warning' : 'neutral'}
          />
          <StatusPill size="sm" variant="outline" label={t(`confidence.${data.confidence.level}`)} />
        </>
      )}
    >
      <PwaCapabilityBanner />
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
    </Page>
  );
}
