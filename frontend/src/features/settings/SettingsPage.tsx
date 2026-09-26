import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import { settingsMessages } from '@/features/settings/messages';
import SettingsNav, { settingsPanelId, settingsTabId } from '@/features/settings/SettingsNav';
import { DEFAULT_SETTINGS_TAB, parseSettingsTab, SETTINGS_TAB_ICONS, type SettingsTab } from '@/features/settings/settingsTabs';
import AiTab from '@/features/settings/tabs/AiTab';
import AthleteTab from '@/features/settings/tabs/AthleteTab';
import EquipmentTab from '@/features/settings/tabs/EquipmentTab';
import GeneralTab from '@/features/settings/tabs/GeneralTab';
import IntegrationsTab from '@/features/settings/tabs/IntegrationsTab';
import MaintenanceTab from '@/features/settings/tabs/MaintenanceTab';
import SyncTab from '@/features/settings/tabs/SyncTab';
import WeatherTab from '@/features/settings/tabs/WeatherTab';
import { Page, SectionHeader } from '@/ui';

import type { ComponentType } from 'react';

const TAB_CONTENT: Record<SettingsTab, ComponentType> = {
  general: GeneralTab,
  athlete: AthleteTab,
  integrations: IntegrationsTab,
  sync: SyncTab,
  ai: AiTab,
  weather: WeatherTab,
  equipment: EquipmentTab,
  maintenance: MaintenanceTab,
};

/**
 * Settings grouped into tabs (`?tab=`). Only the active tab mounts, so its queries run on demand.
 */
export default function SettingsPage() {
  const t = settingsMessages.useT();
  const [params, setParams] = useSearchParams();
  const tab = parseSettingsTab(params.get('tab'));
  const Content = TAB_CONTENT[tab];

  const changeTab = (next: SettingsTab) => {
    const updated = new URLSearchParams(params);
    if (next === DEFAULT_SETTINGS_TAB) updated.delete('tab'); else updated.set('tab', next);
    setParams(updated, { replace: true });
  };

  return (
    <Page
      title={t('page.title')}
      subtitle={t('page.subtitle')}
      maxWidth={1320}
      breadcrumbs={[{ label: t('page.breadcrumbDashboard'), href: '/' }, { label: t('page.title') }]}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '280px minmax(0, 1fr)' },
          gap: { xs: 2, md: 3 },
          alignItems: 'start',
        }}
      >
        <SettingsNav value={tab} onChange={changeTab} />
        <Box component="section" role="tabpanel" id={settingsPanelId(tab)} aria-labelledby={settingsTabId(tab)} sx={{ minWidth: 0 }}>
          <SectionHeader
            icon={SETTINGS_TAB_ICONS[tab]}
            title={t(`tabs.${tab}.label`)}
            description={t(`tabs.${tab}.description`)}
          />
          <Content />
        </Box>
      </Box>
    </Page>
  );
}
