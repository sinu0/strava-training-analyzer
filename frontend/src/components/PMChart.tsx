import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { memo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

import { pmChartMessages } from '@/components/PMChart.messages';
import { getLocale } from '@/i18n';
import { getAppThemeTokens } from '@/theme/theme';

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

function formatDelta(value: number | null): string {
  if (value == null) return '—';
  const rounded = Math.round(value * 10) / 10;
  return rounded >= 0 ? `+${rounded}` : `${rounded}`;
}

function PmcTooltipContent({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  const theme = useTheme();
  const t = pmChartMessages.useT();
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const metrics = [
    { key: 'ctl', label: t('seriesCtl'), color: PMC_COLORS.CTL, value: row.ctl, delta: row.ctlDelta },
    { key: 'atl', label: t('seriesAtl'), color: PMC_COLORS.ATL, value: row.atl, delta: row.atlDelta },
    { key: 'tsb', label: t('seriesTsb'), color: PMC_COLORS.TSB, value: row.tsb, delta: row.tsbDelta },
  ];

  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: getAppThemeTokens(theme).cardShadow, p: 1.5, borderRadius: 2, minWidth: 180 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
        {label ? new Date(label).toLocaleDateString(getLocale()) : ''}
      </Typography>
      {metrics.map((m) => (
        <Box key={m.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, py: 0.25 }}>
          <Typography variant="body2" sx={{ color: m.color, fontWeight: 500 }}>
            {m.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {m.value == null ? '—' : Math.round(m.value * 10) / 10}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: m.delta != null && m.delta > 0 ? STATUS_COLORS.success : m.delta != null && m.delta < 0 ? STATUS_COLORS.error : 'text.secondary',
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
  const t = pmChartMessages.useT();
  if (!data.length) {
    return (
      <Typography
        sx={{
          color: "text.secondary",
          py: 4,
          textAlign: 'center'
        }}>{t('noData')}
              </Typography>
    );
  }

  const latest = data[data.length - 1]!;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 1
        }}>
        {t('description')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.25 }}>
        {[
          [t('legendCtl'), PMC_COLORS.CTL, 'solid'],
          [t('legendAtl'), PMC_COLORS.ATL, 'solid'],
          [t('legendTsb'), PMC_COLORS.TSB, 'dashed'],
        ].map(([label, color, style]) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 24, borderTop: `3px ${style} ${color}` }} />
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>{label}</Typography>
          </Box>
        ))}
      </Box>
      <Box
        role="img"
        aria-label={t('ariaLabel', { count: data.length, from: data[0]!.date, to: latest.date, ctl: latest.ctl ?? '—', atl: latest.atl ?? '—', tsb: latest.tsb ?? '—' })}
        sx={{ width: '100%', height: 350 }}
      >
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid {...chart.grid} />
            <XAxis
              dataKey="date"
              {...chart.axis}
              tickFormatter={(v) => new Date(v).toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' })}
            />
            <YAxis {...chart.axis} />
            <Tooltip content={<PmcTooltipContent />} cursor={chart.tooltip.cursor} />
            <ReferenceLine y={0} stroke={getAppThemeTokens(theme).chart.tick} strokeDasharray="2 5" />
          <Area
            type="monotone"
            dataKey="tsb"
            fill={PMC_COLORS.TSB}
            fillOpacity={0.1}
            stroke="none"
          />
          <Line type="monotone" dataKey="ctl" stroke={PMC_COLORS.CTL} strokeWidth={2.5} dot={false} name={t('seriesCtl')} />
          <Line type="monotone" dataKey="atl" stroke={PMC_COLORS.ATL} strokeWidth={2.5} dot={false} name={t('seriesAtl')} />
          <Line type="monotone" dataKey="tsb" stroke={PMC_COLORS.TSB} strokeWidth={2.5} strokeDasharray="5 5" dot={false} name={t('seriesTsb')} />
        </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
});

export default PMChart;
