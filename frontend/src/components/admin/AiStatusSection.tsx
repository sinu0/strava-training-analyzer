import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Box, Chip, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { adminMessages } from '@/components/admin/messages';
import { Widget } from '@/ui';
import {
  BRAND_COLORS,
  COMMON_COLORS,
  GRADIENTS,
  STATUS_COLORS,
  alphaColor,
} from '@/utils/colors';
import { getApiErrorMessage } from '@/utils/errorHandling';

export interface AiStatus {
    enabled?: boolean;
    batchEnabled?: boolean;
    batchCron?: string;
    activeProvider?: string | null;
    modelAvailable?: boolean;
    providerStatus?: 'DISABLED' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'AVAILABLE';
    knowledgeStatus?: 'DISABLED' | 'UNAVAILABLE' | 'EMPTY' | 'AVAILABLE';
    knowledgeDocuments?: number;
    knowledgeCorpusVersion?: string | null;
    noteQueueStatus?: 'DISABLED' | 'UNAVAILABLE' | 'PAUSED_PROVIDER_UNAVAILABLE' | 'READY';
    noteQueueSuspendedUntil?: string | null;
}

export interface AiBatchResult {
  message: string;
  success: number;
  skipped: number;
  failed: number;
}

export interface AiValidation {
  status: 'UNAVAILABLE' | 'INSUFFICIENT_DATA' | 'AVAILABLE';
  validSamples: number;
  minimumSamples: number;
  meanAccuracy: number | null;
}

export interface AiStatusSectionProps {
  aiStatus: AiStatus | undefined;
  aiValidation: AiValidation | undefined;
  runAiBatchPending: boolean;
  runAiBatchData: AiBatchResult | undefined;
  runAiBatchError: Error | null;
  onRunAiBatch: (skipToday: boolean) => void;
}

/** AI provider, knowledge base, note queue and validation status plus the prediction batch. */
export default function AiStatusSection({
  aiStatus,
  aiValidation,
  runAiBatchPending,
  runAiBatchData,
  runAiBatchError,
  onRunAiBatch,
}: AiStatusSectionProps) {
  const t = adminMessages.useT();
  const runAiBatchErrorMessage = runAiBatchError
    ? getApiErrorMessage(runAiBatchError, runAiBatchError.message)
    : null;

  const providerStatus = aiStatus?.providerStatus
    ?? (aiStatus?.modelAvailable ? 'AVAILABLE' : 'UNAVAILABLE');
  const canRunAi = aiStatus?.enabled === true && providerStatus === 'AVAILABLE';
  const providerLabel = providerStatus === 'AVAILABLE'
    ? t('dashboard.provider.available')
    : providerStatus === 'DISABLED'
      ? t('dashboard.provider.disabled')
      : providerStatus === 'NOT_CONFIGURED'
        ? t('dashboard.provider.notConfigured')
        : t('dashboard.provider.unavailable');
  const knowledgeLabel = aiStatus?.knowledgeStatus === 'AVAILABLE'
    ? t('dashboard.knowledge.ready', {
        details: `${aiStatus.knowledgeDocuments ?? 0}${
          aiStatus.knowledgeCorpusVersion ? `, v ${aiStatus.knowledgeCorpusVersion.slice(0, 8)}` : ''
        }`,
      })
    : aiStatus?.knowledgeStatus === 'EMPTY'
      ? t('dashboard.knowledge.empty')
      : aiStatus?.knowledgeStatus === 'DISABLED'
        ? t('dashboard.knowledge.disabled')
        : t('dashboard.knowledge.unavailable');
  const queueLabel = aiStatus?.noteQueueStatus === 'READY'
    ? t('dashboard.queue.ready')
    : aiStatus?.noteQueueStatus === 'PAUSED_PROVIDER_UNAVAILABLE'
      ? t('dashboard.queue.paused')
      : aiStatus?.noteQueueStatus === 'DISABLED'
        ? t('dashboard.queue.disabled')
        : t('dashboard.queue.unavailable');
  const validationLabel = aiValidation?.status === 'AVAILABLE'
    ? t('dashboard.validation.available', { percent: Math.round((aiValidation.meanAccuracy ?? 0) * 100), samples: aiValidation.validSamples })
    : aiValidation?.status === 'INSUFFICIENT_DATA'
      ? t('dashboard.validation.insufficient', { samples: aiValidation.validSamples, minimum: aiValidation.minimumSamples })
      : t('dashboard.validation.unavailable');
  const batchScheduleLabel = aiStatus?.batchCron === '0 0 3 * * *'
    ? t('dashboard.batch.at3am')
    : aiStatus?.batchCron
      ? t('dashboard.batch.cronLabel', { cron: aiStatus.batchCron })
      : t('dashboard.batch.at3am');

  return (
    <Widget title={t('dashboard.aiTitle')}>
        <Box sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <AutoAwesomeIcon sx={{ color: BRAND_COLORS.ai, fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                {t('dashboard.batch.label')}
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                {aiStatus?.batchEnabled === false
                  ? t('dashboard.batch.disabled')
                  : t('dashboard.batch.auto', { schedule: batchScheduleLabel, provider: aiStatus?.activeProvider ?? '—' })}
            </Typography>
          </Box>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
            <Chip
              size="small"
              variant="outlined"
              color={providerStatus === 'AVAILABLE' ? 'success' : 'warning'}
              label={providerLabel}
            />
            <Chip
              size="small"
              variant="outlined"
              color={aiStatus?.knowledgeStatus === 'AVAILABLE' ? 'success' : 'default'}
              label={knowledgeLabel}
            />
            <Chip
              size="small"
              variant="outlined"
              color={aiStatus?.noteQueueStatus === 'READY' ? 'success' : 'default'}
              label={queueLabel}
            />
            <Chip
              size="small"
              variant="outlined"
              color={aiValidation?.status === 'AVAILABLE' ? 'success' : 'default'}
              label={validationLabel}
            />
          </Stack>

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
                  {t('dashboard.result.success', { count: runAiBatchData.success })}
                </Typography>
                <Typography variant="caption" sx={{ color: STATUS_COLORS.warning }}>
                  {t('dashboard.result.skipped', { count: runAiBatchData.skipped })}
                </Typography>
                {runAiBatchData.failed > 0 && (
                  <Typography variant="caption" sx={{ color: STATUS_COLORS.error }}>
                    {t('dashboard.result.failed', { count: runAiBatchData.failed })}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}

        {!!runAiBatchErrorMessage && (
          <Typography variant="caption" sx={{ color: STATUS_COLORS.error, mb: 1.5, display: 'block' }}>
            {t('dashboard.result.error', { message: runAiBatchErrorMessage })}
          </Typography>
        )}

        <Stack spacing={1}>
          <Button
            variant="contained"
            startIcon={runAiBatchPending ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={() => onRunAiBatch(false)}
            disabled={runAiBatchPending || !canRunAi}
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
            {runAiBatchPending ? t('dashboard.runAllPending') : t('dashboard.runAll')}
          </Button>
          <Button
            variant="outlined"
            startIcon={runAiBatchPending ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={() => onRunAiBatch(true)}
            disabled={runAiBatchPending || !canRunAi}
            fullWidth
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: BRAND_COLORS.ai,
              color: BRAND_COLORS.ai,
              '&:hover': { bgcolor: alphaColor(BRAND_COLORS.ai, 0.1), borderColor: BRAND_COLORS.ai },
            }}
          >
            {t('dashboard.runMissing')}
          </Button>
        </Stack>
      </Box>
    </Widget>
  );
}
