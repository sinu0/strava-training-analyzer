import { Box, CircularProgress, Typography } from '@mui/material';

import IconBubble from '../IconBubble';

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
      <IconBubble size="lg" decorative={false}>
        <CircularProgress color="primary" size={28} thickness={4} aria-label={message} />
      </IconBubble>
      <Typography variant="body2" sx={{
        color: "text.secondary"
      }}>
        {message}
      </Typography>
    </Box>
  );
}
