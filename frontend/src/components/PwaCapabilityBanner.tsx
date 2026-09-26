import { Alert } from '@mui/material';

import { useI18n } from '@/i18n';
import { pwaCapability } from '@/pwa/registerPwa';

export default function PwaCapabilityBanner() {
  const capability = pwaCapability();
  const { t } = useI18n();
  if (capability.offlineReady) return null;
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      {t('common.pwaHttpsRequired')}
    </Alert>
  );
}
