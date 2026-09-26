import { useCallback, useState } from 'react';

import StravaConfigSection from '@/components/admin/StravaConfigSection';
import {
  useProfile,
  useResetStravaConfig,
  useStravaConfig,
  useStravaConnect,
  useUpdateStravaConfig,
} from '@/hooks/useAnalytics';

export default function IntegrationsTab() {
  const { data: profile } = useProfile();
  const { data: stravaConfig, isLoading: configLoading } = useStravaConfig();
  const connectStrava = useStravaConnect();
  const updateConfig = useUpdateStravaConfig();
  const resetConfig = useResetStravaConfig();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [webhookToken, setWebhookToken] = useState('');

  const handleSaveConfig = useCallback(() => {
    const params: Record<string, string> = {};
    if (clientId.trim()) params.clientId = clientId.trim();
    if (clientSecret.trim()) params.clientSecret = clientSecret.trim();
    if (webhookToken.trim()) params.webhookToken = webhookToken.trim();
    if (Object.keys(params).length === 0) return;

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
      onSuccess: ({ url }) => { window.location.assign(url); },
    });
  }, [connectStrava]);

  return (
    <StravaConfigSection
      configLoading={configLoading}
      stravaConfig={stravaConfig}
      profileConnected={profile?.stravaConnected}
      clientId={clientId}
      clientSecret={clientSecret}
      webhookToken={webhookToken}
      connectPending={connectStrava.isPending}
      updatePending={updateConfig.isPending}
      resetPending={resetConfig.isPending}
      canStartStravaConnect={Boolean(stravaConfig?.clientId && stravaConfig?.hasClientSecret)}
      onClientIdChange={setClientId}
      onClientSecretChange={setClientSecret}
      onWebhookTokenChange={setWebhookToken}
      onSaveConfig={handleSaveConfig}
      onConnectStrava={handleConnectStrava}
      onResetConfig={() => resetConfig.mutate()}
    />
  );
}
