import { Box, Chip, Typography } from '@mui/material';

import { CATEGORY_LABELS, type WorkoutCategory } from '../../types/training';

import type { CalendarDay } from '../../types/training';

interface CalendarDayCellProps {
  day: CalendarDay | null;
  dateNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

function statusBorderColor(day: CalendarDay): string {
  if (day.planned?.status === 'COMPLETED') return 'success.main';
  if (day.planned?.status === 'SKIPPED') return 'error.main';
  if (day.planned?.status === 'PARTIAL') return 'warning.main';
  if (day.planned) return 'primary.main';
  return 'transparent';
}

export default function CalendarDayCell({ day, dateNum, isCurrentMonth, isToday, onClick }: CalendarDayCellProps) {
  const border = day ? statusBorderColor(day) : 'transparent';
  const hasBorder = border !== 'transparent';

  return (
    <Box
      onClick={onClick}
      sx={{
        minHeight: 90,
        p: 0.5,
        cursor: 'pointer',
        borderStyle: 'solid',
        borderWidth: hasBorder ? 2 : 1,
        borderColor: hasBorder ? border : 'divider',
        borderRadius: 1,
        opacity: isCurrentMonth ? 1 : 0.35,
        bgcolor: isToday ? 'action.hover' : 'background.paper',
        '&:hover': { bgcolor: 'action.hover' },
        overflow: 'hidden',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: isToday ? 700 : 400 }}>
        {dateNum}
      </Typography>

      {!!day?.planned && (
        <Chip
          label={`${categoryLabel(day.planned.plannedType)} ${day.planned.plannedTss ?? ''}`}
          size="small"
          sx={{ fontSize: '0.65rem', height: 20, mt: 0.25, maxWidth: '100%' }}
          color="warning"
        />
      )}

      {!!day?.actual && (
        <Typography variant="caption" display="block" noWrap sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.65rem' }}>
          {day.actual.name} {day.actual.tss != null ? `(${day.actual.tss} TSS)` : ''}
        </Typography>
      )}

      {day?.compliance != null && (
        <Typography variant="caption" sx={{ color: day.compliance >= 80 ? 'success.main' : 'warning.main', fontWeight: 600, fontSize: '0.65rem' }}>
          {day.compliance}%
        </Typography>
      )}
    </Box>
  );
}

function categoryLabel(type: string | null): string {
  if (!type) return '';
  return CATEGORY_LABELS[type as WorkoutCategory] ?? type;
}
