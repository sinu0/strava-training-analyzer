import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import {
  Box, Chip, FormControl, MenuItem, Paper, Select, Stack, Typography,
} from '@mui/material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { SessionSuggestion } from '@/types/fatigue';
import { STATUS_COLORS } from '@/utils/colors';

async function fetchSuggestions(minutes: number): Promise<SessionSuggestion[]> {
  const { data } = await apiClient.get<SessionSuggestion[]>('/fatigue-energy/suggest', { params: { minutes } });
  return data;
}

export default function SessionOptimizerWidget() {
  const [minutes, setMinutes] = useState(45);
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['sessionSuggest', minutes],
    queryFn: () => fetchSuggestions(minutes),
    staleTime: 30000,
  });

  if (isLoading || !suggestions || suggestions.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 1.75,
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,0.08)',
        bgcolor: 'rgba(255,255,255,0.02)',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.06em', fontSize: '0.6rem' }}>
            Optymalna sesja
          </Typography>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <Select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              sx={{ fontSize: '0.7rem', height: 28 }}
            >
              {[30, 45, 60, 75, 90, 120].map((m) => (
                <MenuItem key={m} value={m} sx={{ fontSize: '0.7rem' }}>{m} min</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {suggestions.map((s, idx) => {
          const color = idx === 0 ? STATUS_COLORS.warning : 'text.secondary';
          return (
            <Box
              key={s.type}
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: idx === 0 ? `${STATUS_COLORS.warning}10` : 'transparent',
                border: idx === 0 ? `1px solid ${STATUS_COLORS.warning}30` : '1px solid transparent',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {idx === 0 ? (
                    <StarIcon sx={{ color: STATUS_COLORS.warning, fontSize: 14 }} />
                  ) : (
                    <StarBorderIcon sx={{ color: 'text.disabled', fontSize: 14 }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 700, color, fontSize: '0.65rem' }}>
                    {s.label}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75}>
                  <Chip label={`TSS ${s.estimatedTss}`} size="small" sx={{ fontWeight: 700, fontSize: '0.6rem', height: 18 }} />
                  <Chip label={`IF ${s.estimatedIf}`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                </Stack>
              </Stack>
              {idx === 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.58rem', display: 'block', mt: 0.5, lineHeight: 1.3 }}>
                    {s.structure}
                  </Typography>
                  <Typography variant="caption" sx={{ color: STATUS_COLORS.warning, fontSize: '0.58rem', display: 'block', mt: 0.25 }}>
                    {s.rationale} · {s.impact}
                  </Typography>
                </>
              )}
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
