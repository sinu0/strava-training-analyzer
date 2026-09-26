import AutoAwesomeIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BuildIcon from '@mui/icons-material/BuildOutlined';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBikeOutlined';
import LinkIcon from '@mui/icons-material/LinkOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlineOutlined';
import SyncIcon from '@mui/icons-material/SyncOutlined';
import TuneIcon from '@mui/icons-material/TuneOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunnyOutlined';

import type { ReactElement } from 'react';

export const SETTINGS_TABS = [
  'general',
  'athlete',
  'integrations',
  'sync',
  'ai',
  'weather',
  'equipment',
  'maintenance',
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export const DEFAULT_SETTINGS_TAB: SettingsTab = 'general';

export const SETTINGS_TAB_ICONS: Record<SettingsTab, ReactElement> = {
  general: <TuneIcon />,
  athlete: <PersonIcon />,
  integrations: <LinkIcon />,
  sync: <SyncIcon />,
  ai: <AutoAwesomeIcon />,
  weather: <WbSunnyIcon />,
  equipment: <DirectionsBikeIcon />,
  maintenance: <BuildIcon />,
};

export function parseSettingsTab(value: string | null): SettingsTab {
  return SETTINGS_TABS.find((tab) => tab === value) ?? DEFAULT_SETTINGS_TAB;
}
