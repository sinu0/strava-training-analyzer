
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SyncIcon from '@mui/icons-material/Sync';
import TimerIcon from '@mui/icons-material/Timer';
import UpdateIcon from '@mui/icons-material/Update';
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { formatTimestamp, StatusChip } from '@/components/admin/adminUtils';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import DataCard from '@/components/common/DataCard';
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
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [intervalInput, setIntervalInput] = useState(String(autoSyncIntervalMinutes ?? 30));

  const handleConfirmClear = () => {
    onClearSyncData();
    setClearDialogOpen(false);
  };

  return (
    <>
      <DataCard title="Synchronizacja Strava">
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <SyncIcon sx={{ color: STATUS_COLORS.info, fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Status synchronizacji
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
                <Typography variant="caption" color="text.secondary">
                  Ostatni sync:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {formatTimestamp(syncStatus?.lastSyncAt ?? syncStatus?.timestamp ?? null)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Zaimportowane:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: STATUS_COLORS.success }}>
                  {syncStatus?.imported ?? 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Pominięte:
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
              <Stack direction="row" alignItems="center" spacing={1}>
                <TimerIcon sx={{ color: STATUS_COLORS.error, fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: STATUS_COLORS.error, display: 'block' }}>
                    API zablokowane (rate limit)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rateLimitCountdown
                      ? `Odblokowanie za: ${rateLimitCountdown}`
                      : 'Limit wygasł — możesz kontynuować sync'}
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
              Sync ostatnich (30 dni)
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
              {isRateLimited && !rateLimitCountdown ? 'Kontynuuj sync' : 'Pełny sync (cała historia)'}
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
              Pobierz zdjęcia z istniejących aktywności
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
              Resync strumieni (GPS, prędkość, dystans)
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
              Wyczyść dane
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
              Przelicz metryki dzienne (CTL/ATL/TSB)
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
              Przelicz metryki aktywności (TSS, strefy)
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
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <UpdateIcon sx={{ fontSize: 18, color: STATUS_COLORS.accent }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Auto-sync w tle
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Aplikacja automatycznie sprawdza nowe aktywności co X minut.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="number"
                value={intervalInput}
                onChange={(e) => setIntervalInput(e.target.value)}
                inputProps={{ min: 1, max: 1440, style: { textAlign: 'center', width: 60 } }}
                disabled={updateAutoSyncPending}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    borderRadius: 1.5,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                minut
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
                {updateAutoSyncPending ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </DataCard>

      <ConfirmDialog
        open={clearDialogOpen}
        title="Wyczyścić wszystkie dane?"
        message="Ta operacja usunie wszystkie zsynchronizowane aktywności, metryki i dane dzienne. Aby ponownie pobrać dane, wykonaj pełny sync po wyczyszczeniu."
        confirmLabel="Wyczyść"
        onConfirm={handleConfirmClear}
        onClose={() => setClearDialogOpen(false)}
      />
    </>
  );
}
