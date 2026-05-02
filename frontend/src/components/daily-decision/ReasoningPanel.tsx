import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import type { DecisionReason } from '@/types/dailyDecision';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';

interface Props {
  reasons: DecisionReason[];
}

const PRIORITY_COLORS: Record<string, string> = {
  SAFETY: STATUS_COLORS.error,
  ADAPTATION: STATUS_COLORS.warning,
  PLAN: STATUS_COLORS.info,
  CONTEXT: STATUS_COLORS.neutral,
};

export default function ReasoningPanel({ reasons }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!reasons.length) return null;

  return (
    <Paper
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        p: { xs: 1.75, md: 2.5 },
        background: `linear-gradient(180deg, ${alphaColor(STATUS_COLORS.accent, 0.04)}, transparent)`,
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          onClick={() => setExpanded(!expanded)}
          sx={{ cursor: 'pointer' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <PsychologyIcon sx={{ color: STATUS_COLORS.accent, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Dlaczego ta decyzja?
            </Typography>
          </Stack>
          <IconButton size="small">
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Stack>

        <Collapse in={expanded}>
          <Stack spacing={1}>
            {reasons.map((reason, i) => {
              const priorityColor = PRIORITY_COLORS[reason.priority] ?? STATUS_COLORS.neutral;
              return (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alphaColor(priorityColor, 0.15)}`,
                    bgcolor: alphaColor(priorityColor, 0.04),
                    borderLeft: `3px solid ${priorityColor}`,
                  }}
                >
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={reason.priority}
                        sx={{
                          bgcolor: alphaColor(priorityColor, 0.15),
                          color: priorityColor,
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                      <Chip
                        size="small"
                        label={reason.signal}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {reason.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                    >
                      {reason.evidence}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
