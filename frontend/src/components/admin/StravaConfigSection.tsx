import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LinkIcon from '@mui/icons-material/Link';
import RestoreIcon from '@mui/icons-material/Restore';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  TextField,
  Tooltip,
} from '@mui/material';

import {
  CHART_COLORS,
  GRADIENTS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '@/utils/colors';

import DataCard from '../common/DataCard';

function SourceChip({ source }: { source: string }) {
  return (
    <Chip
      label={source === 'db' ? 'z bazy' : 'z env'}
      size="small"
      sx={{
        height: 18,
        fontSize: '0.6rem',
        fontWeight: 600,
        bgcolor: alphaColor(source === 'db' ? CHART_COLORS.secondary : STATUS_COLORS.info, 0.15),
        color: source === 'db' ? CHART_COLORS.secondary : STATUS_COLORS.info,
        border: `1px solid ${alphaColor(source === 'db' ? CHART_COLORS.secondary : STATUS_COLORS.info, 0.3)}`,
      }}
    />
  );
}

export interface StravaConfig {
  clientId: string;
  clientIdSource: string;
  hasClientSecret: boolean;
  clientSecretSource: string;
  hasWebhookToken: boolean;
  webhookTokenSource: string;
}

export interface StravaConfigSectionProps {
  configLoading: boolean;
  stravaConfig: StravaConfig | undefined;
  profileConnected: boolean | undefined;
  clientId: string;
  clientSecret: string;
  webhookToken: string;
  connectPending: boolean;
  updatePending: boolean;
  resetPending: boolean;
  canStartStravaConnect: boolean;
  onClientIdChange: (value: string) => void;
  onClientSecretChange: (value: string) => void;
  onWebhookTokenChange: (value: string) => void;
  onSaveConfig: () => void;
  onConnectStrava: () => void;
  onResetConfig: () => void;
}

export default function StravaConfigSection({
  configLoading,
  stravaConfig,
  profileConnected,
  clientId,
  clientSecret,
  webhookToken,
  connectPending,
  updatePending,
  resetPending,
  canStartStravaConnect,
  onClientIdChange,
  onClientSecretChange,
  onWebhookTokenChange,
  onSaveConfig,
  onConnectStrava,
  onResetConfig,
}: StravaConfigSectionProps) {
  return (
    <DataCard title="Konfiguracja Strava">
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <VpnKeyIcon sx={{ color: CHART_COLORS.primary, fontSize: 28 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Dane autoryzacji OAuth2
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Puste pola = wartości z env
            </Typography>
          </Box>
        </Box>

        {configLoading ? (
          <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 2 }} />
        ) : (
          <>
            {/* Current config status */}
            <Box sx={{
              p: 1.5, borderRadius: 1.5, mb: 2,
              bgcolor: SURFACE_COLORS.subtle,
              border: `1px solid ${SURFACE_COLORS.border}`,
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                AKTUALNY STATUS
              </Typography>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Konto Strava:</Typography>
                  <Chip
                    size="small"
                    icon={profileConnected ? <CheckCircleIcon sx={{ fontSize: 15 }} /> : <ErrorIcon sx={{ fontSize: 15 }} />}
                    label={profileConnected ? 'Połączone' : 'Niepołączone'}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: alphaColor(profileConnected ? STATUS_COLORS.success : STATUS_COLORS.error, 0.14),
                      color: profileConnected ? STATUS_COLORS.success : STATUS_COLORS.error,
                      border: `1px solid ${alphaColor(profileConnected ? STATUS_COLORS.success : STATUS_COLORS.error, 0.3)}`,
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Client ID:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {stravaConfig?.clientId ? (stravaConfig.clientId.slice(0, 4) + '...') : '—'}
                    </Typography>
                    {!!stravaConfig && <SourceChip source={stravaConfig.clientIdSource} />}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Client Secret:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: stravaConfig?.hasClientSecret ? STATUS_COLORS.success : STATUS_COLORS.error }}>
                      {stravaConfig?.hasClientSecret ? 'Ustawiony' : 'Brak'}
                    </Typography>
                    {!!stravaConfig && <SourceChip source={stravaConfig.clientSecretSource} />}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Webhook Token:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: stravaConfig?.hasWebhookToken ? STATUS_COLORS.success : STATUS_COLORS.warning }}>
                      {stravaConfig?.hasWebhookToken ? 'Ustawiony' : 'Brak'}
                    </Typography>
                    {!!stravaConfig && <SourceChip source={stravaConfig.webhookTokenSource} />}
                  </Box>
                </Box>
              </Stack>
            </Box>

            {/* Config form */}
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${alphaColor(CHART_COLORS.primary, 0.12)}, ${alphaColor(STATUS_COLORS.info, 0.08)})`,
                  border: `1px solid ${alphaColor(CHART_COLORS.primary, 0.18)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700 }}>
                  POŁĄCZENIE KONTA
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Rozpocznij OAuth2 bezpośrednio z panelu admina
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Przycisk otwiera ekran autoryzacji Stravy i wraca do aplikacji po udanym połączeniu.
                </Typography>
              </Box>
              <TextField
                size="small"
                label="Client ID"
                placeholder="Wpisz nowy Client ID..."
                value={clientId}
                onChange={(e) => onClientIdChange(e.target.value)}
                fullWidth
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
              />
              <TextField
                size="small"
                label="Client Secret"
                placeholder="Wpisz nowy Client Secret..."
                type="password"
                value={clientSecret}
                onChange={(e) => onClientSecretChange(e.target.value)}
                fullWidth
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
              />
              <TextField
                size="small"
                label="Webhook Verify Token"
                placeholder="Wpisz nowy Webhook Token..."
                type="password"
                value={webhookToken}
                onChange={(e) => onWebhookTokenChange(e.target.value)}
                fullWidth
                sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
              />
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title={canStartStravaConnect ? 'Przejdź do autoryzacji Strava' : 'Najpierw ustaw Client ID i Client Secret'}>
                <Box component="span" sx={{ display: 'flex', flex: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={connectPending ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                    onClick={onConnectStrava}
                    disabled={connectPending || !canStartStravaConnect}
                    sx={{
                      flex: 1,
                      textTransform: 'none',
                      fontWeight: 700,
                      background: GRADIENTS.strava,
                      boxShadow: `0 10px 24px ${alphaColor(STATUS_COLORS.brand, 0.22)}`,
                      '&:hover': {
                        background: GRADIENTS.stravaHover,
                        boxShadow: `0 12px 28px ${alphaColor(STATUS_COLORS.brand, 0.28)}`,
                      },
                      '&.Mui-disabled': {
                        bgcolor: alphaColor(CHART_COLORS.tooltipText, 0.08),
                        color: alphaColor(CHART_COLORS.tooltipText, 0.3),
                      },
                    }}
                  >
                    Połącz ze Stravą
                  </Button>
                </Box>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={updatePending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={onSaveConfig}
                disabled={updatePending || (!clientId.trim() && !clientSecret.trim() && !webhookToken.trim())}
                sx={{
                  flex: 1, textTransform: 'none', fontWeight: 600,
                  bgcolor: CHART_COLORS.primary,
                  '&:hover': { bgcolor: alphaColor(CHART_COLORS.primary, 0.85) },
                }}
              >
                Zapisz
              </Button>
              <Tooltip title="Przywróć wartości z env (usuń z bazy)">
                <Button
                  variant="outlined"
                  startIcon={resetPending ? <CircularProgress size={16} color="inherit" /> : <RestoreIcon />}
                  onClick={onResetConfig}
                  disabled={resetPending}
                  sx={{
                    textTransform: 'none', fontWeight: 600,
                    borderColor: STATUS_COLORS.warning, color: STATUS_COLORS.warning,
                    '&:hover': { bgcolor: alphaColor(STATUS_COLORS.warning, 0.1), borderColor: STATUS_COLORS.warning },
                  }}
                >
                  Reset
                </Button>
              </Tooltip>
            </Stack>
          </>
        )}
      </Box>
    </DataCard>
  );
}
