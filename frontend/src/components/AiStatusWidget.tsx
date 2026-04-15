import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Box, Typography, Chip, Stack } from '@mui/material';

import { COMMON_COLORS, STATUS_COLORS } from '../utils/colors';

import type { AiModuleStatus } from '../types/ai';

interface AiStatusWidgetProps {
  status?: AiModuleStatus;
}

export default function AiStatusWidget({ status }: AiStatusWidgetProps) {
  if (!status) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <SmartToyIcon sx={{ color: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary">Ładowanie statusu AI...</Typography>
      </Box>
    );
  }

  const statusColor = status.enabled && status.modelAvailable
    ? STATUS_COLORS.success
    : status.enabled
      ? STATUS_COLORS.warning
      : STATUS_COLORS.neutral;
  const statusLabel = status.enabled && status.modelAvailable
    ? 'Aktywny'
    : status.enabled
      ? 'Model niedostępny'
      : 'Wyłączony';

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToyIcon sx={{ color: statusColor }} />
        <Typography variant="body1" fontWeight={600}>Moduł AI</Typography>
        <Chip
          label={statusLabel}
          size="small"
          sx={{ bgcolor: statusColor, color: COMMON_COLORS.white, fontWeight: 600, ml: 'auto' }}
        />
      </Box>

      {!!status.enabled && <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Provider</Typography>
            <Typography variant="body2" fontWeight={500}>{status.activeProvider}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Model</Typography>
            <Typography variant="body2" fontWeight={500}>{status.activeModel}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Typy predykcji</Typography>
            <Typography variant="body2" fontWeight={500}>{status.availablePredictionTypes.length}</Typography>
          </Box>
          {typeof status.batchEnabled === 'boolean' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Nocny batch</Typography>
              <Typography variant="body2" fontWeight={500}>
                {status.batchEnabled
                  ? (status.batchCron === '0 0 3 * * *'
                    ? 'Aktywny (03:00)'
                    : status.batchCron
                      ? `Aktywny (${status.batchCron})`
                      : 'Aktywny')
                  : 'Wyłączony'}
              </Typography>
            </Box>
          )}
        </>}
    </Stack>
  );
}
