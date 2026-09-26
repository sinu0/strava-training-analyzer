
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SyncIcon from '@mui/icons-material/Sync';
import TimerIcon from '@mui/icons-material/Timer';
import UpdateIcon from '@mui/icons-material/Update';
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { formatTimestamp, StatusChip } from '@/components/admin/adminUtils';
import { adminMessages } from '@/components/admin/messages';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Widget } from '@/ui';
import {
  BRAND_COLORS,
  CHART_COLORS,
  STATUS_COLORS,
  SURFACE_COLORS,
  alphaColor,
} from '@/utils/colors';

export interface SyncStatus {
  status: string;
  timestamp: string | null;
  lastSyncAt?: string | null;
  imported: number;
  skipped: number;
  rateLimitResetsAt?: string | null;
}

export interface SyncStatusSectionProps {
  syncStatus: SyncStatus | undefined;
  syncLoading: boolean;
  isSyncing: boolean;
  isRateLimited: boolean;
  rateLimitCountdown: string;
  syncDisabled: boolean;
  syncErrorMessage: string | null;
  syncPhotosPending: boolean;
  resyncStreamsPending: boolean;
  clearSyncDataPending: boolean;
  recalculateMetricsPending: boolean;
  recalculateActivityMetricsPending: boolean;
  autoSyncIntervalMinutes: number | undefined;
  updateAutoSyncPending: boolean;
  onSyncRecent: () => void;
  onSyncFull: () => void;
  onSyncPhotos: () => void;
  onResyncStreams: () => void;
  onClearSyncData: () => void;
  onRecalculateMetrics: () => void;
  onRecalculateActivityMetrics: () => void;
  onUpdateAutoSyncInterval: (minutes: number) => void;
}

export default function SyncStatusSection({
  syncStatus,
  syncLoading,
  isSyncing,
  isRateLimited,
  rateLimitCountdown,
  syncDisabled,
  syncErrorMessage,
  syncPhotosPending,
  resyncStreamsPending,
  clearSyncDataPending,
  recalculateMetricsPending,
  recalculateActivityMetricsPending,
  autoSyncIntervalMinutes,
  updateAutoSyncPending,
  onSyncRecent,
  onSyncFull,
  onSyncPhotos,
  onResyncStreams,
  onClearSyncData,
  onRecalculateMetrics,
  onRecalculateActivityMetrics,
  onUpdateAutoSyncInterval,
}: SyncStatusSectionProps) {
  const t = adminMessages.useT();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [intervalInput, setIntervalInput] = useState(String(autoSyncIntervalMinutes ?? 30));

  const handleConfirmClear = () => {
    onClearSyncData();
    setClearDialogOpen(false);
  };

  return (
    <>
      <Widget title={t('syncStatus.title')}>
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <SyncIcon sx={{ color: STATUS_COLORS.info, fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t('syncStatus.status')}
              </Typography>
              {syncLoading ? (
                <CircularProgress size={16} />
              ) : (
                <StatusChip status={syncStatus?.status ?? 'idle'} />
              )}
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
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {t('syncStatus.lastSync')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {formatTimestamp(syncStatus?.lastSyncAt ?? syncStatus?.timestamp ?? null)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {t('syncStatus.imported')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: STATUS_COLORS.success }}>
                  {syncStatus?.imported ?? 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{
                  color: "text.secondary"
                }}>
                  {t('syncStatus.skipped')}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: STATUS_COLORS.warning }}>
                  {syncStatus?.skipped ?? 0}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {!!isRateLimited && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                mb: 2,
                bgcolor: alphaColor(STATUS_COLORS.error, 0.08),
                border: `1px solid ${alphaColor(STATUS_COLORS.error, 0.3)}`,
              }}
            >
              <Stack direction="row" spacing={1} sx={{
                alignItems: "center"
              }}>
                <TimerIcon sx={{ color: STATUS_COLORS.error, fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: STATUS_COLORS.error, display: 'block' }}>
                    {t('syncStatus.rateLimitedTitle')}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: "text.secondary"
                  }}>
                    {rateLimitCountdown
                      ? t('syncStatus.rateLimitCountdown', { countdown: rateLimitCountdown })
                      : t('syncStatus.rateLimitExpired')}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <CloudSyncIcon />}
              onClick={onSyncRecent}
              disabled={syncDisabled}
              fullWidth
              sx={{
                textTransform: 'none',
                bgcolor: STATUS_COLORS.info,
                '&:hover': { bgcolor: alphaColor(STATUS_COLORS.info, 0.85) },
                fontWeight: 600,
              }}
            >
              {t('syncStatus.syncRecent')}
            </Button>
            <Button
              variant="outlined"
              startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              onClick={onSyncFull}
              disabled={syncDisabled}
              fullWidth
              sx={{
                textTransform: 'none',
                borderColor: CHART_COLORS.primary,
                color: CHART_COLORS.primary,
                '&:hover': { bgcolor: alphaColor(CHART_COLORS.primary, 0.1), borderColor: CHART_COLORS.primary },
                fontWeight: 600,
              }}
            >
              {isRateLimited && !rateLimitCountdown ? t('syncStatus.syncContinue') : t('syncStatus.syncFull')}
            </Button>
            <Button
              variant="outlined"
              startIcon={syncPhotosPending ? <CircularProgress size={16} color="inherit" /> : <CloudSyncIcon />}
              onClick={onSyncPhotos}
              disabled={syncDisabled}
              fullWidth
              sx={{
                textTransform: 'none',
                borderColor: CHART_COLORS.secondary,
                color: CHART_COLORS.secondary,
                '&:hover': { bgcolor: alphaColor(CHART_COLORS.secondary, 0.1), borderColor: CHART_COLORS.secondary },
                fontWeight: 600,
              }}
            >
              {t('syncStatus.syncPhotos')}
            </Button>
            <Button
              variant="outlined"
              startIcon={resyncStreamsPending ? <CircularProgress size={16} color="inherit" /> : <CloudSyncIcon />}
              onClick={onResyncStreams}
              disabled={syncDisabled}
              fullWidth
              sx={{
                textTransform: 'none',
                borderColor: STATUS_COLORS.warning,
                color: STATUS_COLORS.warning,
                '&:hover': { bgcolor: alphaColor(STATUS_COLORS.warning, 0.1), borderColor: STATUS_COLORS.warning },
                fontWeight: 600,
              }}
            >
              {t('syncStatus.resyncStreams')}
            </Button>
            <Button
              variant="outlined"
              startIcon={clearSyncDataPending ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverIcon />}
              onClick={() => setClearDialogOpen(true)}
              disabled={syncDisabled || clearSyncDataPending}
              fullWidth
              sx={{
                textTransform: 'none',
                borderColor: STATUS_COLORS.error,
                color: STATUS_COLORS.error,
                '&:hover': { bgcolor: alphaColor(STATUS_COLORS.error, 0.1), borderColor: STATUS_COLORS.error },
                fontWeight: 600,
              }}
            >
              {t('syncStatus.clearData')}
            </Button>
            <Button
              variant="outlined"
              startIcon={recalculateMetricsPending ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              onClick={onRecalculateMetrics}
              disabled={recalculateMetricsPending}
              fullWidth
              sx={{
                textTransform: 'none',
                borderColor: BRAND_COLORS.ai,
                color: BRAND_COLORS.ai,
                '&:hover': { bgcolor: alphaColor(BRAND_COLORS.ai, 0.1), borderColor: BRAND_COLORS.ai },
                fontWeight: 600,
              }}
            >
              {t('syncStatus.recalculateMetrics')}
            </Button>
            <Button
              variant="outlined"
              startIcon={recalculateActivityMetricsPending ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
              onClick={onRecalculateActivityMetrics}
              disabled={recalculateActivityMetricsPending}
              fullWidth
              sx={{
                textTransform: 'none',
                borderColor: STATUS_COLORS.info,
                color: STATUS_COLORS.info,
                '&:hover': { bgcolor: alphaColor(STATUS_COLORS.info, 0.1), borderColor: STATUS_COLORS.info },
                fontWeight: 600,
              }}
            >
              {t('syncStatus.recalculateActivityMetrics')}
            </Button>
          </Stack>

          {!!syncErrorMessage && (
            <Typography variant="caption" sx={{ color: STATUS_COLORS.error, mt: 1, display: 'block' }}>
              {syncErrorMessage}
            </Typography>
          )}

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alphaColor(STATUS_COLORS.accent, 0.04),
              border: `1px solid ${SURFACE_COLORS.border}`,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                mb: 1
              }}>
              <UpdateIcon sx={{ fontSize: 18, color: STATUS_COLORS.accent }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t('syncStatus.autoSync.title')}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: 'block',
                mb: 1
              }}>
              {t('syncStatus.autoSync.description')}
            </Typography>
            <Stack direction="row" spacing={1} sx={{
              alignItems: "center"
            }}>
              <TextField
                size="small"
                type="number"
                value={intervalInput}
                onChange={(e) => setIntervalInput(e.target.value)}
                disabled={updateAutoSyncPending}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    borderRadius: 1.5,
                  },
                }}
                slotProps={{
                  htmlInput: { min: 1, max: 1440, style: { textAlign: 'center', width: 60 } }
                }}
              />
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {t('syncStatus.autoSync.unit')}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                disabled={updateAutoSyncPending}
                onClick={() => {
                  const v = parseInt(intervalInput, 10);
                  if (v >= 1 && v <= 1440) {
                    onUpdateAutoSyncInterval(v);
                  }
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  borderColor: STATUS_COLORS.accent,
                  color: STATUS_COLORS.accent,
                  '&:hover': { bgcolor: alphaColor(STATUS_COLORS.accent, 0.1) },
                }}
              >
                {updateAutoSyncPending ? t('syncStatus.autoSync.saving') : t('syncStatus.autoSync.save')}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Widget>

      <ConfirmDialog
        open={clearDialogOpen}
        title={t('syncStatus.clearDialog.title')}
        message={t('syncStatus.clearDialog.message')}
        confirmLabel={t('syncStatus.clearDialog.confirm')}
        onConfirm={handleConfirmClear}
        onClose={() => setClearDialogOpen(false)}
      />
    </>
  );
}
