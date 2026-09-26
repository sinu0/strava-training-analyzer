import { Alert, Stack } from '@mui/material';

import LanguageSettings from '@/components/settings/LanguageSettings';
import MobileNavigationSettings from '@/components/settings/MobileNavigationSettings';
import ThemeModeSettings from '@/components/settings/ThemeModeSettings';
import { settingsMessages } from '@/features/settings/messages';
import { useSaveUiPreferences, useUiPreferences } from '@/hooks/useUiPreferences';
import { SkeletonCard, Surface } from '@/ui';

export default function GeneralTab() {
  const t = settingsMessages.useT();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();

  return (
    <Stack spacing={2.5}>
      <Surface><ThemeModeSettings /></Surface>
      <Surface><LanguageSettings /></Surface>
      <Surface>
        {preferences.data ? (
          <MobileNavigationSettings
            preferences={preferences.data}
            saving={savePreferences.isPending}
            onSave={async (next) => {
              await savePreferences.mutateAsync(next);
            }}
          />
        ) : preferences.isError ? (
          <Alert severity="warning">{t('general.shortcutsError')}</Alert>
        ) : (
          <SkeletonCard height={160} />
        )}
      </Surface>
    </Stack>
  );
}
