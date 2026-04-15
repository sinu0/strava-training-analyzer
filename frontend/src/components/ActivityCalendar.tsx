import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, IconButton, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ActivityTimelineChart from '@/components/ActivityTimelineChart';
import LoadingState from '@/components/common/LoadingState';
import { useActivities } from '@/hooks/useActivities';
import { useWeeklySummaries } from '@/hooks/useAnalytics';
import type { ActivitySummary } from '@/types/activity';
import type { WeeklySummary } from '@/types/analytics';
import type { MetricKey } from '@/types/metrics';
import {
  COMMON_COLORS,
  STATUS_COLORS,
  alphaColor,
  getSportColor,
} from '@/utils/colors';

interface ActivityCalendarProps {
  year: number;
  month: number;
  metricKey: MetricKey;
  onMonthChange: (year: number, month: number) => void;
  onActivityClick: (id: string) => void;
}

interface MonthMetricValues {
  distance: number;
  time: number;
  power: number;
  hr: number;
  minDistance: number;
  minTime: number;
  minPower: number;
  minHr: number;
}

const CALENDAR_COLUMNS = {
  xs: 'repeat(7, minmax(0, 1fr))',
  md: 'repeat(7, minmax(0, 1fr)) minmax(90px, 130px)',
} as const;

const PL_DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const PL_MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

function getMetricValue(activity: ActivitySummary, metricKey: MetricKey): number {
  switch (metricKey) {
    case 'distance':
      return activity.distanceM || 0;
    case 'time':
      return activity.movingTimeSec || 0;
    case 'power':
      return activity.avgPowerW || 0;
    case 'hr':
      return activity.avgHeartrate || 0;
  }
}

function getMetricLabel(activity: ActivitySummary, metricKey: MetricKey): string {
  switch (metricKey) {
    case 'distance':
      if (!activity.distanceM) {
        return '';
      }
      return activity.distanceM >= 1000
        ? `${(activity.distanceM / 1000).toFixed(0)}km`
        : `${Math.round(activity.distanceM)}m`;
    case 'time': {
      if (!activity.movingTimeSec) {
        return '';
      }
      const hours = Math.floor(activity.movingTimeSec / 3600);
      const minutes = Math.floor((activity.movingTimeSec % 3600) / 60);
      return hours > 0 ? `${hours}h${minutes}'` : `${minutes}'`;
    }
    case 'power':
      return activity.avgPowerW ? `${activity.avgPowerW}W` : '';
    case 'hr':
      return activity.avgHeartrate ? `${activity.avgHeartrate}♥` : '';
  }
}

function getMinimumMetricValue(monthMetrics: MonthMetricValues, metricKey: MetricKey): number {
  switch (metricKey) {
    case 'distance':
      return monthMetrics.minDistance;
    case 'time':
      return monthMetrics.minTime;
    case 'power':
      return monthMetrics.minPower;
    case 'hr':
      return monthMetrics.minHr;
  }
}

function adjustMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function getISOWeekNumber(date: Date): number {
  const weekDate = new Date(date);
  weekDate.setHours(0, 0, 0, 0);
  weekDate.setDate(weekDate.getDate() + 3 - ((weekDate.getDay() + 6) % 7));
  const week1 = new Date(weekDate.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((weekDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  );
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekMonday(year: number, month: number, weekDays: (number | null)[]): string | null {
  for (const day of weekDays) {
    if (day == null) {
      continue;
    }

    const date = new Date(year, month - 1, day);
    const dayOfWeek = (date.getDay() + 6) % 7;
    const monday = new Date(date);
    monday.setDate(date.getDate() - dayOfWeek);
    return toLocalDateString(monday);
  }

  return null;
}

function computeWeekStats(week: (number | null)[], activitiesByDay: Map<number, ActivitySummary[]>) {
  let totalTime = 0;
  let totalDistance = 0;
  let count = 0;

  for (const day of week) {
    if (day == null) {
      continue;
    }

    for (const activity of activitiesByDay.get(day) ?? []) {
      totalTime += activity.movingTimeSec || 0;
      totalDistance += activity.distanceM || 0;
      count += 1;
    }
  }

  return { totalTime, totalDistance, count };
}

function formatHoursAndMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function buildWeeks(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7;
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = new Array(startOffset).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function ActivityCalendarMonthHeader({
  canGoForward,
  month,
  onNextMonth,
  onPreviousMonth,
  year,
}: {
  canGoForward: boolean;
  month: number;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  year: number;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
      <IconButton size="small" onClick={onPreviousMonth}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="h6" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: '1rem' }}>
        {PL_MONTHS[month - 1]} {year}
      </Typography>
      <IconButton size="small" onClick={onNextMonth} disabled={!canGoForward}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}

function ActivityCalendarWeekdaysHeader() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: CALENDAR_COLUMNS, gap: 0.5, mb: 0.5 }}>
      {PL_DAYS.map((day) => (
        <Typography
          key={day}
          sx={{ textAlign: 'center', fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600, py: 0.5 }}
        >
          {day}
        </Typography>
      ))}
      <Typography
        sx={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'text.disabled',
          fontWeight: 600,
          py: 0.5,
          pl: 1,
          display: { xs: 'none', md: 'block' },
        }}
      >
        Podsumowanie
      </Typography>
    </Box>
  );
}

function ActivityCalendarWeekSummaryCell({
  activitiesByDay,
  month,
  week,
  weeklySummaries,
  year,
}: {
  activitiesByDay: Map<number, ActivitySummary[]>;
  month: number;
  week: (number | null)[];
  weeklySummaries: WeeklySummary[] | undefined;
  year: number;
}) {
  const { totalTime, totalDistance, count } = computeWeekStats(week, activitiesByDay);
  const monday = getWeekMonday(year, month, week);
  const matchedSummary = weeklySummaries?.find((summary) => summary.weekStart === monday);
  const tss = matchedSummary?.totalTss ?? null;

  const weekNumber = week.reduce<number | null>((result, day) => {
    if (result != null || day == null) {
      return result;
    }

    return getISOWeekNumber(new Date(year, month - 1, day));
  }, null);

  return (
    <Box
      sx={{
        minHeight: 90,
        borderLeft: `1px solid ${alphaColor(COMMON_COLORS.white, 0.06)}`,
        bgcolor: alphaColor(COMMON_COLORS.white, 0.015),
        p: '8px 8px 4px 8px',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {weekNumber != null && (
        <Typography sx={{ fontSize: '0.65rem', color: alphaColor(COMMON_COLORS.white, 0.3), lineHeight: 1, mb: 0.5 }}>
          Tydz.&nbsp;{weekNumber}
        </Typography>
      )}
      {count === 0 ? (
        <Typography sx={{ fontSize: '0.65rem', color: alphaColor(COMMON_COLORS.white, 0.2), fontStyle: 'italic' }}>
          Brak aktywności
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Typography sx={{ fontSize: '0.7rem', color: alphaColor(COMMON_COLORS.white, 0.75), fontWeight: 600 }}>
            {formatHoursAndMinutes(totalTime)}
          </Typography>
          {totalDistance > 0 && (
            <Typography sx={{ fontSize: '0.7rem', color: alphaColor(COMMON_COLORS.white, 0.6) }}>
              {(totalDistance / 1000).toFixed(1)}&nbsp;km
            </Typography>
          )}
          <Typography sx={{ fontSize: '0.7rem', color: alphaColor(COMMON_COLORS.white, 0.45) }}>
            {tss != null ? `${Math.round(tss)} TSS` : '— TSS'}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: alphaColor(COMMON_COLORS.white, 0.3) }}>
            {count}&nbsp;{count === 1 ? 'aktywność' : 'aktywności'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function ActivityCalendarDayCell({
  activities,
  day,
  dayIndex,
  metricKey,
  monthMetrics,
  onActivityClick,
  todayDay,
}: {
  activities: ActivitySummary[];
  day: number | null;
  dayIndex: number;
  metricKey: MetricKey;
  monthMetrics: MonthMetricValues;
  onActivityClick: (id: string) => void;
  todayDay: number;
}) {
  const isToday = day === todayDay;
  const hasActivities = activities.length > 0;
  const isWeekend = dayIndex >= 5;

  return (
    <Box
      sx={{
        minHeight: 90,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: isToday
          ? alphaColor(STATUS_COLORS.accent, 0.45)
          : hasActivities
            ? alphaColor(COMMON_COLORS.white, 0.09)
            : alphaColor(COMMON_COLORS.white, 0.04),
        bgcolor: isToday
          ? alphaColor(STATUS_COLORS.accent, 0.05)
          : hasActivities
            ? alphaColor(COMMON_COLORS.white, 0.02)
            : 'transparent',
        p: 0.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {day != null && (
        <>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: isToday ? 700 : 400,
              color: isToday
                ? STATUS_COLORS.accent
                : isWeekend
                  ? alphaColor(COMMON_COLORS.white, 0.4)
                  : hasActivities
                    ? 'text.primary'
                    : 'text.disabled',
              lineHeight: 1,
              mb: 0.5,
              alignSelf: 'flex-start',
            }}
          >
            {day}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.4, width: '100%', flex: 1 }}>
            {activities.slice(0, 3).map((activity, index) => {
              const color = getSportColor(activity.sportType);
              const label = getMetricLabel(activity, metricKey);
              const value = getMetricValue(activity, metricKey);
              const minimumMetricValue = getMinimumMetricValue(monthMetrics, metricKey);
              const range = monthMetrics[metricKey] - minimumMetricValue;
              const ratio = range > 0 ? Math.max(0.15, (value - minimumMetricValue) / range) : 0.15;
              const visibleActivities = Math.min(activities.length, 3);
              const maxSize = visibleActivities === 1 ? 62 : visibleActivities === 2 ? 40 : 28;
              const minSize = visibleActivities === 1 ? 26 : visibleActivities === 2 ? 18 : 14;
              const dotSize = Math.round(minSize + ratio * (maxSize - minSize));
              const fontSize = dotSize > 52 ? '0.82rem' : dotSize > 40 ? '0.72rem' : dotSize > 30 ? '0.6rem' : '0.5rem';

              return (
                <Box
                  key={`${activity.id}-${index}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onActivityClick(activity.id);
                  }}
                  sx={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: '50%',
                    bgcolor: `${color}18`,
                    border: `2px solid ${color}70`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    boxShadow: `0 2px 12px ${color}28`,
                    transition: 'transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease, border-color 0.22s ease',
                    '&:hover': {
                      transform: 'scale(1.45)',
                      zIndex: 10,
                      position: 'relative',
                      bgcolor: `${color}22`,
                      borderColor: `${color}90`,
                      boxShadow: `0 8px 24px ${color}35`,
                    },
                  }}
                >
                  {dotSize > 18 && !!label && (
                    <Typography
                      sx={{
                        fontSize,
                        fontWeight: 700,
                        lineHeight: 1.1,
                        color,
                        textAlign: 'center',
                        px: '2px',
                        overflow: 'hidden',
                        maxWidth: dotSize - 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
          {activities.length > 3 && (
            <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled', mt: 0.25 }}>
              +{activities.length - 3}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

function ActivityCalendarWeekRow({
  activitiesByDay,
  metricKey,
  month,
  monthMetrics,
  onActivityClick,
  todayDay,
  week,
  weeklySummaries,
  year,
}: {
  activitiesByDay: Map<number, ActivitySummary[]>;
  metricKey: MetricKey;
  month: number;
  monthMetrics: MonthMetricValues;
  onActivityClick: (id: string) => void;
  todayDay: number;
  week: (number | null)[];
  weeklySummaries: WeeklySummary[] | undefined;
  year: number;
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: CALENDAR_COLUMNS, gap: 0.5 }}>
      {week.map((day, dayIndex) => (
        <ActivityCalendarDayCell
          key={`${day ?? 'empty'}-${dayIndex}`}
          activities={day ? activitiesByDay.get(day) ?? [] : []}
          day={day}
          dayIndex={dayIndex}
          metricKey={metricKey}
          monthMetrics={monthMetrics}
          onActivityClick={onActivityClick}
          todayDay={todayDay}
        />
      ))}
      <ActivityCalendarWeekSummaryCell
        activitiesByDay={activitiesByDay}
        month={month}
        week={week}
        weeklySummaries={weeklySummaries}
        year={year}
      />
    </Box>
  );
}

function ActivityCalendarGrid({
  activitiesByDay,
  metricKey,
  month,
  monthMetrics,
  onActivityClick,
  slideClass,
  todayDay,
  weeks,
  weeklySummaries,
  year,
}: {
  activitiesByDay: Map<number, ActivitySummary[]>;
  metricKey: MetricKey;
  month: number;
  monthMetrics: MonthMetricValues;
  onActivityClick: (id: string) => void;
  slideClass: 'in-right' | 'in-left' | null;
  todayDay: number;
  weeks: (number | null)[][];
  weeklySummaries: WeeklySummary[] | undefined;
  year: number;
}) {
  return (
    <Box
      key={`${year}-${month}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        ...(slideClass === 'in-right' && {
          animation: 'calSlideRight 0.25s ease',
          '@keyframes calSlideRight': {
            from: { opacity: 0, transform: 'translateX(16px)' },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
        }),
        ...(slideClass === 'in-left' && {
          animation: 'calSlideLeft 0.25s ease',
          '@keyframes calSlideLeft': {
            from: { opacity: 0, transform: 'translateX(-16px)' },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
        }),
      }}
    >
      {weeks.map((week) => (
        <ActivityCalendarWeekRow
          key={week.join('-')}
          activitiesByDay={activitiesByDay}
          metricKey={metricKey}
          month={month}
          monthMetrics={monthMetrics}
          onActivityClick={onActivityClick}
          todayDay={todayDay}
          week={week}
          weeklySummaries={weeklySummaries}
          year={year}
        />
      ))}
    </Box>
  );
}

export default function ActivityCalendar({
  year,
  month,
  metricKey,
  onMonthChange,
  onActivityClick,
}: ActivityCalendarProps) {
  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 0, 23, 59, 59).toISOString();
  const { data, isLoading } = useActivities({ from, to, size: 200 });

  const previousMonth = adjustMonth(year, month, -1);
  const nextMonth = adjustMonth(year, month, 1);
  useActivities({
    from: new Date(previousMonth.year, previousMonth.month - 1, 1).toISOString(),
    to: new Date(previousMonth.year, previousMonth.month, 0, 23, 59, 59).toISOString(),
    size: 200,
  });
  useActivities({
    from: new Date(nextMonth.year, nextMonth.month - 1, 1).toISOString(),
    to: new Date(nextMonth.year, nextMonth.month, 0, 23, 59, 59).toISOString(),
    size: 200,
  });

  const weeksBack = useMemo(() => {
    const today = new Date();
    const firstOfMonth = new Date(year, month - 1, 1);
    const diffDays = Math.ceil((today.getTime() - firstOfMonth.getTime()) / 86400000);
    return Math.max(8, Math.ceil(diffDays / 7) + 4);
  }, [month, year]);

  const { data: weeklySummaries } = useWeeklySummaries(weeksBack);

  const [slideClass, setSlideClass] = useState<'in-right' | 'in-left' | null>(null);
  const previousSelectionRef = useRef({ year, month });

  useEffect(() => {
    const previousSelection = previousSelectionRef.current;
    if (previousSelection.year === year && previousSelection.month === month) {
      return;
    }

    const isForward = year > previousSelection.year || (year === previousSelection.year && month > previousSelection.month);
    previousSelectionRef.current = { year, month };
    setSlideClass(isForward ? 'in-right' : 'in-left');
    const timer = setTimeout(() => setSlideClass(null), 280);
    return () => clearTimeout(timer);
  }, [month, year]);

  const wheelAccumulatorRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastChangeRef = useRef(0);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const canGoForward = year < currentYear || (year === currentYear && month < currentMonth);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      wheelAccumulatorRef.current += event.deltaY;
      clearTimeout(wheelTimerRef.current);

      const now = Date.now();
      if (Math.abs(wheelAccumulatorRef.current) >= 200 && now - lastChangeRef.current > 350) {
        const direction = wheelAccumulatorRef.current > 0 ? 1 : -1;
        wheelAccumulatorRef.current = 0;
        lastChangeRef.current = now;
        if (direction > 0 && !canGoForward) {
          return;
        }

        const adjustedMonth = adjustMonth(year, month, direction);
        onMonthChange(adjustedMonth.year, adjustedMonth.month);
        return;
      }

      wheelTimerRef.current = setTimeout(() => {
        wheelAccumulatorRef.current = 0;
      }, 600);
    },
    [canGoForward, month, onMonthChange, year],
  );

  const monthMetrics = useMemo<MonthMetricValues>(
    () => ({
      distance: Math.max(1, ...(data?.items ?? []).map((activity) => activity.distanceM || 0)),
      time: Math.max(1, ...(data?.items ?? []).map((activity) => activity.movingTimeSec || 0)),
      power: Math.max(1, ...(data?.items ?? []).map((activity) => activity.avgPowerW || 0)),
      hr: Math.max(1, ...(data?.items ?? []).map((activity) => activity.avgHeartrate || 0)),
      minDistance:
        Math.min(...(data?.items ?? []).filter((activity) => activity.distanceM).map((activity) => activity.distanceM || 0)) || 0,
      minTime:
        Math.min(...(data?.items ?? []).filter((activity) => activity.movingTimeSec).map((activity) => activity.movingTimeSec || 0)) || 0,
      minPower:
        Math.min(...(data?.items ?? []).filter((activity) => activity.avgPowerW).map((activity) => activity.avgPowerW || 0)) || 0,
      minHr:
        Math.min(...(data?.items ?? []).filter((activity) => activity.avgHeartrate).map((activity) => activity.avgHeartrate || 0)) || 0,
    }),
    [data],
  );

  const activitiesByDay = useMemo(() => {
    const activities = new Map<number, ActivitySummary[]>();
    for (const activity of data?.items ?? []) {
      const day = new Date(activity.startedAt).getDate();
      if (!activities.has(day)) {
        activities.set(day, []);
      }
      activities.get(day)?.push(activity);
    }
    return activities;
  }, [data]);

  const weeks = useMemo(() => buildWeeks(year, month), [month, year]);
  const todayDay =
    today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : -1;

  return (
    <Box onWheelCapture={handleWheel} sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      <ActivityTimelineChart currentYear={year} currentMonth={month} onMonthClick={onMonthChange} />

      <ActivityCalendarMonthHeader
        canGoForward={canGoForward}
        month={month}
        onNextMonth={() => {
          if (!canGoForward) {
            return;
          }

          const adjustedMonth = adjustMonth(year, month, 1);
          onMonthChange(adjustedMonth.year, adjustedMonth.month);
        }}
        onPreviousMonth={() => {
          const adjustedMonth = adjustMonth(year, month, -1);
          onMonthChange(adjustedMonth.year, adjustedMonth.month);
        }}
        year={year}
      />

      <ActivityCalendarWeekdaysHeader />

      {isLoading ? (
        <LoadingState message="Ładowanie kalendarza aktywności…" />
      ) : (
        <ActivityCalendarGrid
          activitiesByDay={activitiesByDay}
          metricKey={metricKey}
          month={month}
          monthMetrics={monthMetrics}
          onActivityClick={onActivityClick}
          slideClass={slideClass}
          todayDay={todayDay}
          weeks={weeks}
          weeklySummaries={weeklySummaries}
          year={year}
        />
      )}
    </Box>
  );
}
