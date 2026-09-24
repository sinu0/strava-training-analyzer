import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Alert, Box, Button, Typography } from '@mui/material';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

/**
 * Displays a shared error alert with an optional retry action.
 */
export default function ErrorState({
  title = 'Wystąpił błąd',
  message,
  retryLabel = 'Spróbuj ponownie',
  onRetry,
}: ErrorStateProps) {
  return (
    <Box sx={{ py: 4 }}>
      <Alert
        severity="error"
        icon={<WarningAmberIcon />}
        action={onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2">{message}</Typography>
      </Alert>
    </Box>
  );
}
