import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import type { AlternativeOption } from '@/types/dailyDecision';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';

interface Props {
  alternatives: AlternativeOption[];
  onSelect?: (index: number) => void;
}

export default function AlternativesPanel({ alternatives, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!alternatives.length) return null;

  return (
    <Paper
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        p: { xs: 1.75, md: 2.5 },
        background: `linear-gradient(180deg, ${alphaColor(STATUS_COLORS.info, 0.04)}, transparent)`,
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
            <CompareArrowsIcon sx={{ color: STATUS_COLORS.info, fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Alternatywy ({alternatives.length})
            </Typography>
          </Stack>
          <IconButton size="small">
            <CompareArrowsIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                fontSize: 18,
              }}
            />
          </IconButton>
        </Stack>

        <Collapse in={expanded}>
          <Stack spacing={1.5}>
            {alternatives.map((alt, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.75,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alphaColor(STATUS_COLORS.accent, 0.03),
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {alt.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${alt.workout.durationMin} min`}
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {alt.workout.description}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {alt.rationale}
                  </Typography>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      size="small"
                      label={`TSS ${alt.workout.targetTss}`}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={alt.workout.difficulty}
                      variant="outlined"
                    />
                    {alt.workout.indoor && (
                      <Chip
                        size="small"
                        label="Trenażer"
                        variant="outlined"
                        color="info"
                      />
                    )}
                  </Stack>

                  {onSelect && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSelect(i)}
                    >
                      Wybierz tę opcję
                    </Button>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
