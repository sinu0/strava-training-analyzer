import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import apiClient from '@/api/client';
import type { WeeklyBrief } from '@/types/fatigue';
import { STATUS_COLORS } from '@/utils/colors';

export default function WeeklyBriefPanel() {
  const { data } = useQuery<WeeklyBrief>({
    queryKey: ['weeklyBrief'],
    queryFn: async () => { const r = await apiClient.get<WeeklyBrief>('/analytics/weekly-brief'); return r.data; },
    staleTime: 30000,
  });
  if (!data) return null;

  const volPct = data.avg4WeekTss > 0 ? ((data.weeklyTss - data.avg4WeekTss) / data.avg4WeekTss * 100) : 0;
  const fatigueDelta = data.fatigueScore - data.fatigueLastWeek;
  const statusColor = data.status === 'PRODUCTIVE' ? STATUS_COLORS.success :
    data.status === 'OVERREACHING' ? STATUS_COLORS.warning : STATUS_COLORS.info;

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Raport tygodnia</Typography>
          <Chip label={data.status === 'PRODUCTIVE' ? 'PRODUCTIVE' : data.status === 'OVERREACHING' ? 'OVERREACHING' : 'MAINTAINING'} size="small" sx={{ fontWeight: 800, fontSize: '0.6rem', bgcolor: `${statusColor}18`, color: statusColor }} />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
          <MetricBox label="Wolumen" value={`${data.weeklyHours}h / ${Math.round(data.weeklyTss)} TSS`} sub={`śr. 4tyg: ${data.avg4WeekHours}h · ${volPct > 0 ? '+' : ''}${Math.round(volPct)}%`} />
          <MetricBox label="Zmęczenie" value={`${data.fatigueScore}/100`} sub={`${fatigueDelta > 0 ? '↑' : '↓'} ${Math.abs(fatigueDelta)} pkt · ${data.fatigueTrend}`} color={data.fatigueScore > 70 ? STATUS_COLORS.error : STATUS_COLORS.info} />
          <MetricBox label="EF trend" value={data.efTrend > 0 ? `+${data.efTrend.toFixed(2)}` : data.efTrend.toFixed(2)} sub="wydajność tlenowa" color={data.efTrend > 0 ? STATUS_COLORS.success : STATUS_COLORS.warning} />
        </Stack>

        {!!data.eventName && (
          <Box sx={{ py: 1, px: 1.5, borderRadius: 2, bgcolor: `${STATUS_COLORS.info}0C`, border: `1px solid ${STATUS_COLORS.info}20` }}>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{data.eventName}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>{data.daysToEvent} dni</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: STATUS_COLORS.info }}>
                  Proj. CTL: {data.projectedCtl.toFixed(0)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        <Box sx={{ pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: statusColor, display: 'block' }}>
            Focus na ten tydzień: {data.suggestedFocus}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Balans: Low {data.loadFocusLowPct.toFixed(0)}% · High {data.loadFocusHighPct.toFixed(0)}% · Anaerobic {data.loadFocusAnaerobicPct.toFixed(0)}%
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <Box sx={{ flex: 1, p: 1.25, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 800, color: color ?? 'text.primary' }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>{sub}</Typography>
    </Box>
  );
}
