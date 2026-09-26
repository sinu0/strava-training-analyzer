import StarOutlineIcon from '@mui/icons-material/StarOutlineOutlined';
import { Box, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { adminMessages } from '@/components/admin/messages';
import { Widget } from '@/ui';
import {
  COMMON_COLORS,
  STATUS_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getApiErrorMessage } from '@/utils/errorHandling';

export interface TrainingEffectsSectionProps {
  pending: boolean;
  data: { total: number; success: number; failed: number } | undefined;
  error: Error | null;
  onRecalculate: () => void;
}

/** Recalculates training effects for every activity. */
export default function TrainingEffectsSection({ pending, data, error, onRecalculate }: TrainingEffectsSectionProps) {
  const t = adminMessages.useT();
  const teErrorMessage = error ? getApiErrorMessage(error, error.message) : null;

  return (
    <Widget title={t('dashboard.teTitle')}>
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <StarOutlineIcon sx={{ color: STATUS_COLORS.warning, fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t('dashboard.te.description')}
              </Typography>
            </Box>
          </Box>

          {!!data && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                mb: 2,
                bgcolor: data.failed > 0
                  ? alphaColor(STATUS_COLORS.error, 0.08)
                  : alphaColor(STATUS_COLORS.success, 0.08),
                border: `1px solid ${
                  data.failed > 0
                    ? alphaColor(STATUS_COLORS.error, 0.3)
                    : alphaColor(STATUS_COLORS.success, 0.3)
                }`,
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                  {t('dashboard.te.done')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="caption" sx={{ color: STATUS_COLORS.success }}>
                    {t('dashboard.result.success', { count: data.success })}
                  </Typography>
                  <Typography variant="caption" sx={{
                    color: "text.secondary"
                  }}>
                    {t('dashboard.te.total', { total: data.total })}
                  </Typography>
                  {data.failed > 0 && (
                    <Typography variant="caption" sx={{ color: STATUS_COLORS.error }}>
                      {t('dashboard.te.failedCount', { count: data.failed })}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          )}

          {!!teErrorMessage && (
            <Typography variant="caption" sx={{ color: STATUS_COLORS.error, mb: 1.5, display: 'block' }}>
              {t('dashboard.te.error', { message: teErrorMessage })}
            </Typography>
          )}

          <Button
            variant="contained"
            startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <StarOutlineIcon />}
            onClick={onRecalculate}
            disabled={pending}
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: STATUS_COLORS.warning,
              '&:hover': { bgcolor: 'warning.dark' },
              '&.Mui-disabled': {
                bgcolor: alphaColor(COMMON_COLORS.white, 0.08),
                color: alphaColor(COMMON_COLORS.white, 0.3),
              },
            }}
          >
            {pending ? t('dashboard.te.pending') : t('dashboard.te.action')}
          </Button>
        </Box>
      </Widget>
  );
}
