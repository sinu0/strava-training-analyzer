import BoltIcon from '@mui/icons-material/Bolt';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { FatigueState } from '@/types/fatigue';
import { STATUS_COLORS } from '@/utils/colors';

interface EnergyBudgetWidgetProps {
  data: FatigueState | undefined;
  isLoading: boolean;
}

export default function EnergyBudgetWidget({ data, isLoading }: EnergyBudgetWidgetProps) {
  if (isLoading || !data) return null;

  const energyColor = data.energyBudget >= 70 ? STATUS_COLORS.success :
    data.energyBudget >= 45 ? STATUS_COLORS.info :
    data.energyBudget >= 25 ? STATUS_COLORS.warning : STATUS_COLORS.error;

  const energyLabel = data.energyBudget >= 70 ? 'Pełna' :
    data.energyBudget >= 45 ? 'Dobra' :
    data.energyBudget >= 25 ? 'Ograniczona' : 'Niska';

  const suggestion = data.maxTssToday > 80 ? 'Możesz zrobić ciężki trening' :
    data.maxTssToday > 40 ? 'Dobry dzień na umiarkowany trening' :
    data.maxTssToday > 10 ? 'Lekki trening lub regeneracja' : 'Dzień odpoczynku';

  return (
    <Paper
      sx={{
        p: 1.75,
        borderRadius: 3,
        border: `1px solid ${energyColor}30`,
        bgcolor: `${energyColor}08`,
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <BoltIcon sx={{ color: energyColor, fontSize: 18 }} />
            <Typography variant="overline" sx={{ fontWeight: 800, color: energyColor, letterSpacing: '0.06em', fontSize: '0.6rem' }}>
              Energia
            </Typography>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 900, color: energyColor, lineHeight: 1 }}>
            {data.energyBudget}
          </Typography>
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
            {energyLabel} energia · max TSS dziś: {data.maxTssToday}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: energyColor, fontSize: '0.6rem', mt: 0.25, display: 'block' }}>
            {suggestion}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
