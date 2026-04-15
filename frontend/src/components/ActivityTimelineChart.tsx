import { Box, Typography } from '@mui/material';

import { useActivitiesTimeline } from '../hooks/useActivities';
import { COMMON_COLORS, STATUS_COLORS, alphaColor } from '../utils/colors';

const PL_MONTHS_SHORT = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

interface ActivityTimelineChartProps {
  currentYear: number;
  currentMonth: number;
  onMonthClick: (year: number, month: number) => void;
}

export default function ActivityTimelineChart({ currentYear, currentMonth, onMonthClick }: ActivityTimelineChartProps) {
  const { data: timeline } = useActivitiesTimeline();
  const entries = timeline ?? [];
  const maxCount = Math.max(1, ...entries.map(e => e.count));

  if (entries.length === 0) {
    return <Box sx={{ height: 72, mb: 1 }} />;
  }

  // Use a responsive grid so the timeline adapts to container width and doesn't produce a horizontal scrollbar.
  const gridTemplate = `repeat(${entries.length}, minmax(0, 1fr))`;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        alignItems: 'end',
        gap: '6px',
        overflow: 'hidden',
        width: '100%',
        height: 72,
        mb: 1,
      }}
    >
      {entries.map((entry, i) => {
        const isCurrent = entry.year === currentYear && entry.month === currentMonth;
        // slightly larger minimum so differences are visible
        const barH = Math.max(6, Math.round((entry.count / maxCount) * 44));
        const isFirstOfYear = entry.month === 1 || i === 0;

        return (
          <Box
            key={`${entry.year}-${entry.month}`}
            onClick={() => onMonthClick(entry.year, entry.month)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              width: '100%',
              height: '100%',
              justifyContent: 'flex-end',
              pb: '18px',
            }}
          >
            <Box
              sx={{
                width: '60%',
                height: barH,
                borderRadius: '6px 6px 0 0',
                bgcolor: isCurrent ? STATUS_COLORS.accent : alphaColor(STATUS_COLORS.accent, 0.28),
                transition: 'background-color 0.18s, transform 0.18s',
                '&:hover': {
                  transform: 'scale(1.06)',
                  bgcolor: isCurrent ? STATUS_COLORS.accent : alphaColor(STATUS_COLORS.accent, 0.52),
                },
              }}
            />

            <Box sx={{ textAlign: 'center', width: '100%', position: 'relative', bottom: 0 }}>
              {!!isFirstOfYear && (
                <Typography sx={{ fontSize: '0.52rem', color: alphaColor(COMMON_COLORS.white, 0.3), lineHeight: 1, display: 'block' }}>
                  {entry.year}
                </Typography>
              )}
              <Typography sx={{
                fontSize: '0.62rem',
                color: isCurrent ? STATUS_COLORS.accent : alphaColor(COMMON_COLORS.white, 0.38),
                fontWeight: isCurrent ? 700 : 400,
                lineHeight: 1,
              }}>
                {PL_MONTHS_SHORT[entry.month - 1]}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
