import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';

import AdminDashboard from '@/components/admin/AdminDashboard';
import GarminConnectSection from '@/components/admin/GarminConnectSection';
import StravaConfigSection from '@/components/admin/StravaConfigSection';
import SyncStatusSection from '@/components/admin/SyncStatusSection';
import WeatherJobSection from '@/components/admin/WeatherJobSection';
import PageContainer from '@/components/common/PageContainer';
import Section from '@/components/common/Section';
import { useAiStatus, useRunAiBatch } from '@/hooks/useAi';
import {
  useClearSyncData,
  useProfile,
  useRebuildFtpHistory,
  useRebuildHeatmap,
  useRecalculateAllActivityMetrics,
  useRecalculateMetrics,
  useRefreshAllWeatherCache,
  useRefreshWeatherCache,
  useResetStravaConfig,
  useResyncStreams,
  useStravaConfig,
  useStravaConnect,
  useSyncActivityPhotos,
  useSyncFull,
  useSyncRecent,
  useSyncStatus,
  useUpdateStravaConfig,
  useWeatherJobStatus,
  useWeatherLocations,
} from '@/hooks/useAnalytics';
import { useCountdown } from '@/hooks/useCountdown';
import {
  useGarminBridgeStatus,
  useGarminBridgeSync,
  useDeleteGarminCredentials,
  useGarminHealth,
  useGarminStatus,
  useGarminSync,
  useSaveGarminCredentials,
} from '@/hooks/useGarmin';
import { STATUS_COLORS } from '@/utils/colors';
import { getApiErrorMessage } from '@/utils/errorHandling';

import type { ReactNode } from 'react';

interface MutationWithError {
  isError?: boolean;
  error?: unknown;
}

interface AdminActionSectionProps {
  title: string;
  subtitle?: string;
  pending: boolean;
  success: boolean;
  idleLabel: string;
  pendingLabel: string;
  successLabel: string;
  onClick: () => void;
}

interface AdminGroupProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
}

function getMutationErrorMessage(
  mutation: MutationWithError,
  fallback: string,
): string | null {
  return mutation.isError ? getApiErrorMessage(mutation.error, fallback) : null;
}

function AdminActionSection({
  title,
  subtitle,
  pending,
  success,
  idleLabel,
  pendingLabel,
  successLabel,
  onClick,
}: AdminActionSectionProps) {
  return (
    <Section title={title} subtitle={subtitle}>
      <Button
        variant="outlined"
        color="primary"
        disabled={pending}
        startIcon={pending ? <CircularProgress size={16} /> : null}
        onClick={onClick}
      >
        {pending ? pendingLabel : idleLabel}
      </Button>
      {!!success && (
        <span style={{ marginLeft: 12, color: STATUS_COLORS.success, fontSize: '0.85rem' }}>
          {successLabel}
        </span>
      )}
    </Section>
  );
}

function AdminGroup({
  title,
  subtitle,
  icon,
  defaultExpanded = false,
  children,
}: AdminGroupProps) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

function useStravaConfigForm(
  updateConfig: ReturnType<typeof useUpdateStravaConfig>,
  connectStrava: ReturnType<typeof useStravaConnect>,
) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [webhookToken, setWebhookToken] = useState('');

  const handleSaveConfig = useCallback(() => {
    const params: Record<string, string> = {};

    if (clientId.trim()) {
      params.clientId = clientId.trim();
    }
    if (clientSecret.trim()) {
      params.clientSecret = clientSecret.trim();
    }
    if (webhookToken.trim()) {
      params.webhookToken = webhookToken.trim();
    }
    if (Object.keys(params).length === 0) {
      return;
    }

    updateConfig.mutate(params, {
      onSuccess: () => {
        setClientId('');
        setClientSecret('');
        setWebhookToken('');
      },
    });
  }, [clientId, clientSecret, updateConfig, webhookToken]);

  const handleConnectStrava = useCallback(() => {
    connectStrava.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.assign(url);
      },
    });
  }, [connectStrava]);

  return {
    clientId,
    clientSecret,
    webhookToken,
    setClientId,
    setClientSecret,
    setWebhookToken,
    handleSaveConfig,
    handleConnectStrava,
  };
}

function useGarminCredentialsForm(
  saveGarminCredentials: ReturnType<typeof useSaveGarminCredentials>,
) {
  const [garminEmail, setGarminEmail] = useState('');
  const [garminPassword, setGarminPassword] = useState('');
  const [showGarminForm, setShowGarminForm] = useState(false);

  const handleSaveGarminCredentials = useCallback((email: string, password: string) => {
    saveGarminCredentials.mutate(
      { email, password },
      {
        onSuccess: () => {
          setGarminEmail('');
          setGarminPassword('');
          setShowGarminForm(false);
        },
      },
    );
  }, [saveGarminCredentials]);

  return {
    garminEmail,
    garminPassword,
    showGarminForm,
    setGarminEmail,
    setGarminPassword,
    setShowGarminForm,
    handleSaveGarminCredentials,
  };
}

export default function AdminPage() {
  const { data: syncStatus, isLoading: syncLoading } = useSyncStatus();
  const syncFull = useSyncFull();
  const syncRecent = useSyncRecent();
  const syncPhotos = useSyncActivityPhotos();
  const resyncStreams = useResyncStreams();
  const clearSyncData = useClearSyncData();
  const recalculateMetrics = useRecalculateMetrics();
  const recalculateActivityMetrics = useRecalculateAllActivityMetrics();
  const rebuildHeatmap = useRebuildHeatmap();
  const rebuildFtpHistory = useRebuildFtpHistory();
  const { data: weatherLocations } = useWeatherLocations();
  const refreshAllWeather = useRefreshAllWeatherCache();
  const refreshWeather = useRefreshWeatherCache();
  const { data: profile } = useProfile();
  const { data: stravaConfig, isLoading: configLoading } = useStravaConfig();
  const connectStrava = useStravaConnect();
  const updateConfig = useUpdateStravaConfig();
  const resetConfig = useResetStravaConfig();
  const { data: weatherJobStatus } = useWeatherJobStatus();
  const { data: aiStatus } = useAiStatus();
  const runAiBatch = useRunAiBatch();
  const { data: garminStatus } = useGarminStatus();
  const { data: garminBridgeStatus } = useGarminBridgeStatus();
  const saveGarminCredentials = useSaveGarminCredentials();
  const deleteGarminCredentials = useDeleteGarminCredentials();
  const garminSync = useGarminSync();
  const garminBridgeSync = useGarminBridgeSync();
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: garminHealthToday } = useGarminHealth(todayStr, todayStr);

  const stravaConfigForm = useStravaConfigForm(updateConfig, connectStrava);
  const garminCredentialsForm = useGarminCredentialsForm(saveGarminCredentials);

  const isSyncing =
    syncStatus?.status === 'in_progress'
    || syncFull.isPending
    || syncRecent.isPending
    || syncPhotos.isPending
    || resyncStreams.isPending;
  const isRateLimited = syncStatus?.status === 'rate_limited';
  const rateLimitCountdown = useCountdown(
    isRateLimited ? syncStatus?.rateLimitResetsAt : null,
  );
  const syncDisabled = isSyncing || (isRateLimited && rateLimitCountdown.isActive);
  const canStartStravaConnect = Boolean(
    stravaConfig?.clientId && stravaConfig?.hasClientSecret,
  );

  const syncErrorMessage =
    getMutationErrorMessage(
      syncRecent,
      'Błąd synchronizacji. Sprawdź połączenie ze Strava.',
    )
    ?? getMutationErrorMessage(
      syncPhotos,
      'Błąd pobierania zdjęć aktywności ze Stravy.',
    )
    ?? getMutationErrorMessage(
      syncFull,
      'Błąd synchronizacji. Sprawdź połączenie ze Strava.',
    );

  return (
    <PageContainer
      title="Ustawienia"
      subtitle="Konfiguracja została uporządkowana w trzy grupy: integracje, sync i dane oraz przetwarzanie."
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Ustawienia' },
      ]}
    >
      <AdminGroup
        title="Integracje"
        subtitle="Połączenia z usługami zewnętrznymi i stan autoryzacji."
        icon={<LinkIcon />}
        defaultExpanded={true}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StravaConfigSection
              configLoading={configLoading}
              stravaConfig={stravaConfig}
              profileConnected={profile?.stravaConnected}
              clientId={stravaConfigForm.clientId}
              clientSecret={stravaConfigForm.clientSecret}
              webhookToken={stravaConfigForm.webhookToken}
              connectPending={connectStrava.isPending}
              updatePending={updateConfig.isPending}
              resetPending={resetConfig.isPending}
              canStartStravaConnect={canStartStravaConnect}
              onClientIdChange={stravaConfigForm.setClientId}
              onClientSecretChange={stravaConfigForm.setClientSecret}
              onWebhookTokenChange={stravaConfigForm.setWebhookToken}
              onSaveConfig={stravaConfigForm.handleSaveConfig}
              onConnectStrava={stravaConfigForm.handleConnectStrava}
              onResetConfig={() => resetConfig.mutate()}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <GarminConnectSection
              garminStatus={garminStatus}
              garminBridgeStatus={garminBridgeStatus}
              garminEmail={garminCredentialsForm.garminEmail}
              garminPassword={garminCredentialsForm.garminPassword}
              showGarminForm={garminCredentialsForm.showGarminForm}
              garminHealthToday={garminHealthToday}
              saveGarminCredentialsPending={saveGarminCredentials.isPending}
              saveGarminCredentialsError={
                saveGarminCredentials.isError ? saveGarminCredentials.error : null
              }
              deleteGarminCredentialsPending={deleteGarminCredentials.isPending}
              garminSyncPending={garminSync.isPending}
              garminBridgeSyncPending={garminBridgeSync.isPending}
              garminSyncData={garminBridgeSync.data ?? garminSync.data}
              garminSyncError={
                garminBridgeSync.isError
                  ? garminBridgeSync.error
                  : garminSync.isError
                    ? garminSync.error
                    : null
              }
              onGarminEmailChange={garminCredentialsForm.setGarminEmail}
              onGarminPasswordChange={garminCredentialsForm.setGarminPassword}
              onShowGarminFormChange={garminCredentialsForm.setShowGarminForm}
              onSaveGarminCredentials={garminCredentialsForm.handleSaveGarminCredentials}
              onDeleteGarminCredentials={() => deleteGarminCredentials.mutate()}
              onGarminSync={(from, to) => garminSync.mutate({ from, to })}
              onGarminBridgeSync={(from, to) => garminBridgeSync.mutate({ from, to })}
            />
          </Grid>
        </Grid>
      </AdminGroup>

      <AdminGroup
        title="Sync i dane"
        subtitle="Synchronizacja, naprawy danych oraz przebudowa historii i map."
        icon={<SyncProblemIcon />}
        defaultExpanded={true}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SyncStatusSection
              syncStatus={syncStatus}
              syncLoading={syncLoading}
              isSyncing={isSyncing}
              isRateLimited={isRateLimited}
              rateLimitCountdown={rateLimitCountdown.label}
              syncDisabled={syncDisabled}
              syncErrorMessage={syncErrorMessage}
              syncPhotosPending={syncPhotos.isPending}
              resyncStreamsPending={resyncStreams.isPending}
              clearSyncDataPending={clearSyncData.isPending}
              recalculateMetricsPending={recalculateMetrics.isPending}
              recalculateActivityMetricsPending={recalculateActivityMetrics.isPending}
              onSyncRecent={() => syncRecent.mutate()}
              onSyncFull={() => syncFull.mutate()}
              onSyncPhotos={() => syncPhotos.mutate()}
              onResyncStreams={() => resyncStreams.mutate()}
              onClearSyncData={() => clearSyncData.mutate()}
              onRecalculateMetrics={() => recalculateMetrics.mutate()}
              onRecalculateActivityMetrics={() => recalculateActivityMetrics.mutate()}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <AdminActionSection
                title="Heatmapa"
                subtitle="Przebuduj warstwę tras po większym imporcie lub czyszczeniu danych."
                pending={rebuildHeatmap.isPending}
                success={rebuildHeatmap.isSuccess}
                idleLabel="Przebuduj heatmapę"
                pendingLabel="Przebudowywanie…"
                successLabel="✓ Gotowe"
                onClick={() => rebuildHeatmap.mutate()}
              />
              <AdminActionSection
                title="Historia FTP"
                subtitle="Przelicz historię FTP na podstawie wszystkich aktywności."
                pending={rebuildFtpHistory.isPending}
                success={rebuildFtpHistory.isSuccess}
                idleLabel="Odbuduj historię FTP"
                pendingLabel="Przeliczanie…"
                successLabel="✓ Historia FTP gotowa"
                onClick={() => rebuildFtpHistory.mutate()}
              />
            </Stack>
          </Grid>
        </Grid>
      </AdminGroup>

      <AdminGroup
        title="Przetwarzanie"
        subtitle="Zadania tła związane z pogodą, AI i automatyzacją systemu."
        icon={<SettingsSuggestIcon />}
        defaultExpanded={true}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <WeatherJobSection
              weatherJobStatus={weatherJobStatus}
              weatherLocations={weatherLocations}
              refreshWeatherPending={refreshWeather.isPending}
              refreshAllWeatherPending={refreshAllWeather.isPending}
              onRefreshWeather={(name) => refreshWeather.mutate(name)}
              onRefreshAllWeather={() => refreshAllWeather.mutate()}
            />
          </Grid>
          <AdminDashboard
            aiStatus={aiStatus}
            runAiBatchPending={runAiBatch.isPending}
            runAiBatchData={runAiBatch.data}
            runAiBatchError={runAiBatch.error}
            onRunAiBatch={(skipToday) => runAiBatch.mutate(skipToday)}
          />
        </Grid>
      </AdminGroup>
    </PageContainer>
  );
}
