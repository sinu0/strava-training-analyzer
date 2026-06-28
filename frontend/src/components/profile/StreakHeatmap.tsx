import { Box, Stack, Tooltip, Typography } from '@mui/material';

import { useStreakCalendar, useStreakStats } from '@/hooks/useStreak';

const LEVEL_COLORS = [
  'rgba(255,255,255,0.05)',
  '#14432A',
  '#1A6B3A',
  '#22A34A',
  '#3FB950',
];

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
const DAYS = ['Pn', '', 'Śr', '', 'Pt', '', 'Nd'];

export default function StreakHeatmap() {
  const currentYear = new Date().getFullYear();
  const { data: calendar } = useStreakCalendar(currentYear);
  const { data: stats } = useStreakStats();

  if (!calendar || !stats) return null;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="warning.main">{stats.currentStreak}</Typography>
          <Typography variant="caption" color="text.secondary">obecna seria</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={900} color="primary.main">{stats.longestStreak}</Typography>
          <Typography variant="caption" color="text.secondary">najdłuższa seria</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={900} color="success.main">{stats.totalActiveDays}</Typography>
          <Typography variant="caption" color="text.secondary">aktywnych dni</Typography>
        </Box>
      </Stack>

      <Box sx={{ overflowX: 'auto' }}>
        <svg width={calendar.weeks.length * 14 + 40} height={120}>
          {MONTHS.filter((_, i) => i % 3 === 0).map((m, i) => (
            <text key={m} x={40 + i * (calendar.weeks.length * 14 / 4)} y={12} fill="rgba(255,255,255,0.4)" fontSize={10}>
              {m}
            </text>
          ))}
          {DAYS.map((d, i) => (
            <text key={i} x={4} y={36 + i * 14} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="end">
              {d}
            </text>
          ))}
          {calendar.weeks.map((week, wi) =>
            week.days.map((day, di) => (
              <Tooltip key={`${wi}-${di}`} title={day.date} arrow>
                <rect
                  x={28 + wi * 14}
                  y={24 + di * 14}
                  width={12}
                  height={12}
                  rx={2}
                  fill={LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0]}
                />
              </Tooltip>
            ))
          )}
        </svg>
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">Mniej</Typography>
        {LEVEL_COLORS.slice(1).map((c, i) => (
          <Box key={i} sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: c }} />
        ))}
        <Typography variant="caption" color="text.secondary">Więcej</Typography>
      </Stack>
    </Box>
  );
}
