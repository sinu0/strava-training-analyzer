import { Box, Typography } from '@mui/material';
import { Tooltip as RechartsTooltip } from 'recharts';

import { formatTime, getTypeLabel } from './workoutChartUtils';

interface ChartTooltipPayload {
  payload?: { timeSec: number; power: number; label: string };
}

function TooltipContent({ active, payload }: { active?: boolean; payload?: ChartTooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
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
  return <RechartsTooltip content={<TooltipContent />} cursor={false} />;
}
