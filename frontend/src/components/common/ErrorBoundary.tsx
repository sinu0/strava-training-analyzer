import { Box, Typography, Button } from '@mui/material';
import React from 'react';

import { createCoreTranslator } from '@/i18n';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

/**
 * Catches rendering errors in its subtree and offers a reload-based recovery path.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    // optionally reload the page to recover
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Class component: read the language directly; the fallback renders once per error.
      const t = createCoreTranslator();
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 3, textAlign: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/illustrations/error-500.png"
            alt=""
            sx={{ width: 160, height: 160, objectFit: 'contain', opacity: 0.9 }}
          />
          <Typography variant="h6">{t('common.unexpectedError')}</Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              maxWidth: 400
            }}>
            {this.state.error?.message ?? t('common.somethingWentWrong')}
          </Typography>
          <Button variant="outlined" size="small" onClick={this.handleReload} sx={{ mt: 1 }}>
            {t('common.reloadPage')}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
