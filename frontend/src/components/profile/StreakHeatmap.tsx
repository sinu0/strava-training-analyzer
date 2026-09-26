import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

import { profileMessages } from '@/components/profile/messages';
import { useStreakCalendar, useStreakStats } from '@/hooks/useStreak';
import { localized } from '@/i18n';
import { useTokens } from '@/ui';


const MONTH_LABELS = localized({
  pl: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
});
const DAY_LABELS_SHORT = localized({
  pl: ['Pon', '', 'Śro', '', 'Pią', '', 'Nie'],
  en: ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'],
});

const CELL_SIZE = 13;
const CELL_GAP = 3;
const CELL_RX = 3;
const LEFT_PAD = 36;
const TOP_PAD = 20;
const BOTTOM_PAD = 10;

export default function StreakHeatmap() {
  const currentYear = new Date().getFullYear();
  const { data: calendar } = useStreakCalendar(currentYear);
  const { data: stats } = useStreakStats();
  const tokens = useTokens();
  const theme = useTheme();
  const t = profileMessages.useT();
  const LEVEL_COLORS = tokens.chart.heatmap;
  const ink = { label: tokens.chart.tick, quiet: alpha(tokens.chart.tick, 0.6), cellEdge: tokens.surfaceBorder };

  if (!calendar || !stats) return null;

  const weekCount = calendar.weeks.length;
  const step = CELL_SIZE + CELL_GAP;
  const svgWidth = LEFT_PAD + weekCount * step + 10;
  const svgHeight = TOP_PAD + 7 * step + BOTTOM_PAD + 28;

  return (
    <Box>
      <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: "warning.main"
            }}>
            {stats.currentStreak}
          </Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>{t('streak.current')}</Typography>
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: "primary.main"
            }}>
            {stats.longestStreak}
          </Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>{t('streak.longest')}</Typography>
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: "success.main"
            }}>
            {stats.totalActiveDays}
          </Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>{t('streak.activeDays')}</Typography>
        </Box>
      </Stack>

      <Box sx={{ overflowX: 'auto', pb: 1 }}>
        <svg width={svgWidth} height={svgHeight} style={{ minWidth: svgWidth }}>
          {/* Month labels */}
          {(() => {
            const elements: React.ReactNode[] = [];
            let lastMonth = '';
            calendar.weeks.forEach((week, wi) => {
              const date = week.days[0]?.date;
              if (!date) return;
              const monthLabel = MONTH_LABELS[Number.parseInt(date.slice(5, 7), 10) - 1];
              if (monthLabel && monthLabel !== lastMonth) {
                lastMonth = monthLabel;
                elements.push(
                  <text
                    key={date.slice(0, 7)}
                    x={LEFT_PAD + wi * step}
                    y={TOP_PAD - 6}
                    fill={theme.palette.text.secondary}
                    fontSize={11}
                    fontWeight={600}
                  >
                    {monthLabel}
                  </text>
                );
              }
            });
            return elements;
          })()}

          {/* Day labels */}
          {DAY_LABELS_SHORT.map((label, i) => (
            <text
              key={['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i]}
              x={LEFT_PAD - 6}
              y={TOP_PAD + i * step + CELL_SIZE - 3}
              textAnchor="end"
              fill={i % 2 === 1 ? ink.quiet : ink.label}
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* Grid cells */}
          {calendar.weeks.map((week, wi) =>
            week.days.map((day, di) => (
              <g key={day.date}>
                <title>{t('streak.cellTitle', { date: day.date, count: day.level > 0 ? day.level : 0 })}</title>
                <rect
                  x={LEFT_PAD + wi * step}
                  y={TOP_PAD + di * step}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={CELL_RX}
                  fill={LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0]}
                  stroke={day.level === 0 ? ink.cellEdge : 'transparent'}
                  strokeWidth={day.level === 0 ? 1 : 0}
                />
              </g>
            ))
          )}

          {/* Legend */}
          <g transform={`translate(${LEFT_PAD}, ${svgHeight - BOTTOM_PAD})`}>
            <text x={0} y={-6} fill={ink.label} fontSize={10}>{t('streak.less')}</text>
            {LEVEL_COLORS.map((color, i) => (
              <rect key={color} x={28 + i * (CELL_SIZE + 2)} y={-CELL_SIZE} width={CELL_SIZE} height={CELL_SIZE} rx={2} fill={color} stroke={ink.cellEdge} strokeWidth={1} />
            ))}
            <text x={28 + LEVEL_COLORS.length * (CELL_SIZE + 2) + 4} y={-6} fill={ink.label} fontSize={10}>{t('streak.more')}</text>
          </g>
        </svg>
      </Box>
    </Box>
  );
}
