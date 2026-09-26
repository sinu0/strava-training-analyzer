import { defineMessages } from '@/i18n';

export const languageSettingsMessages = defineMessages({
  pl: {
    title: 'Język / Language',
    description: 'Wybierz język interfejsu aplikacji.',
    ariaLabel: 'Język interfejsu',
    pl: {
      label: 'Polski',
      description: 'Interfejs w języku polskim',
    },
    en: {
      label: 'English',
      description: 'Interface in English',
    },
  },
  en: {
    title: 'Język / Language',
    description: 'Choose the app interface language.',
    ariaLabel: 'Interface language',
    pl: {
      label: 'Polski',
      description: 'Interface in Polish',
    },
    en: {
      label: 'English',
      description: 'Interface in English',
    },
  },
});

export const aiLanguageSettingsMessages = defineMessages({
  pl: {
    title: 'Język AI',
    description: 'W jakim języku AI pisze notatki do treningów, predykcje i odpowiedzi na pytania.',
    ariaLabel: 'Język tekstów generowanych przez AI',
    hint: 'Dotyczy nowo generowanych treści — istniejące notatki i predykcje zostają w dotychczasowym języku (odśwież je, aby wygenerować ponownie).',
    loadError: 'Nie udało się wczytać ustawień AI.',
    saveError: 'Nie udało się zapisać języka AI.',
    pl: {
      label: 'Polski',
      description: 'AI odpowiada po polsku',
    },
    en: {
      label: 'English',
      description: 'AI odpowiada po angielsku',
    },
  },
  en: {
    title: 'AI language',
    description: 'The language AI uses for workout notes, predictions and answers to your questions.',
    ariaLabel: 'Language of AI-generated text',
    hint: 'Applies to newly generated content — existing notes and predictions keep their language (refresh them to regenerate).',
    loadError: 'Could not load AI settings.',
    saveError: 'Could not save the AI language.',
    pl: {
      label: 'Polski',
      description: 'AI answers in Polish',
    },
    en: {
      label: 'English',
      description: 'AI answers in English',
    },
  },
});

export const aiCoachingStyleMessages = defineMessages({
  pl: {
    title: 'Styl coachingu AI',
    description: 'Jak AI formułuje zalecenia: ton, poziom ostrożności i nacisk na progres.',
    ariaLabel: 'Styl coachingu AI',
    saveError: 'Nie udało się zapisać stylu coachingu.',
    BALANCED_ADVISOR: { label: 'Zrównoważony', description: 'Dane i samopoczucie po równo, bezpieczny progres' },
    CONSERVATIVE_SCIENTIST: { label: 'Ostrożny naukowiec', description: 'Precyzyjnie, zachowawczo, z naciskiem na regenerację' },
    AGGRESSIVE_COACH: { label: 'Wymagający trener', description: 'Motywuje i dociska, gdy dane na to pozwalają' },
  },
  en: {
    title: 'AI coaching style',
    description: 'How AI phrases its advice: tone, caution and emphasis on progression.',
    ariaLabel: 'AI coaching style',
    saveError: 'Could not save the coaching style.',
    BALANCED_ADVISOR: { label: 'Balanced', description: 'Data and how you feel weighed equally, safe progression' },
    CONSERVATIVE_SCIENTIST: { label: 'Cautious scientist', description: 'Precise, conservative, recovery first' },
    AGGRESSIVE_COACH: { label: 'Demanding coach', description: 'Motivates and pushes when the data allows' },
  },
});
