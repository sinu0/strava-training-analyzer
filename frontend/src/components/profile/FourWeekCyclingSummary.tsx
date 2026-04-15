import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';

import type { ActivitySummary } from '@/types/activity';
import { STATUS_COLORS, alphaColor } from '@/utils/colors';

import { useRecentActivities } from '../../hooks/useAnalytics';

const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
// Backend maps all bike activities to "cycling"
const CYCLING_TYPES = new Set(['cycling', 'Ride', 'VirtualRide', 'EBikeRide', 'MountainBikeRide', 'GravelRide']);

const WEEKS = 4;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface WeekData {
  weekLabel: string;
  days: (ActivitySummary | null)[];
  totalTimeSec: number;
}

function getIsoWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeeks(activities: ActivitySummary[]): WeekData[] {
  const cycling = activities.filter((a) => CYCLING_TYPES.has(a.sportType));
  const now = new Date();
  const thisWeekStart = getIsoWeekStart(now);

  return Array.from({ length: WEEKS }, (_, weekOffset) => {
    const weekStart = new Date(thisWeekStart.getTime() - (WEEKS - 1 - weekOffset) * WEEK_MS);
    const weekEnd = new Date(weekStart.getTime() + WEEK_MS);

    const days: (ActivitySummary | null)[] = Array(7).fill(null);
    let totalTimeSec = 0;

    for (const act of cycling) {
      const d = new Date(act.startedAt);
      if (d >= weekStart && d < weekEnd) {
        const dow = (d.getDay() + 6) % 7;
        const existing = days[dow];
        // Keep the longest activity per day
        if (!existing || act.movingTimeSec > existing.movingTimeSec) {
          days[dow] = act;
        }
        totalTimeSec += act.movingTimeSec;
      }
    }

    const fmt = weekStart.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    return { weekLabel: fmt, days, totalTimeSec };
  });
}

function dotRadius(sec: number, minSec: number, maxSec: number): number {
  if (sec <= 0) return 0;
  const range = maxSec - minSec;
  if (range <= 0) return 9; // all same size
  const t = (sec - minSec) / range; // 0..1
  return Math.round(5 + t * 10); // 5px (smallest) to 15px (largest) radius
}

function formatHm(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export default function FourWeekCyclingSummary() {
  const { data: activities = [] } = useRecentActivities(200);
  const weeks = useMemo(() => buildWeeks(activities), [activities]);

  const maxWeekTime = Math.max(...weeks.map((w) => w.totalTimeSec), 1);

  // Compute global min/max moving time across all training days for proportional sizing
  const allActivityTimes = weeks.flatMap((w) =>
    w.days.filter((a): a is ActivitySummary => a !== null).map((a) => a.movingTimeSec),
  );
  const globalMinSec = allActivityTimes.length > 0 ? Math.min(...allActivityTimes) : 0;
  const globalMaxSec = allActivityTimes.length > 0 ? Math.max(...allActivityTimes) : 1;

  return (
    <Box>
      {/* Day headers */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'auto repeat(7, 1fr) auto',
          alignItems: 'center',
          mb: 0.75,
          px: 1,
        }}
      >
        <Box sx={{ width: 48 }} />
        {DAY_LABELS.map((d) => (
          <Typography
            key={d}
            sx={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'text.disabled',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {d}
          </Typography>
        ))}
        <Box sx={{ width: 100 }} />
      </Box>

      {/* Week rows */}
      {weeks.map((week) => (
        <Box
          key={week.weekLabel}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto repeat(7, 1fr) auto',
            alignItems: 'center',
            mb: 0.5,
            px: 1,
          }}
        >
          {/* Week label */}
          <Typography
            sx={{
              width: 48,
              fontSize: '0.68rem',
              color: 'text.disabled',
              whiteSpace: 'nowrap',
            }}
          >
            {week.weekLabel}
          </Typography>

          {/* Day dots */}
          {week.days.map((act, i) => {
            const r = act ? dotRadius(act.movingTimeSec, globalMinSec, globalMaxSec) : 4;
            const title = act
              ? `${act.name} – ${formatHm(act.movingTimeSec)}`
              : DAY_LABELS[i] ?? '';
            return (
              <Box
                key={i}
                title={title}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 36,
                }}
              >
                <Box
                  sx={{
                     width: r * 2,
                     height: r * 2,
                     borderRadius: '50%',
                     bgcolor: act ? 'primary.main' : 'transparent',
                     border: act ? 'none' : `1.5px solid ${alphaColor(STATUS_COLORS.neutral, 0.35)}`,
                     opacity: act ? 1 : 0.8,
                     transition: 'all 0.15s ease',
                   }}
                />
              </Box>
            );
          })}

          {/* Weekly time bar */}
          <Box sx={{ width: 110, ml: 1.5 }}>
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: alphaColor(STATUS_COLORS.accent, 0.1),
                  border: `1px solid ${alphaColor(STATUS_COLORS.accent, 0.18)}`,
                  overflow: 'hidden',
                }}
              >
                {week.totalTimeSec > 0 && (
                  <Box
                    sx={{
                      height: '100%',
                      width: `${(week.totalTimeSec / maxWeekTime) * 100}%`,
                      bgcolor: 'primary.main',
                      borderRadius: 5,
                      transition: 'width 0.4s ease',
                    }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  color: week.totalTimeSec > 0 ? 'text.secondary' : 'text.disabled',
                  mt: 0.3,
                  whiteSpace: 'nowrap',
                }}
              >
                {week.totalTimeSec > 0 ? formatHm(week.totalTimeSec) : '–'}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
