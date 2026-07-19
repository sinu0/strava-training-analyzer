import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, Typography, Grid } from '@mui/material';
import { useState, useMemo } from 'react';

import CalendarDayCell from './CalendarDayCell';
import CalendarDayDialog from './CalendarDayDialog';
import TrainingProjectionChart from './TrainingProjectionChart';
import { useCalendarView } from '../../hooks/useTrainingPlan';
import LoadingState from '../common/LoadingState';

import type { CalendarDay } from '../../types/training';

const DAY_HEADERS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

function formatMonth(d: Date): string {
  return d.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
}

function monthRange(year: number, month: number) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  return { from: fmt(from), to: fmt(to) };
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function TrainingCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  const { from, to } = monthRange(year, month);
  const { data: days, isLoading } = useCalendarView(from, to);

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    days?.forEach((d) => map.set(d.date, d));
    return map;
  }, [days]);

  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  const prev = () => { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); };
  const next = () => { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); };
  const todayStr = fmt(today);

  if (isLoading) return <LoadingState message="Ładowanie kalendarza..." />;

  return (
    <Box>
      <TrainingProjectionChart days={days ?? []} />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={prev} size="small"><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" sx={{ mx: 2, textTransform: 'capitalize', minWidth: 180, textAlign: 'center' }}>
          {formatMonth(new Date(year, month))}
        </Typography>
        <IconButton onClick={next} size="small"><ChevronRightIcon /></IconButton>
      </Box>

      <Grid container columns={7} spacing={0.5} sx={{ mb: 1 }}>
        {DAY_HEADERS.map((h) => (
          <Grid key={h} size={1}>
            <Typography variant="caption" align="center" display="block" color="text.secondary" fontWeight={600}>
              {h}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {weeks.map((week) => (
        <Grid container columns={7} spacing={0.5} key={week[0]?.toISOString() ?? `${year}-${month}`} sx={{ mb: 0.5 }}>
          {week.map((d) => {
            const dateStr = fmt(d);
            const day = dayMap.get(dateStr) ?? null;
            return (
              <Grid size={1} key={dateStr}>
                <CalendarDayCell
                  day={day}
                  dateNum={d.getDate()}
                  isCurrentMonth={d.getMonth() === month}
                  isToday={dateStr === todayStr}
                  onClick={() => setSelected(day ?? { date: dateStr, planned: null, actual: null, compliance: null })}
                />
              </Grid>
            );
          })}
        </Grid>
      ))}

      <CalendarDayDialog day={selected} open={selected !== null} onClose={() => setSelected(null)} />
    </Box>
  );
}

function buildWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday=0
  const start = new Date(first);
  start.setDate(start.getDate() - startDay);

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    if (w === 5 && week[0]!.getMonth() !== month) break;
    weeks.push(week);
  }
  return weeks;
}
