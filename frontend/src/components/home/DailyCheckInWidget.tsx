import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import type { ReadinessData, SaveReadinessCheckInInput } from '@/types/analytics';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';

const CHECK_IN_OPTIONS = [1, 2, 3, 4, 5] as const;

const LABELS: Record<keyof SaveReadinessCheckInInput, { label: string; hint: string }> = {
  sleepQuality: { label: 'Sen', hint: '1–5' },
  legFreshness: { label: 'Nogi', hint: '1–5' },
  motivation: { label: 'Motywacja', hint: '1–5' },
  soreness: { label: 'Obolałość', hint: '1–5' },
};

function getInitialCheckIn(data: ReadinessData | undefined): SaveReadinessCheckInInput {
  if (!data?.checkIn) {
    return { sleepQuality: 3, legFreshness: 3, motivation: 3, soreness: 3 };
  }
  return {
    sleepQuality: data.checkIn.sleepQuality,
    legFreshness: data.checkIn.legFreshness,
    motivation: data.checkIn.motivation,
    soreness: data.checkIn.soreness,
  };
}

function formatUpdatedAt(updatedAt?: string | null): string | null {
  if (!updatedAt) return null;
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(updatedAt));
}

interface DailyCheckInWidgetProps {
  readiness: ReadinessData | undefined;
  onSave: (payload: SaveReadinessCheckInInput) => void;
  isSaving?: boolean;
}

export default function DailyCheckInWidget({ readiness, onSave, isSaving = false }: DailyCheckInWidgetProps) {
  const [draft, setDraft] = useState<SaveReadinessCheckInInput>(getInitialCheckIn(readiness));

  useEffect(() => {
    setDraft(getInitialCheckIn(readiness));
  }, [readiness]);

  const updatedAt = formatUpdatedAt(readiness?.checkIn?.updatedAt);
  const hasCheckIn = !!readiness?.checkIn;

  return (
    <Paper
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: hasCheckIn ? alphaColor(STATUS_COLORS.success, 0.25) : 'divider',
        boxShadow: (theme: { tokens?: { cardShadow?: string } }) => theme.tokens?.cardShadow ?? 'none',
        overflow: 'hidden',
        position: 'relative',
        p: 1.5,
        bgcolor: hasCheckIn ? alphaColor(STATUS_COLORS.success, 0.04) : 'background.paper',
      }}
    >
      <Stack spacing={1.25}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              fontWeight: 800,
              fontSize: '0.7rem',
              color: hasCheckIn ? STATUS_COLORS.success : 'text.secondary',
            }}
          >
            {hasCheckIn ? 'Dzisiejszy check-in' : 'Poranny check-in'}
          </Typography>
          {hasCheckIn && (
            <CheckCircleOutlineIcon sx={{ color: STATUS_COLORS.success, fontSize: 16 }} />
          )}
        </Box>

        {updatedAt && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', mt: -0.5 }}>
            Ostatni: {updatedAt}
          </Typography>
        )}

        <Stack spacing={0.75}>
          {(Object.keys(LABELS) as Array<keyof SaveReadinessCheckInInput>).map((key) => {
            const { label, hint } = LABELS[key];
            return (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, fontSize: '0.75rem', width: 64, flexShrink: 0 }}
                >
                  {label}
                </Typography>
                <Stack direction="row" spacing={0.4} sx={{ flex: 1 }}>
                  {CHECK_IN_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      size="small"
                      variant={draft[key] === option ? 'contained' : 'outlined'}
                      onClick={() => setDraft((current) => ({ ...current, [key]: option }))}
                      sx={{
                        minWidth: 0,
                        flex: 1,
                        px: 0,
                        py: 0.2,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: 1,
                        ...(draft[key] === option && {
                          bgcolor: `${STATUS_COLORS.success} !important`,
                          color: '#fff !important',
                          borderColor: `${STATUS_COLORS.success} !important`,
                        }),
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ width: 22, textAlign: 'right', fontSize: '0.68rem' }}>
                  {hint}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <Button
          variant="contained"
          size="small"
          onClick={() => onSave(draft)}
          disabled={isSaving}
          sx={{
            mt: 0.25,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: STATUS_COLORS.success,
            '&:hover': { bgcolor: STATUS_COLORS.successLight },
          }}
        >
          {isSaving ? 'Zapisywanie…' : hasCheckIn ? 'Aktualizuj check-in' : 'Zapisz check-in'}
        </Button>
      </Stack>
    </Paper>
  );
}
