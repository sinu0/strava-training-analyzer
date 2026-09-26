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

import { adminMessages } from '@/components/admin/messages';
import { Widget } from '@/ui';
import {
  CHART_COLORS,
  GRADIENTS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '@/utils/colors';


function SourceChip({ source }: { source: string }) {
  const t = adminMessages.t;
  return (
    <Chip
      label={source === 'db' ? t('stravaConfig.sourceDb') : t('stravaConfig.sourceEnv')}
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
  const t = adminMessages.useT();
  return (
    <Widget title={t('stravaConfig.title')}>
      <Box sx={{ py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <VpnKeyIcon sx={{ color: CHART_COLORS.primary, fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {t('stravaConfig.subtitle')}
          </Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {t('stravaConfig.caption')}
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
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 700,
                mb: 1,
                display: 'block'
              }}>
              {t('stravaConfig.currentStatus')}
            </Typography>
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>{t('stravaConfig.account')}</Typography>
                <Chip
                  size="small"
                  icon={profileConnected ? <CheckCircleIcon sx={{ fontSize: 15 }} /> : <ErrorIcon sx={{ fontSize: 15 }} />}
                  label={profileConnected ? t('stravaConfig.accountConnected') : t('stravaConfig.accountDisconnected')}
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
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>{t('stravaConfig.clientId')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {stravaConfig?.clientId ? (stravaConfig.clientId.slice(0, 4) + '...') : '—'}
                  </Typography>
                  {!!stravaConfig && <SourceChip source={stravaConfig.clientIdSource} />}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>{t('stravaConfig.clientSecret')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: stravaConfig?.hasClientSecret ? STATUS_COLORS.success : STATUS_COLORS.error }}>
                    {stravaConfig?.hasClientSecret ? t('stravaConfig.valueSet') : t('stravaConfig.valueMissing')}
                  </Typography>
                  {!!stravaConfig && <SourceChip source={stravaConfig.clientSecretSource} />}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>{t('stravaConfig.webhookToken')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: stravaConfig?.hasWebhookToken ? STATUS_COLORS.success : STATUS_COLORS.warning }}>
                    {stravaConfig?.hasWebhookToken ? t('stravaConfig.valueSet') : t('stravaConfig.valueMissing')}
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
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  display: 'block',
                  mb: 0.75,
                  fontWeight: 700
                }}>
                {t('stravaConfig.connectSection')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('stravaConfig.connectTitle')}
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {t('stravaConfig.connectCaption')}
              </Typography>
            </Box>
            <TextField
              size="small"
              label={t('stravaConfig.fields.clientIdLabel')}
              placeholder={t('stravaConfig.fields.clientIdPlaceholder')}
              value={clientId}
              onChange={(e) => onClientIdChange(e.target.value)}
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
            />
            <TextField
              size="small"
              label={t('stravaConfig.fields.clientSecretLabel')}
              placeholder={t('stravaConfig.fields.clientSecretPlaceholder')}
              type="password"
              value={clientSecret}
              onChange={(e) => onClientSecretChange(e.target.value)}
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
            />
            <TextField
              size="small"
              label={t('stravaConfig.fields.webhookTokenLabel')}
              placeholder={t('stravaConfig.fields.webhookTokenPlaceholder')}
              type="password"
              value={webhookToken}
              onChange={(e) => onWebhookTokenChange(e.target.value)}
              fullWidth
              sx={{ '& .MuiInputLabel-root': { fontSize: '0.85rem' } }}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title={canStartStravaConnect ? t('stravaConfig.connectTooltipReady') : t('stravaConfig.connectTooltipMissing')}>
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
                  {t('stravaConfig.connect')}
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
              {t('stravaConfig.save')}
            </Button>
            <Tooltip title={t('stravaConfig.resetTooltip')}>
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
                {t('stravaConfig.reset')}
              </Button>
            </Tooltip>
          </Stack>
        </>
      )}
    </Box>
    </Widget>
  );
}
