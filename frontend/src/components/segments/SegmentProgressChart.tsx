import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getLocale } from '@/i18n';
import { tokens } from '@/theme/theme';
import type { SegmentEffort } from '@/types/segments';

import { segmentComponentsMessages } from './messages';

export default function SegmentProgressChart({ efforts }: { efforts: SegmentEffort[] }) {
  const t = segmentComponentsMessages.useT();
  const data = useMemo(() => [...efforts]
    .filter(effort => effort.elapsedTimeSec != null)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .map(effort => ({
      date: effort.startedAt,
      elapsedTimeSec: effort.elapsedTimeSec,
      label: new Date(effort.startedAt).toLocaleDateString(getLocale()),
    })), [efforts]);

  if (data.length === 0) return null;
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>{t('progress.title')}</Typography>
      <Box sx={{ height: 230 }} aria-label={t('progress.chartAriaLabel')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={value => new Date(String(value)).toLocaleDateString(getLocale())} />
            <YAxis reversed unit=" s" domain={['dataMin - 3', 'dataMax + 3']} />
            <Tooltip labelFormatter={value => new Date(String(value)).toLocaleString(getLocale())} formatter={value => [`${Number(value)} s`, t('progress.time')]} />
            <Line type="monotone" dataKey="elapsedTimeSec" name={t('progress.time')} stroke={tokens.chart.primary} strokeWidth={2.5} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
