import { Stack, Typography } from '@mui/material';

import { adminMessages } from '@/components/admin/messages';
import { Widget } from '@/ui';

/** How background sync, weather refresh and sign-in work. */
export default function BackgroundJobsInfo() {
  const t = adminMessages.useT();
  return (
    <Widget title={t('dashboard.infoTitle')}>
      <Stack spacing={1} sx={{ py: 1 }}>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          <strong>{t('dashboard.info.syncTitle')}</strong>{t('dashboard.info.syncBody')}
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          <strong>{t('dashboard.info.weatherTitle')}</strong>{t('dashboard.info.weatherBody')}
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          {t('dashboard.info.loginBody')}
        </Typography>
      </Stack>
    </Widget>
  );
}
