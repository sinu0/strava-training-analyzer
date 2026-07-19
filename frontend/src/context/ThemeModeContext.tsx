import { ThemeProvider } from '@mui/material/styles';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createAppTheme, type AppColorMode } from '@/theme/theme';

const STORAGE_KEY = 'strava-analizator.color-mode';

interface ThemeModeContextValue {
  mode: AppColorMode;
  setMode: (mode: AppColorMode) => void;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
const FALLBACK_THEME_MODE: ThemeModeContextValue = {
  mode: 'light',
  setMode: () => undefined,
  toggleMode: () => undefined,
};

function getInitialMode(): AppColorMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppColorMode>(getInitialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const setMode = useCallback((nextMode: AppColorMode) => {
    setModeState(nextMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // The visual preference remains usable in private or restricted browsers.
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
    document.documentElement.dataset.colorMode = mode;
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useColorMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  return context ?? FALLBACK_THEME_MODE;
}
