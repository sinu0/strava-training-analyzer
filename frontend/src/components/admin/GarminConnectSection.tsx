import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';
import WatchIcon from '@mui/icons-material/Watch';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { formatTimestamp } from '@/components/admin/adminUtils';
import DataCard from '@/components/common/DataCard';
import GarminHealthCard from '@/components/garmin/GarminHealthCard';
import type { GarminHealthData } from '@/types/garmin';
import {
  BRAND_COLORS,
  COMMON_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getApiErrorMessage } from '@/utils/errorHandling';

export interface GarminStatus {
  connected: boolean;
  email: string | null;
  lastSyncAt: string | null;
}

export interface GarminSyncResult {
  synced: number;
  skipped: number;
  failed: number;
  errors?: string[];
}

export interface GarminConnectSectionProps {
  garminStatus: GarminStatus | undefined;
  garminEmail: string;
  garminPassword: string;
  showGarminForm: boolean;
  garminHealthToday: GarminHealthData[] | null | undefined;
  saveGarminCredentialsPending: boolean;
  saveGarminCredentialsError: Error | null;
  deleteGarminCredentialsPending: boolean;
  garminSyncPending: boolean;
  garminSyncData: GarminSyncResult | undefined;
  garminSyncError: Error | null;
  onGarminEmailChange: (value: string) => void;
  onGarminPasswordChange: (value: string) => void;
  onShowGarminFormChange: (value: boolean) => void;
  onSaveGarminCredentials: (email: string, password: string) => void;
  onDeleteGarminCredentials: () => void;
  onGarminSync: (from: string, to: string) => void;
}

export default function GarminConnectSection({
  garminStatus,
  garminEmail,
  garminPassword,
  showGarminForm,
  garminHealthToday,
  saveGarminCredentialsPending,
  saveGarminCredentialsError,
  deleteGarminCredentialsPending,
  garminSyncPending,
  garminSyncData,
  garminSyncError,
  onGarminEmailChange,
  onGarminPasswordChange,
  onShowGarminFormChange,
  onSaveGarminCredentials,
  onDeleteGarminCredentials,
  onGarminSync,
}: GarminConnectSectionProps) {
  const saveCredentialsErrorMessage = saveGarminCredentialsError
    ? getApiErrorMessage(saveGarminCredentialsError, saveGarminCredentialsError.message)
    : null;
  const syncErrorMessage = garminSyncError
    ? getApiErrorMessage(garminSyncError, garminSyncError.message)
    : null;
  const garminStatusColor = garminStatus?.connected ? STATUS_COLORS.success : STATUS_COLORS.neutral;
  const disabledButtonSx = {
    bgcolor: alphaColor(COMMON_COLORS.white, 0.08),
    color: alphaColor(COMMON_COLORS.white, 0.3),
  };

  return (
    <DataCard title="Garmin Connect">
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <WatchIcon sx={{ color: BRAND_COLORS.garmin, fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Status połączenia
            </Typography>
            <Chip
              size="small"
              icon={garminStatus?.connected ? <CheckCircleIcon sx={{ fontSize: 15 }} /> : <ErrorIcon sx={{ fontSize: 15 }} />}
              label={garminStatus?.connected ? 'Połączony' : 'Nie połączony'}
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: alphaColor(garminStatusColor, 0.14),
                color: garminStatusColor,
                border: `1px solid ${alphaColor(garminStatusColor, 0.3)}`,
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            mb: 2,
            bgcolor: SURFACE_COLORS.subtle,
            border: `1px solid ${SURFACE_COLORS.border}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
            INFORMACJE O KONCIE
          </Typography>
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                E-mail:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {garminStatus?.email ?? '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Ostatnia synchronizacja:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {formatTimestamp(garminStatus?.lastSyncAt ?? null)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {!!(!garminStatus?.connected || showGarminForm) && (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="E-mail Garmin"
              placeholder="E-mail konta Garmin Connect..."
              value={garminEmail}
              onChange={(event) => onGarminEmailChange(event.target.value)}
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
            />
            <TextField
              size="small"
              label="Hasło Garmin"
              placeholder="Hasło konta Garmin Connect..."
              type="password"
              value={garminPassword}
              onChange={(event) => onGarminPasswordChange(event.target.value)}
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
            />
            <Button
              variant="contained"
              startIcon={saveGarminCredentialsPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={() => {
                if (garminEmail.trim() && garminPassword.trim()) {
                  onSaveGarminCredentials(garminEmail.trim(), garminPassword.trim());
                }
              }}
              disabled={saveGarminCredentialsPending || !garminEmail.trim() || !garminPassword.trim()}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: BRAND_COLORS.garmin,
                '&:hover': { bgcolor: BRAND_COLORS.garminHover },
                '&.Mui-disabled': disabledButtonSx,
              }}
            >
              Zapisz dane logowania
            </Button>
          </Stack>
        )}

        {!!saveCredentialsErrorMessage && (
          <Typography variant="caption" sx={{ color: STATUS_COLORS.error, mb: 1, display: 'block' }}>
            Błąd zapisu danych: {saveCredentialsErrorMessage}
          </Typography>
        )}

        {!!garminStatus?.connected && (
          <Stack spacing={1.5}>
            {!showGarminForm && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onShowGarminFormChange(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderColor: STATUS_COLORS.neutral,
                  color: STATUS_COLORS.neutral,
                  '&:hover': {
                    bgcolor: alphaColor(STATUS_COLORS.neutral, 0.1),
                    borderColor: STATUS_COLORS.neutral,
                  },
                }}
              >
                Zmień dane logowania
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={garminSyncPending ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              onClick={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 7);
                onGarminSync(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
              }}
              disabled={garminSyncPending}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: BRAND_COLORS.garmin,
                '&:hover': { bgcolor: BRAND_COLORS.garminHover },
                '&.Mui-disabled': disabledButtonSx,
              }}
            >
              Synchronizuj dane zdrowotne (7 dni)
            </Button>
            <Button
              variant="outlined"
              startIcon={garminSyncPending ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              onClick={() => {
                const to = new Date();
                const from = new Date();
                from.setDate(from.getDate() - 30);
                onGarminSync(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
              }}
              disabled={garminSyncPending}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: BRAND_COLORS.garmin,
                color: BRAND_COLORS.garmin,
                '&:hover': {
                  bgcolor: alphaColor(BRAND_COLORS.garmin, 0.1),
                  borderColor: BRAND_COLORS.garmin,
                },
              }}
            >
              Synchronizuj ostatnie 30 dni
            </Button>

            <Button
              variant="outlined"
              startIcon={deleteGarminCredentialsPending ? <CircularProgress size={16} color="inherit" /> : <LinkOffIcon />}
              onClick={onDeleteGarminCredentials}
              disabled={deleteGarminCredentialsPending}
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: STATUS_COLORS.error,
                color: STATUS_COLORS.error,
                '&:hover': {
                  bgcolor: alphaColor(STATUS_COLORS.error, 0.1),
                  borderColor: STATUS_COLORS.error,
                },
              }}
            >
              Rozłącz
            </Button>
          </Stack>
        )}

        {!!garminSyncData && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              mt: 2,
              bgcolor: alphaColor(garminSyncData.failed > 0 ? STATUS_COLORS.error : STATUS_COLORS.success, 0.08),
              border: `1px solid ${
                alphaColor(garminSyncData.failed > 0 ? STATUS_COLORS.error : STATUS_COLORS.success, 0.3)
              }`,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
              Wynik synchronizacji
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" sx={{ color: STATUS_COLORS.success }}>
                ✓ {garminSyncData.synced} zsync.
              </Typography>
              <Typography variant="caption" sx={{ color: STATUS_COLORS.warning }}>
                ⊘ {garminSyncData.skipped} pominięte
              </Typography>
              {garminSyncData.failed > 0 && (
                <Typography variant="caption" sx={{ color: STATUS_COLORS.error }}>
                  ✗ {garminSyncData.failed} błędy
                </Typography>
              )}
            </Box>
            {!!garminSyncData.errors && garminSyncData.errors.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {garminSyncData.errors.some((error) => error.toLowerCase().includes('cloudflare')) && (
                  <Typography variant="caption" sx={{ color: STATUS_COLORS.error, display: 'block' }}>
                    Garmin zablokował nieoficjalne logowanie SSO przez Cloudflare dla tego serwera lub IP.
                    To zwykle nie oznacza błędnego hasła.
                  </Typography>
                )}
                {garminSyncData.errors.slice(0, 3).map((error, index) => (
                  <Typography key={`${error}-${index}`} variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    • {error}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {!!syncErrorMessage && (
          <Typography variant="caption" sx={{ color: STATUS_COLORS.error, mt: 1, display: 'block' }}>
            Błąd synchronizacji: {syncErrorMessage}
          </Typography>
        )}

        {!!garminStatus?.connected && !!garminHealthToday && garminHealthToday.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <GarminHealthCard data={garminHealthToday[garminHealthToday.length - 1]} />
          </Box>
        )}
      </Box>
    </DataCard>
  );
}
