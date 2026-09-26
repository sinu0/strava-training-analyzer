import BarChartIcon from '@mui/icons-material/BarChart';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TodayIcon from '@mui/icons-material/Today';

import type { ReactElement } from 'react';

export type AppNavigationKey =
  | 'today' | 'history' | 'analysis' | 'plan' | 'routes'
  | 'segments' | 'weather' | 'health' | 'profile' | 'data' | 'settings';

/** Label and description come from `nav.<key>.label|description` translations. */
export interface AppNavigationItem {
  key: AppNavigationKey;
  path: string;
  icon: ReactElement;
}

export const PRIMARY_NAVIGATION: AppNavigationItem[] = [
  { key: 'today', path: '/', icon: <TodayIcon /> },
  { key: 'history', path: '/activities', icon: <DirectionsBikeIcon /> },
  { key: 'analysis', path: '/analytics', icon: <BarChartIcon /> },
  { key: 'plan', path: '/training', icon: <FitnessCenterIcon /> },
  { key: 'routes', path: '/routes', icon: <RouteOutlinedIcon /> },
];

export const SECONDARY_NAVIGATION: AppNavigationItem[] = [
  { key: 'segments', path: '/segments', icon: <RouteOutlinedIcon /> },
  { key: 'weather', path: '/weather', icon: <CloudOutlinedIcon /> },
  { key: 'health', path: '/health', icon: <MonitorHeartOutlinedIcon /> },
  { key: 'profile', path: '/profile', icon: <PersonOutlineIcon /> },
  { key: 'data', path: '/data', icon: <DataObjectOutlinedIcon /> },
  { key: 'settings', path: '/settings', icon: <SettingsOutlinedIcon /> },
];

export const PRIMARY_NAVIGATION_BY_PATH = new Map(
  PRIMARY_NAVIGATION.map((item) => [item.path, item]),
);
