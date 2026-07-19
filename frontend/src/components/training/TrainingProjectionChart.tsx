import { Alert, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import {
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { getChartVisuals } from '../../utils/chartStyles';
import { PMC_COLORS } from '../../utils/colors';

import type { CalendarDay } from '../../types/training';

interface TrainingProjectionChartProps {
  days: CalendarDay[];
}

function formatDateTick(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

export default function TrainingProjectionChart({ days }: TrainingProjectionChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const futureDays = useMemo(
    () => days.filter((day) => day.projection),
    [days],
  );

  const chartData = useMemo(
    () => futureDays.map((day) => ({
      date: day.date,
      plannedTss: Math.round(day.projection?.plannedTss ?? 0),
      ctl: Number(day.projection?.projectedCtl?.toFixed(1) ?? 0),
      atl: Number(day.projection?.projectedAtl?.toFixed(1) ?? 0),
      tsb: Number(day.projection?.projectedTsb?.toFixed(1) ?? 0),
    })),
    [futureDays],
  );

  if (!futureDays.length) {
    return null;
  }

  const minTsb = Math.min(...futureDays.map((day) => day.projection?.projectedTsb ?? 0));
  const adjustments = futureDays
    .filter((day) => day.adjustment)
    .slice(0, 3);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Projekcja PMC planu</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Szybki podgląd, jak obecny plan przesuwa CTL, ATL i świeżość w widocznym zakresie kalendarza.
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Najniższy TSB: {minTsb > 0 ? '+' : ''}{minTsb.toFixed(1)}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Dni z taperem: {futureDays.filter((day) => day.projection?.taperDay).length}
          </Typography>
        </Stack>

        <Box sx={{ width: '100%', height: 240, mb: adjustments.length ? 1.5 : 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid {...chart.grid} />
              <XAxis dataKey="date" tickFormatter={formatDateTick} {...chart.axis} />
              <YAxis {...chart.axis} />
              <Tooltip {...chart.tooltip} />
              <Bar dataKey="plannedTss" fill={theme.tokens.chart.tertiary} radius={chart.barRadius} name="Plan TSS" />
              <Line type="monotone" dataKey="ctl" stroke={PMC_COLORS.CTL} strokeWidth={2.5} dot={false} name="CTL" />
              <Line type="monotone" dataKey="atl" stroke={PMC_COLORS.ATL} strokeWidth={2.5} dot={false} name="ATL" />
              <Line type="monotone" dataKey="tsb" stroke={PMC_COLORS.TSB} strokeWidth={2.5} dot={false} name="TSB" />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {adjustments.map((day) => (
          <Alert key={`${day.date}-${day.adjustment?.title}`} severity="warning" sx={{ mb: 1 }}>
            <Typography variant="subtitle2">{day.adjustment?.title}</Typography>
            <Typography variant="body2">{day.adjustment?.description}</Typography>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
