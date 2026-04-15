import InboxIcon from '@mui/icons-material/Inbox';
import { Box, Typography, Button } from '@mui/material';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  illustration?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Shows a centered empty state with an optional illustration or icon and call to action.
 * When `illustration` path is provided it takes precedence over the icon.
 */
export default function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 3,
        gap: 1.5,
        textAlign: 'center',
      }}
    >
      {illustration ? (
        <Box
          component="img"
          src={illustration}
          alt=""
          sx={{ width: 140, height: 140, objectFit: 'contain', opacity: 0.85, mb: 1 }}
        />
      ) : (
        <Box sx={{ color: 'text.secondary', opacity: 0.5, fontSize: 48, display: 'flex' }}>
          {icon ?? <InboxIcon fontSize="inherit" />}
        </Box>
      )}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {title}
      </Typography>
      {!!description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, opacity: 0.7 }}>
          {description}
        </Typography>
      )}
      {!!action && (
        <Button variant="outlined" size="small" onClick={action.onClick} sx={{ mt: 1 }}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
