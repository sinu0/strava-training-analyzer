import { Box, Paper, Typography, Divider } from '@mui/material';

import { getAppThemeTokens } from '../../theme/theme';
import ElevationProfile from '../route/ElevationProfile';

import type { ElevationPoint } from '../../types/route';

export interface RouteElevationChartProps {
  elevationPoints: ElevationPoint[];
  onHover: (index: number | null) => void;
}

export default function RouteElevationChart({ elevationPoints, onHover }: RouteElevationChartProps) {
  return (
    <Paper sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
      <Box sx={{ px: (theme) => getAppThemeTokens(theme).space.card, pt: 2 }}>
        <Typography variant="subtitle2">Profil wysokości</Typography>
      </Box>
      <Divider />
      <ElevationProfile points={elevationPoints} onHover={onHover} />
    </Paper>
  );
}
