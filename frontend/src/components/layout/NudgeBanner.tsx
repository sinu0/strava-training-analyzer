
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Alert, Box, IconButton, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNudges } from '@/hooks/useNudges';

export default function NudgeBanner() {
  const navigate = useNavigate();
  const { data: nudges } = useNudges();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!nudges || nudges.length === 0) return null;

  const visible = nudges.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack spacing={0.5}>
        {visible.map((nudge) => {
          const color = nudge.severity === 'warning' ? 'warning'
            : nudge.severity === 'success' ? 'success'
            : nudge.severity === 'error' ? 'error'
            : 'info';

          const icon = nudge.severity === 'warning' ? <WarningAmberIcon />
            : nudge.severity === 'success' ? <CheckCircleOutlineIcon />
            : <InfoOutlinedIcon />;

          return (
            <Alert
              key={nudge.id}
              severity={color}
              icon={icon}
              action={
                <IconButton size="small" onClick={() => setDismissed(new Set([...dismissed, nudge.id]))}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
              onClick={nudge.actionUrl ? () => navigate(nudge.actionUrl!) : undefined}
              sx={{
                cursor: nudge.actionUrl ? 'pointer' : 'default',
                borderRadius: 4,
                boxShadow: (t) => t.tokens.cardShadow,
                '& .MuiAlert-message': { flex: 1 },
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {nudge.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {nudge.message}
              </Typography>
            </Alert>
          );
        })}
      </Stack>
    </Box>
  );
}
