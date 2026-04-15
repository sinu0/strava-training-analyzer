import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { memo, useMemo } from 'react';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { useWeeklySummaries } from '../../hooks/useAnalytics';

type MetricKey = 'distance' | 'time' | 'elevation';

interface MetricOption {
  key: MetricKey;
  label: string;
  color: string;
  format: (v: number) => string;
  getValue: (s: { totalDistanceM: number; totalTimeSec: number; totalElevationM: number }) => number;
  unit: string;
}

const METRICS: MetricOption[] = [
  {
    key: 'distance',
    label: 'Dystans',
    color: '#3B82F6',
    unit: 'km',
    getValue: (s) => Math.round((s.totalDistanceM / 1000) * 10) / 10,
    format: (v) => `${v} km`,
  },
  {
    key: 'time',
    label: 'Czas',
    color: '#FF6B35',
    unit: 'h',
    getValue: (s) => Math.round((s.totalTimeSec / 3600) * 10) / 10,
    format: (v) => `${v} h`,
  },
  {
    key: 'elevation',
    label: 'Przewyższenie',
    color: '#3FB950',
    unit: 'm',
    getValue: (s) => Math.round(s.totalElevationM),
    format: (v) => `${v} m`,
  },
];

function CustomTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metric: MetricOption;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: '#21262D',
        border: '1px solid #30363D',
        borderRadius: 2,
        px: 1.5,
        py: 1,
      }}
    >
      <Typography sx={{ color: '#8B949E', fontSize: '0.75rem' }}>{label}</Typography>
      <Typography sx={{ color: 'white', fontSize: '0.85rem', fontWeight: 700 }}>
        {metric.format(payload[0]?.value ?? 0)}
      </Typography>
    </Box>
  );
}

const WeeklyKmBarChart = memo(function WeeklyKmBarChart() {
  const [metric, setMetric] = useState<MetricKey>('distance');
  const { data: summaries = [] } = useWeeklySummaries(12);

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  const chartData = useMemo(() => {
    return [...summaries]
      .reverse()
      .map((s) => ({
        week: new Date(s.weekStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
        value: activeMetric.getValue(s),
        isCurrent:
          new Date(s.weekStart).toISOString().slice(0, 10) ===
          (() => {
            const d = new Date();
            const dow = (d.getDay() + 6) % 7;
            d.setDate(d.getDate() - dow);
            return d.toISOString().slice(0, 10);
          })(),
      }));
  }, [summaries, activeMetric]);

  const maxVal = Math.max(...chartData.map((d) => d.value), 1);
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    Math.round((maxVal / 4) * i),
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#E6EDF3' }}>
          Ostatnie 12 tygodni
        </Typography>
        <ToggleButtonGroup
          value={metric}
          exclusive
          onChange={(_, v) => v && setMetric(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              py: 0.3,
              px: 1,
              fontSize: '0.72rem',
              borderColor: '#30363D',
              color: '#8B949E',
              '&.Mui-selected': {
                bgcolor: '#21262D',
                color: 'white',
              },
            },
          }}
        >
          {METRICS.map((m) => (
            <ToggleButton key={m.key} value={m.key}>
              {m.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid stroke="#30363D" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: '#8B949E', fontSize: 10 }}
            stroke="transparent"
            tickLine={false}
            interval={1}
          />
          <YAxis
            ticks={yTicks}
            tick={{ fill: '#8B949E', fontSize: 10 }}
            stroke="transparent"
            tickLine={false}
            width={38}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<CustomTooltip metric={activeMetric} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="value" isAnimationActive={false} radius={[3, 3, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.isCurrent ? activeMetric.color : `${activeMetric.color}99`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default WeeklyKmBarChart;
