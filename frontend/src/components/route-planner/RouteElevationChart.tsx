import { Box, Paper, Typography, Divider } from '@mui/material';

import { UI_COLORS } from '../../utils/colors';
import ElevationProfile from '../route/ElevationProfile';

import type { ElevationPoint } from '../../types/route';

export interface RouteElevationChartProps {
  elevationPoints: ElevationPoint[];
  onHover: (index: number | null) => void;
}

export default function RouteElevationChart({ elevationPoints, onHover }: RouteElevationChartProps) {
  return (
    <Paper sx={{ backgroundColor: UI_COLORS.backgroundDefault, border: `1px solid ${UI_COLORS.divider}`, flexShrink: 0 }}>
      <Box sx={{ px: 2, pt: 1 }}>
        <Typography variant="subtitle2">Profil wysokości</Typography>
      </Box>
      <Divider sx={{ borderColor: UI_COLORS.divider }} />
      <ElevationProfile points={elevationPoints} onHover={onHover} />
    </Paper>
  );
}
