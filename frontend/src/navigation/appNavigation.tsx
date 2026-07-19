import BarChartIcon from '@mui/icons-material/BarChart';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import TodayIcon from '@mui/icons-material/Today';

import type { ReactElement } from 'react';

export interface AppNavigationItem {
  label: string;
  path: string;
  icon: ReactElement;
  description: string;
}

export const PRIMARY_NAVIGATION: AppNavigationItem[] = [
  { label: 'Dzisiaj', path: '/', icon: <TodayIcon />, description: 'Decyzja i kontekst dnia' },
  { label: 'Historia', path: '/activities', icon: <DirectionsBikeIcon />, description: 'Wykonane aktywności' },
  { label: 'Analiza', path: '/analytics', icon: <BarChartIcon />, description: 'Trendy i obciążenie' },
  { label: 'Plan', path: '/training', icon: <FitnessCenterIcon />, description: 'Kalendarz i scenariusze' },
  { label: 'Trasy', path: '/routes', icon: <RouteOutlinedIcon />, description: 'Planowanie przejazdu' },
];

export const SECONDARY_NAVIGATION: AppNavigationItem[] = [
  { label: 'Pogoda', path: '/weather', icon: <CloudOutlinedIcon />, description: 'Warunki dla treningu' },
  { label: 'Zdrowie', path: '/health', icon: <MonitorHeartOutlinedIcon />, description: 'Regeneracja i masa ciała' },
  { label: 'Profil', path: '/profile', icon: <PersonOutlineIcon />, description: 'Strefy i dane sportowe' },
  { label: 'Dane', path: '/data', icon: <DataObjectOutlinedIcon />, description: 'Import i jakość danych' },
  { label: 'Ustawienia', path: '/settings', icon: <SettingsOutlinedIcon />, description: 'Integracje i konfiguracja' },
];

export const PRIMARY_NAVIGATION_BY_PATH = new Map(
  PRIMARY_NAVIGATION.map((item) => [item.path, item]),
);
