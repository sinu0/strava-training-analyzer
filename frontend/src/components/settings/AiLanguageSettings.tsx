import TranslateIcon from '@mui/icons-material/Translate';
import { Alert, Box, Typography } from '@mui/material';


import ChoiceCardGroup from '@/components/settings/ChoiceCardGroup';
import { aiLanguageSettingsMessages } from '@/components/settings/messages';
import { useAiSettings, useUpdateAiSettings } from '@/hooks/useAi';
import type { AiLanguage } from '@/types/ai';

const OPTIONS: AiLanguage[] = ['pl', 'en'];

function isAiLanguage(value: string | undefined): value is AiLanguage {
  return value === 'pl' || value === 'en';
}

/** Preferred language of AI-generated text (notes, predictions, answers); stored on the backend. */
export default function AiLanguageSettings() {
  const t = aiLanguageSettingsMessages.useT();
  const settings = useAiSettings();
  const update = useUpdateAiSettings();
  const saved = settings.data?.language;
  const pending = update.isPending ? update.variables?.language : undefined;
  const value = pending ?? (isAiLanguage(saved) ? saved : null);

  return (
    <Box>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 780 }}>{t('title')}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {t('description')}
      </Typography>
      <ChoiceCardGroup
        value={value}
        ariaLabel={t('ariaLabel')}
        disabled={settings.isLoading || settings.isError || update.isPending}
        options={OPTIONS.map((option) => ({
          value: option,
          label: t(`${option}.label`),
          description: t(`${option}.description`),
          icon: <TranslateIcon />,
        }))}
        onChange={(language) => {
          if (language !== saved) update.mutate({ language });
        }}
      />
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
        {t('hint')}
      </Typography>
      {!!settings.isError && <Alert severity="error" sx={{ mt: 1.5 }}>{t('loadError')}</Alert>}
      {!!update.isError && <Alert severity="error" sx={{ mt: 1.5 }}>{t('saveError')}</Alert>}
    </Box>
  );
}
