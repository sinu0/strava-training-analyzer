import { Box, Tab, Tabs, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { settingsMessages } from '@/features/settings/messages';
import { SETTINGS_TAB_ICONS, SETTINGS_TABS, type SettingsTab } from '@/features/settings/settingsTabs';
import { Surface } from '@/ui';

interface SettingsNavProps {
  value: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

export const settingsTabId = (tab: SettingsTab) => `settings-tab-${tab}`;
export const settingsPanelId = (tab: SettingsTab) => `settings-panel-${tab}`;

/** Vertical section list on desktop, scrollable tab strip on phones. */
export default function SettingsNav({ value, onChange }: SettingsNavProps) {
  const t = settingsMessages.useT();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Surface padding="none" sx={{ position: { md: 'sticky' }, top: { md: 88 }, overflow: 'hidden' }}>
      <Tabs
        value={value}
        onChange={(_event, next: SettingsTab) => onChange(next)}
        orientation={desktop ? 'vertical' : 'horizontal'}
        variant="scrollable"
        scrollButtons={desktop ? false : 'auto'}
        allowScrollButtonsMobile
        aria-label={t('page.navAriaLabel')}
        sx={{
          py: { md: 1 },
          '& .MuiTabs-indicator': desktop ? { left: 0, right: 'auto', width: 3, borderRadius: '0 3px 3px 0' } : {},
          '& .MuiTab-root': desktop
            ? { alignItems: 'flex-start', justifyContent: 'flex-start', textAlign: 'left', minHeight: 56, px: 2.25, py: 1.1, maxWidth: 'none' }
            : { minHeight: 48 },
        }}
      >
        {SETTINGS_TABS.map((tab) => (
          <Tab
            key={tab}
            value={tab}
            id={settingsTabId(tab)}
            aria-controls={settingsPanelId(tab)}
            icon={SETTINGS_TAB_ICONS[tab]}
            iconPosition="start"
            label={
              desktop ? (
                <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                  <Typography component="span" variant="body2" sx={{ display: 'block', fontWeight: 700, textTransform: 'none' }}>
                    {t(`tabs.${tab}.label`)}
                  </Typography>
                  <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'none' }}>
                    {t(`tabs.${tab}.description`)}
                  </Typography>
                </Box>
              ) : (
                t(`tabs.${tab}.label`)
              )
            }
            aria-label={t(`tabs.${tab}.label`)}
          />
        ))}
      </Tabs>
    </Surface>
  );
}
