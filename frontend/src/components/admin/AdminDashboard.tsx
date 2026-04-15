import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Box, Grid, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import DataCard from '@/components/common/DataCard';
import {
  BRAND_COLORS,
  COMMON_COLORS,
  GRADIENTS,
  STATUS_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getApiErrorMessage } from '@/utils/errorHandling';

export interface AiStatus {
  batchEnabled?: boolean;
  batchCron?: string;
  activeProvider?: string | null;
}

export interface AiBatchResult {
  message: string;
  success: number;
  skipped: number;
  failed: number;
}

export interface AdminDashboardProps {
  aiStatus: AiStatus | undefined;
  runAiBatchPending: boolean;
  runAiBatchData: AiBatchResult | undefined;
  runAiBatchError: Error | null;
  onRunAiBatch: (skipToday: boolean) => void;
}

export default function AdminDashboard({
  aiStatus,
  runAiBatchPending,
  runAiBatchData,
  runAiBatchError,
  onRunAiBatch,
}: AdminDashboardProps) {
  const runAiBatchErrorMessage = runAiBatchError
    ? getApiErrorMessage(runAiBatchError, runAiBatchError.message)
    : null;

  return (
    <>
      <Grid item xs={12} md={6}>
        <DataCard title="Predykcje AI">
            <Box sx={{ py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AutoAwesomeIcon sx={{ color: BRAND_COLORS.ai, fontSize: 28 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Batch prognoz AI (6 typów)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {aiStatus?.batchEnabled === false
                      ? 'Batch nocny wyłączony'
                      : `Automatycznie ${
                        aiStatus?.batchCron === '0 0 3 * * *'
                          ? 'o 03:00'
                          : aiStatus?.batchCron
                            ? `(cron: ${aiStatus.batchCron})`
                            : 'o 03:00'
                      } · ${aiStatus?.activeProvider ?? '—'}`}
                </Typography>
              </Box>
            </Box>

            {!!runAiBatchData && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  mb: 2,
                  bgcolor: runAiBatchData.failed > 0
                    ? alphaColor(STATUS_COLORS.error, 0.08)
                    : alphaColor(STATUS_COLORS.success, 0.08),
                  border: `1px solid ${
                    runAiBatchData.failed > 0
                      ? alphaColor(STATUS_COLORS.error, 0.3)
                      : alphaColor(STATUS_COLORS.success, 0.3)
                  }`,
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                    {runAiBatchData.message}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: STATUS_COLORS.success }}>
                      ✓ {runAiBatchData.success} sukces
                    </Typography>
                    <Typography variant="caption" sx={{ color: STATUS_COLORS.warning }}>
                      ⊘ {runAiBatchData.skipped} pominięte
                    </Typography>
                    {runAiBatchData.failed > 0 && (
                      <Typography variant="caption" sx={{ color: STATUS_COLORS.error }}>
                        ✗ {runAiBatchData.failed} błędy
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}

            {!!runAiBatchErrorMessage && (
              <Typography variant="caption" sx={{ color: STATUS_COLORS.error, mb: 1.5, display: 'block' }}>
                Błąd: {runAiBatchErrorMessage}
              </Typography>
            )}

            <Stack spacing={1}>
              <Button
                variant="contained"
                startIcon={runAiBatchPending ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                onClick={() => onRunAiBatch(false)}
                disabled={runAiBatchPending}
                fullWidth
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  background: GRADIENTS.ai,
                  boxShadow: `0 4px 14px ${alphaColor(BRAND_COLORS.ai, 0.22)}`,
                  '&:hover': { background: GRADIENTS.aiHover },
                  '&.Mui-disabled': {
                    bgcolor: alphaColor(COMMON_COLORS.white, 0.08),
                    color: alphaColor(COMMON_COLORS.white, 0.3),
                  },
                }}
              >
                {runAiBatchPending ? 'Generowanie...' : 'Generuj wszystkie predykcje'}
              </Button>
              <Button
                variant="outlined"
                startIcon={runAiBatchPending ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                onClick={() => onRunAiBatch(true)}
                disabled={runAiBatchPending}
                fullWidth
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: BRAND_COLORS.ai,
                  color: BRAND_COLORS.ai,
                  '&:hover': { bgcolor: alphaColor(BRAND_COLORS.ai, 0.1), borderColor: BRAND_COLORS.ai },
                }}
              >
                Generuj brakujące (pomiń dzisiejsze)
              </Button>
            </Stack>
          </Box>
        </DataCard>
      </Grid>

      <Grid item xs={12}>
        <DataCard title="Informacje">
          <Stack spacing={1} sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Sync Strava</strong> — pobiera aktywności z API Strava, oblicza metryki (NP, TSS, IF, strefy) i zapisuje do bazy.
              „Ostatnie 30 dni" jest szybsze, „Pełny sync" importuje całą historię.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Cache pogody</strong> — automatycznie odświeżany 2x dziennie (06:00, 18:00).
              Pobiera 8-dniową prognozę godzinową i oblicza outdoor scores dla każdej godziny.
              Ręczne odświeżenie wymusza pobranie aktualnych danych.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Garmin Connect</strong> — synchronizuje dane zdrowotne z Garmin Connect (tętno spoczynkowe, sen, stres, kroki).
              Dane logowania są szyfrowane. Synchronizacja pobiera dane za wybrany okres.
            </Typography>
          </Stack>
        </DataCard>
      </Grid>
    </>
  );
}
