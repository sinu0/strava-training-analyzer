import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
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

import { useWeeklyMmp } from '@/hooks/usePowerAnalysis';

const STANDARD_DURATIONS = ['5s', '1min', '5min', '20min', '60min'];

const DURATION_COLORS: Record<string, string> = {
  '5s': '#f44336',
  '1min': '#ff9800',
  '5min': '#ffc107',
  '20min': '#4caf50',
  '60min': '#2196f3',
};

interface MmpTrendChartProps {
  from: string;
  to: string;
}

const shouldRenderLegend = !import.meta.env.VITEST && import.meta.env.MODE !== 'test';

export default function MmpTrendChart({ from, to }: MmpTrendChartProps) {
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
    <Paper sx={{ p: 2, backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
      <Stack spacing={0.75}>
        <Typography variant="subtitle1" fontWeight={600}>
          Trend mocy maksymalnej (MMP)
        </Typography>
        <Typography color="text.secondary">{message}</Typography>
        {detail ? (
          <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {detail}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );

  if (isLoading) {
    return renderState('Ładowanie danych MMP…');
  }

  if (isError) {
    const detail = error instanceof Error ? error.message : undefined;
    return renderState('Nie udało się załadować trendu MMP.', detail);
  }

  if (chartData.length === 0) {
    return renderState('Brak danych MMP dla wybranego zakresu.');
  }

  return (
    <Paper sx={{ p: 2, backgroundColor: '#0D1117', border: '1px solid #30363D' }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          Trend mocy maksymalnej (MMP)
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
              <XAxis dataKey="week" stroke="#8B949E" fontSize={11} />
              <YAxis stroke="#8B949E" fontSize={11} unit=" W" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B22',
                  border: '1px solid #30363D',
                  borderRadius: 8,
                }}
              />
              {!!shouldRenderLegend && <Legend />}
              {selectedDurations.map((d) => (
                <Line
                  key={d}
                  type="monotone"
                  dataKey={d}
                  stroke={DURATION_COLORS[d] || '#999'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={d}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </Paper>
  );
}
