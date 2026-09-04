import { Alert } from '@mui/material';

import { pwaCapability } from '@/pwa/registerPwa';

export default function PwaCapabilityBanner() {
  const capability = pwaCapability();
  if (capability.offlineReady) return null;
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      Tryb instalowalny i bezpieczne wykonanie offline wymagają HTTPS. Na telefonie otwórz adres LAN
      skonfigurowany z zaufanym certyfikatem; zwykły adres HTTP nie udostępnia Service Workera.
    </Alert>
  );
}
