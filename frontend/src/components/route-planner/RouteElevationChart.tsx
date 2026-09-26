import { Box, Typography, Divider } from '@mui/material';

import { Surface } from '@/ui';

import { routePlannerControlsMessages } from './messages';
import { getAppThemeTokens } from '../../theme/theme';
import ElevationProfile from '../route/ElevationProfile';


import type { ElevationPoint } from '../../types/route';

export interface RouteElevationChartProps {
  elevationPoints: ElevationPoint[];
  onHover: (index: number | null) => void;
}

export default function RouteElevationChart({ elevationPoints, onHover }: RouteElevationChartProps) {
  const t = routePlannerControlsMessages.useT();
  return (
    <Surface padding="none" sx={{ flexShrink: 0 }}>
      <Box sx={{ px: (theme) => getAppThemeTokens(theme).space.card, pt: 2 }}>
        <Typography variant="subtitle2">{t('elevation.title')}</Typography>
      </Box>
      <Divider />
      <ElevationProfile points={elevationPoints} onHover={onHover} />
    </Surface>
  );
}
