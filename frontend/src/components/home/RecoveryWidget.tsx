import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import BoltIcon from '@mui/icons-material/Bolt';
import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';

import type { FatigueState } from '@/types/fatigue';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';

interface RecoveryWidgetProps {
  data: FatigueState | undefined;
  isLoading: boolean;
}

function MiniBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Typography variant="caption" sx={{ fontWeight: 600, color, minWidth: 52, fontSize: '0.6rem' }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.06)',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color, minWidth: 20, textAlign: 'right', fontSize: '0.6rem' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function RecoveryWidget({ data, isLoading }: RecoveryWidgetProps) {
  if (isLoading || !data) return null;

  const fatigueColor = data.score <= 30 ? STATUS_COLORS.success :
    data.score <= 55 ? STATUS_COLORS.info :
    data.score <= 75 ? STATUS_COLORS.warning : STATUS_COLORS.error;

  const energyColor = data.energyBudget >= 70 ? STATUS_COLORS.success :
    data.energyBudget >= 45 ? STATUS_COLORS.info :
    data.energyBudget >= 25 ? STATUS_COLORS.warning : STATUS_COLORS.error;

  const suggestion = data.maxTssToday > 80 ? 'Możesz zrobić ciężki trening' :
    data.maxTssToday > 40 ? 'Dobry dzień na umiarkowany trening' :
    data.maxTssToday > 10 ? 'Lekki trening lub regeneracja' : 'Dzień odpoczynku';

  return (
    <Paper
      sx={{
        p: { xs: 1.75, md: 2 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: alphaColor(fatigueColor, 0.15),
        bgcolor: alphaColor(fatigueColor, 0.04),
      }}
    >
      <Stack spacing={1.5}>
        {/* Fatigue score + Energy budget side by side */}
        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
              <BatteryAlertIcon sx={{ color: fatigueColor, fontSize: 16 }} />
              <Typography variant="overline" sx={{ fontWeight: 800, color: fatigueColor, letterSpacing: '0.06em', fontSize: '0.6rem' }}>
                Zmęczenie
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, color: fatigueColor, lineHeight: 1, my: 0.25 }}>
              {data.score}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              / 100 · {data.level}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
              <BoltIcon sx={{ color: energyColor, fontSize: 16 }} />
              <Typography variant="overline" sx={{ fontWeight: 800, color: energyColor, letterSpacing: '0.06em', fontSize: '0.6rem' }}>
                Energia
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, color: energyColor, lineHeight: 1, my: 0.25 }}>
              {data.energyBudget}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
              / 100 · max TSS: {data.maxTssToday}
            </Typography>
          </Box>
        </Stack>

        {/* Fatigue breakdown bars */}
        <Stack spacing={0.35}>
          <MiniBar value={data.atlFatigue} max={25} color={fatigueColor} label="ATL" />
          <MiniBar value={data.metabolicFatigue} max={25} color={fatigueColor} label="Meta" />
          <MiniBar value={data.loadFatigue} max={25} color={fatigueColor} label="TSB" />
          <MiniBar value={data.recoveryDebt} max={25} color={fatigueColor} label="Dług" />
        </Stack>

        {/* Summary line */}
        <Box sx={{
          p: 0.75,
          borderRadius: 1,
          bgcolor: alphaColor(STATUS_COLORS.accent, 0.06),
        }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: energyColor, fontSize: '0.6rem' }}>
            {suggestion}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', display: 'block' }}>
            trend {data.trend}
            {data.weeklyRampRate !== 0 ? ` · rampa ${data.weeklyRampRate > 0 ? '+' : ''}${data.weeklyRampRate}%/tydz` : ''}
            {data.recoveryEfficiency > 0 ? ` · regeneracja ${data.recoveryEfficiency} pkt/h` : ''}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
