import { useTheme, type Theme } from '@mui/material/styles';

import { getAppThemeTokens, type AppThemeTokens } from '@/theme/theme';

/** Semantic colour roles shared by every `@/ui` component. */
export type Tone = 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export function useTokens(): AppThemeTokens {
  return getAppThemeTokens(useTheme());
}

/** Resolves a tone to the active mode's colour; `neutral` falls back to secondary text. */
export function toneColor(theme: Theme, tone: Tone = 'neutral'): string {
  if (tone === 'neutral') return theme.palette.text.secondary;
  return theme.palette[tone].main;
}
