import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Grid, Stack, Tooltip, Typography } from '@mui/material';

import PerformanceSurface from '@/components/v2/PerformanceSurface';
import type { ActivityMetricValue } from '@/features/history/types';
import { formatActivityMetric, getActivityMetricMetadata } from '@/utils/activityMetricMetadata';

export default function ActivityMetricGrid({ metrics }: { metrics: ActivityMetricValue[] }) {
  const numericMetrics = metrics.filter((item) => item.numericValue != null).slice(0, 8);

  if (numericMetrics.length === 0) {
    return <Typography variant="body2" color="text.secondary">Brak policzonych metryk.</Typography>;
  }

  return (
    <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
      {numericMetrics.map((item) => {
        const metadata = getActivityMetricMetadata(item.name);
        return (
          <Grid key={item.name} size={{ xs: 12, sm: 6 }}>
            <PerformanceSurface sx={{ p: 1.5, height: '100%' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 750 }}>
                  {metadata.label}
                </Typography>
                <Tooltip title={metadata.description} arrow>
                  <InfoOutlinedIcon aria-label={`Informacje: ${metadata.label}`} sx={{ fontSize: 15, color: 'text.secondary' }} />
                </Tooltip>
              </Stack>
              <Typography variant="h6" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {formatActivityMetric(item.name, item.numericValue!)}
              </Typography>
            </PerformanceSurface>
          </Grid>
        );
      })}
    </Grid>
  );
}
