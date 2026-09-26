import {
  Box,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { mmpTrendChartMessages } from '@/components/analytics/messages';
import { useWeeklyMmp } from '@/hooks/usePowerAnalysis';
import { Surface } from '@/ui';
import { getChartVisuals } from '@/utils/chartStyles';
import { STATUS_COLORS, ZONE_COLORS } from '@/utils/colors';

const STANDARD_DURATIONS = ['5s', '1min', '5min', '20min', '60min'];

const DURATION_COLORS: Record<string, string> = {
  '5s': ZONE_COLORS.Z5,
  '1min': ZONE_COLORS.Z4,
  '5min': ZONE_COLORS.Z3,
  '20min': ZONE_COLORS.Z2,
  '60min': ZONE_COLORS.Z1,
};

interface MmpTrendChartProps {
  from: string;
  to: string;
}

const shouldRenderLegend = !import.meta.env.VITEST && import.meta.env.MODE !== 'test';

export default function MmpTrendChart({ from, to }: MmpTrendChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  const t = mmpTrendChartMessages.useT();
  const {
    data: weeklyMmp = [],
    isLoading,
    isError,
    error,
  } = useWeeklyMmp(from, to);
  const [selectedDurations, setSelectedDurations] = useState<string[]>(STANDARD_DURATIONS);

  const chartData = useMemo(() => {
    return weeklyMmp.map((w) => ({
      week: w.weekLabel,
      ...w.bestEfforts,
    }));
  }, [weeklyMmp]);

  const handleDurationToggle = (_: unknown, newDurations: string[]) => {
    if (newDurations.length > 0) setSelectedDurations(newDurations);
  };

  const renderState = (message: string, detail?: string) => (
    <Surface padding="sm">
      <Stack spacing={0.75}>
        <Typography variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          {t('title')}
        </Typography>
        <Typography sx={{
          color: "text.secondary"
        }}>{message}</Typography>
        {detail ? (
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: '0.8rem'
            }}>
            {detail}
          </Typography>
        ) : null}
      </Stack>
    </Surface>
  );

  if (isLoading) {
    return renderState(t('loading'));
  }

  if (isError) {
    const detail = error instanceof Error ? error.message : undefined;
    return renderState(t('loadError'), detail);
  }

  if (chartData.length === 0) {
    return renderState(t('noData'));
  }

  return (
    <Surface padding="sm">
      <Stack spacing={1}>
        <Typography variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          {t('title')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={selectedDurations}
          onChange={handleDurationToggle}
          sx={{ flexWrap: 'wrap' }}
        >
          {STANDARD_DURATIONS.map((d) => (
            <ToggleButton key={d} value={d} sx={{ textTransform: 'none', px: 1.5 }}>
              {d}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="week" {...chart.axis} />
              <YAxis {...chart.axis} unit=" W" />
              <Tooltip
                {...chart.tooltip}
              />
              {!!shouldRenderLegend && <Legend {...chart.legend} />}
              {selectedDurations.map((d) => (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={DURATION_COLORS[d] ?? STATUS_COLORS.neutral}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, strokeWidth: 0 }}
                  name={d}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </Surface>
  );
}
