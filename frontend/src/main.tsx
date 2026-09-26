import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource-variable/manrope';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';
import { STALE_STANDARD } from '@/constants/queryConfig';
import { AppUiProvider } from '@/context/AppUiContext';
import { ThemeModeProvider } from '@/context/ThemeModeContext';
import { I18nProvider } from '@/i18n';
import '@/styles/animations.css';
import { registerPwa } from '@/pwa/registerPwa';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_STANDARD,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeModeProvider>
          <AppUiProvider>
            <CssBaseline />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppUiProvider>
        </ThemeModeProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

window.addEventListener('load', () => {
  void registerPwa();
});
