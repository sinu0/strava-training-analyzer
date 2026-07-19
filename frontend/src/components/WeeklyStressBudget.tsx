import { Box, Paper, Stack, Typography } from '@mui/material';

import { STATUS_COLORS } from '@/utils/colors';

interface WeekData {
  weekStart: string;
  totalTss: number;
}

interface WeeklyStressBudgetProps {
  weeks?: WeekData[];
  avgTss?: number;
}

export default function WeeklyStressBudget({ weeks = [], avgTss = 0 }: WeeklyStressBudgetProps) {
  if (weeks.length === 0) return null;

  const safeMax = avgTss * 1.3;
  const maxTss = Math.max(...weeks.map(w => w.totalTss), safeMax);

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
        Tygodniowy budżet stresu
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Porównanie tygodniowego TSS z bezpiecznym limitem (1.3× średnia z 4 tyg)
      </Typography>

      <Stack spacing={0.75}>
        {weeks.slice(-8).reverse().map((w) => {
          const pct = maxTss > 0 ? Math.min(100, (w.totalTss / maxTss) * 100) : 0;
          const overLimit = w.totalTss > safeMax && safeMax > 0;
          const color = overLimit ? STATUS_COLORS.error : STATUS_COLORS.warning;
          const date = new Date(w.weekStart);
          const label = date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });

          return (
            <Stack key={w.weekStart} direction="row" spacing={1.5} alignItems="center">
              <Typography variant="caption" sx={{ minWidth: 42, fontSize: '0.6rem', color: 'text.secondary' }}>
                {label}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: `${color}20`,
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0, top: 0, height: '100%',
                      width: `${pct}%`,
                      borderRadius: 6,
                      bgcolor: color,
                      minWidth: 4,
                      transition: 'width 0.3s ease',
                    }}
                  />
                  {safeMax > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: `${(safeMax / maxTss) * 100}%`,
                        top: -3, width: 1, height: 18, bgcolor: STATUS_COLORS.error,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </Box>
              </Box>
              <Typography variant="caption" sx={{
                fontWeight: 700, minWidth: 32, textAlign: 'right',
                color: overLimit ? STATUS_COLORS.error : 'text.primary',
                fontSize: '0.65rem',
              }}>
                {Math.round(w.totalTss)}
              </Typography>
            </Stack>
          );
        })}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontSize: '0.6rem' }}>
        Linia: bezpieczny limit = {Math.round(safeMax)} TSS · Średnia 4-tyg: {Math.round(avgTss)} TSS
      </Typography>
    </Paper>
  );
}
