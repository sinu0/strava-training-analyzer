import { Box, Typography, Button } from '@mui/material';
import React from 'react';

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
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 3, textAlign: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/illustrations/error-500.png"
            alt=""
            sx={{ width: 160, height: 160, objectFit: 'contain', opacity: 0.9 }}
          />
          <Typography variant="h6">Wystąpił nieoczekiwany błąd</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            {this.state.error?.message ?? 'Coś poszło nie tak. Spróbuj odświeżyć stronę.'}
          </Typography>
          <Button variant="outlined" size="small" onClick={this.handleReload} sx={{ mt: 1 }}>
            Odśwież stronę
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
