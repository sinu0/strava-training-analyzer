import BalanceIcon from '@mui/icons-material/BalanceOutlined';
import BiotechIcon from '@mui/icons-material/BiotechOutlined';
import BoltIcon from '@mui/icons-material/BoltOutlined';
import { Alert, Box, Typography } from '@mui/material';

import ChoiceCardGroup from '@/components/settings/ChoiceCardGroup';
import { aiCoachingStyleMessages } from '@/components/settings/messages';
import { useAiSettings, useUpdateAiSettings } from '@/hooks/useAi';
import type { AiCoachingStyle } from '@/types/ai';

import type { ReactNode } from 'react';

const OPTIONS: { value: AiCoachingStyle; icon: ReactNode }[] = [
  { value: 'BALANCED_ADVISOR', icon: <BalanceIcon /> },
  { value: 'CONSERVATIVE_SCIENTIST', icon: <BiotechIcon /> },
  { value: 'AGGRESSIVE_COACH', icon: <BoltIcon /> },
];

function isCoachingStyle(value: string | undefined): value is AiCoachingStyle {
  return OPTIONS.some((option) => option.value === value);
}

/** Default coaching persona for AI notes, predictions and answers; stored on the backend. */
export default function AiCoachingStyleSettings() {
  const t = aiCoachingStyleMessages.useT();
  const settings = useAiSettings();
  const update = useUpdateAiSettings();
  const saved = settings.data?.coachingStyle;
  const pending = update.isPending ? update.variables?.coachingStyle : undefined;
  const value = pending ?? (isCoachingStyle(saved) ? saved : null);

  return (
    <Box>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 780 }}>{t('title')}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {t('description')}
      </Typography>
      <ChoiceCardGroup
        value={value}
        columns={3}
        ariaLabel={t('ariaLabel')}
        disabled={settings.isLoading || settings.isError || update.isPending}
        options={OPTIONS.map((option) => ({
          value: option.value,
          label: t(`${option.value}.label`),
          description: t(`${option.value}.description`),
          icon: option.icon,
        }))}
        onChange={(coachingStyle) => {
          if (coachingStyle !== saved) update.mutate({ coachingStyle });
        }}
      />
      {!!update.isError && <Alert severity="error" sx={{ mt: 1.5 }}>{t('saveError')}</Alert>}
    </Box>
  );
}
