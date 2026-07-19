import { Box } from '@mui/material';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from 'recharts';

import type { ConfidenceBreakdown } from '@/types/aiV2';
import { CHART_COLORS, STATUS_COLORS, alphaColor } from '@/utils/colors';

interface ConfidenceBreakdownChartProps {
  breakdown: ConfidenceBreakdown;
  variant?: 'radar' | 'bars';
}

const LABELS: Record<keyof ConfidenceBreakdown, string> = {
  dataQuality: 'Jakość danych',
  trendClarity: 'Jasność trendu',
  modelCertainty: 'Pewność modelu',
};

const BARS_CONFIG: { key: keyof ConfidenceBreakdown; color: string }[] = [
  { key: 'dataQuality', color: STATUS_COLORS.secondary },
  { key: 'trendClarity', color: STATUS_COLORS.info },
  { key: 'modelCertainty', color: STATUS_COLORS.highlight },
];

export default function ConfidenceBreakdownChart({
  breakdown,
  variant = 'bars',
}: ConfidenceBreakdownChartProps) {
  if (variant === 'radar') {
    const radarData = [
      { subject: LABELS.dataQuality, value: breakdown.dataQuality * 100 },
      { subject: LABELS.trendClarity, value: breakdown.trendClarity * 100 },
      { subject: LABELS.modelCertainty, value: breakdown.modelCertainty * 100 },
    ];

    return (
      <Box sx={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid stroke={alphaColor(CHART_COLORS.grid, 0.6)} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: CHART_COLORS.tickText, fontSize: 11, fontWeight: 500 }}
            />
            <Radar
              dataKey="value"
              stroke={STATUS_COLORS.accent}
              fill={STATUS_COLORS.accent}
              fillOpacity={0.2}
              strokeWidth={2}
              animationDuration={600}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  const barData = BARS_CONFIG.map(({ key, color }) => ({
    name: LABELS[key],
    value: Math.round(breakdown[key] * 100),
    color,
  }));

  return (
    <Box sx={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={barData} layout="vertical" margin={{ left: 100, right: 30, top: 5, bottom: 5 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: CHART_COLORS.tickText, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18} maxBarSize={24}>
            {barData.map((entry) => (
              <Cell key={entry.name} fill={alphaColor(entry.color, 0.6)} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => `${Number(value ?? 0)}%`}
              style={{ fill: CHART_COLORS.tickText, fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
