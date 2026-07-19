import { Box, Typography, Stack } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import { CHART_COLORS, STATUS_COLORS, ZONE_COLORS } from '../utils/colors';

import type { ZoneDistribution } from '../types/analytics';

interface ZoneDonutChartProps {
  data: ZoneDistribution | undefined;
  title?: string;
}

const zoneLabels: Record<string, string> = {
  Z1: 'Regeneracja',
  Z2: 'Wytrzymałość',
  Z3: 'Tempo',
  Z4: 'Próg',
  Z5: 'VO2max',
  Z6: 'Anaerobowa',
  Z7: 'Neuromuskul.',
};

export default function ZoneDonutChart({ data, title }: ZoneDonutChartProps) {
  if (!data || Object.keys(data.zones).length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        Brak danych strefowych.
      </Typography>
    );
  }

  const total = data.totalSeconds || Object.values(data.zones).reduce((sum, v) => sum + v, 0);
  const chartData = Object.entries(data.zones).map(([zone, seconds]) => ({
    name: zone,
    label: zoneLabels[zone] ?? zone,
    value: total > 0 ? +(seconds * 100 / total).toFixed(1) : 0,
    color: ZONE_COLORS[zone as keyof typeof ZONE_COLORS] ?? STATUS_COLORS.neutral,
  }));

  return (
    <Box>
      {!!title && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
          {title}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: CHART_COLORS.tooltip,
                  border: `1px solid ${CHART_COLORS.grid}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: CHART_COLORS.tooltipText }}
                itemStyle={{ color: CHART_COLORS.tooltipText }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Stack spacing={0.3} sx={{ flex: 1 }}>
          {chartData.map((entry) => (
            <Box
              key={entry.name}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: entry.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                {entry.name}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {entry.value.toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
