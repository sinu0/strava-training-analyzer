import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '@/i18n';

/**
 * Friendly 404 page shown when a route is not found.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 2,
        px: 3,
      }}
    >
      <Box
        component="img"
        src="/illustrations/error-404.png"
        alt=""
        sx={{ width: 200, height: 200, objectFit: 'contain', opacity: 0.9 }}
      />
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {t('common.notFoundTitle')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "text.secondary",
          maxWidth: 400
        }}>
        {t('common.notFoundDescription')}
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 1 }}>
        {t('common.backToDashboard')}
      </Button>
    </Box>
  );
}
