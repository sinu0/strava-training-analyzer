import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

import { getChartVisuals } from '../utils/chartStyles';
import { PMC_COLORS, STATUS_COLORS } from '../utils/colors';

import type { PmcData } from '../types/analytics';

interface PMChartProps {
  data: PmcData[];
}

interface TooltipEntry {
  dataKey?: string;
  value?: number | string;
  color?: string;
  payload?: PmcData;
}

function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded >= 0 ? `+${rounded}` : `${rounded}`;
}

function PmcTooltipContent({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const metrics = [
    { key: 'ctl', label: 'CTL (Fitness)', color: PMC_COLORS.CTL, value: row.ctl, delta: row.ctlDelta },
    { key: 'atl', label: 'ATL (Fatigue)', color: PMC_COLORS.ATL, value: row.atl, delta: row.atlDelta },
    { key: 'tsb', label: 'TSB (Form)', color: PMC_COLORS.TSB, value: row.tsb, delta: row.tsbDelta },
  ];

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: theme.tokens.cardShadow, p: 1.5, borderRadius: 2, minWidth: 180 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
        {label ? new Date(label).toLocaleDateString('pl-PL') : ''}
      </Typography>
      {metrics.map((m) => (
        <Box key={m.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, py: 0.25 }}>
          <Typography variant="body2" sx={{ color: m.color, fontWeight: 500 }}>
            {m.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {Math.round(m.value * 10) / 10}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: m.delta > 0 ? STATUS_COLORS.success : m.delta < 0 ? STATUS_COLORS.error : 'text.secondary',
                fontWeight: 600,
                minWidth: 40,
                textAlign: 'right',
              }}
            >
              {formatDelta(m.delta)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

const PMChart = memo(function PMChart({ data }: PMChartProps) {
  const theme = useTheme();
  const chart = getChartVisuals(theme);
  if (!data.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        Brak danych PMC dla wybranego zakresu.
      </Typography>
    );
  }

  const latest = data[data.length - 1]!;

  return (
    <Box
      role="img"
      aria-label={`Wykres obciążenia PMC. ${data.length} punktów od ${data[0]!.date} do ${latest.date}. Ostatnie wartości: CTL ${latest.ctl}, ATL ${latest.atl}, forma ${latest.tsb}.`}
      sx={{ width: '100%', height: 400 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid {...chart.grid} />
            <XAxis
              dataKey="date"
              {...chart.axis}
              tickFormatter={(v) => new Date(v).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
            />
            <YAxis {...chart.axis} />
            <Tooltip content={<PmcTooltipContent />} cursor={chart.tooltip.cursor} />
            <ReferenceLine y={0} stroke={theme.tokens.chart.tick} strokeDasharray="2 5" />
          <Area
            type="monotone"
            dataKey="tsb"
            fill={PMC_COLORS.TSB}
            fillOpacity={0.1}
            stroke="none"
          />
          <Line type="monotone" dataKey="ctl" stroke={PMC_COLORS.CTL} strokeWidth={2.5} dot={false} name="CTL (Fitness)" />
          <Line type="monotone" dataKey="atl" stroke={PMC_COLORS.ATL} strokeWidth={2.5} dot={false} name="ATL (Fatigue)" />
          <Line type="monotone" dataKey="tsb" stroke={PMC_COLORS.TSB} strokeWidth={2.5} strokeDasharray="5 5" dot={false} name="TSB (Form)" />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
});

export default PMChart;
