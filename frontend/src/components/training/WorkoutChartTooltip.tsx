import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Tooltip as RechartsTooltip } from 'recharts';

import { getChartVisuals } from '@/utils/chartStyles';

import { formatTime, getTypeLabel } from './workoutChartUtils';

interface ChartTooltipPayload {
  payload?: { timeSec: number; power: number; label: string };
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: ChartTooltipPayload[] }) {
  const theme = useTheme();
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <Box
      sx={{
        minWidth: 132,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 1.25,
        boxShadow: theme.tokens?.cardShadow ?? '0 12px 28px rgba(15, 23, 42, 0.12)',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {formatTime(d.timeSec)} — {getTypeLabel(d.label)}
      </Typography>
      <Typography variant="body2" color="text.primary" fontWeight={600}>
        {d.power}% FTP
      </Typography>
    </Box>
  );
}

export default function WorkoutChartTooltip() {
  const chart = getChartVisuals(useTheme());
  return <RechartsTooltip {...chart.tooltip} content={<TooltipContent />} cursor={false} />;
}
