import TranslateIcon from '@mui/icons-material/Translate';
import { Box, Typography } from '@mui/material';


import ChoiceCardGroup from '@/components/settings/ChoiceCardGroup';
import { languageSettingsMessages } from '@/components/settings/messages';
import type { Language } from '@/i18n';
import { useI18n } from '@/i18n';

const OPTIONS: Language[] = ['pl', 'en'];

/** Lets people switch the interface language from Settings. */
export default function LanguageSettings() {
  const { language, setLanguage } = useI18n();
  const t = languageSettingsMessages.useT();

  return (
    <Box>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 780 }}>{t('title')}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {t('description')}
      </Typography>
      <ChoiceCardGroup
        value={language}
        ariaLabel={t('ariaLabel')}
        options={OPTIONS.map((option) => ({
          value: option,
          label: t(`${option}.label`),
          description: t(`${option}.description`),
          icon: <TranslateIcon />,
        }))}
        onChange={setLanguage}
      />
    </Box>
  );
}
