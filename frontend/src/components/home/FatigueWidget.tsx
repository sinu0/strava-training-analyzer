import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { FatigueState } from '@/types/fatigue';
import { STATUS_COLORS } from '@/utils/colors';

interface FatigueWidgetProps {
  data: FatigueState | undefined;
  isLoading: boolean;
}

function MiniBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Typography variant="caption" sx={{ fontWeight: 600, color, minWidth: 64, fontSize: '0.6rem' }}>
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

export default function FatigueWidget({ data, isLoading }: FatigueWidgetProps) {
  const navigate = useNavigate();

  if (isLoading || !data) {
    return null;
  }

  const scoreColor = data.score <= 30 ? STATUS_COLORS.success :
    data.score <= 55 ? STATUS_COLORS.info :
    data.score <= 75 ? STATUS_COLORS.warning : STATUS_COLORS.error;

  return (
    <Paper
      onClick={() => navigate('/analytics')}
      sx={{
        p: 1.75,
        borderRadius: 3,
        border: `1px solid ${scoreColor}30`,
        bgcolor: `${scoreColor}08`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': { borderColor: `${scoreColor}50`, bgcolor: `${scoreColor}0C` },
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <BatteryAlertIcon sx={{ color: scoreColor, fontSize: 18 }} />
            <Typography variant="overline" sx={{ fontWeight: 800, color: scoreColor, letterSpacing: '0.06em', fontSize: '0.6rem' }}>
              Zmęczenie
            </Typography>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
            {data.score}
          </Typography>
        </Stack>

        <Stack spacing={0.4}>
          <MiniBar value={data.atlFatigue} max={25} color={scoreColor} label="ATL" />
          <MiniBar value={data.metabolicFatigue} max={25} color={scoreColor} label="Meta" />
          <MiniBar value={data.loadFatigue} max={25} color={scoreColor} label="TSB" />
          <MiniBar value={data.recoveryDebt} max={25} color={scoreColor} label="Dług" />
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          {data.level} · trend {data.trend}{data.weeklyRampRate !== 0 ? ` · rampa ${data.weeklyRampRate > 0 ? '+' : ''}${data.weeklyRampRate}%/tydz` : ''}
        </Typography>
      </Stack>
    </Paper>
  );
}
