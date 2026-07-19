import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingStateProps {
  message?: string;
}

/**
 * Displays a centered loading indicator with an optional status message.
 * The spinner sits inside a soft iconBubble circle matching the dashboard style.
 */
export default function LoadingState({ message = 'Ładowanie...' }: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => theme.tokens?.iconBubble ?? 'action.hover',
        }}
      >
        <CircularProgress color="primary" size={28} thickness={4} />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
