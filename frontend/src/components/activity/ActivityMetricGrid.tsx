import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Grid, Stack, Tooltip, Typography } from '@mui/material';

import { activityMessages } from '@/components/activity/messages';
import type { ActivityMetricValue } from '@/features/history/types';
import { Surface } from '@/ui';
import { formatActivityMetric, getActivityMetricMetadata } from '@/utils/activityMetricMetadata';

export default function ActivityMetricGrid({ metrics }: { metrics: ActivityMetricValue[] }) {
  const t = activityMessages.useT();
  const numericMetrics = metrics.filter((item) => item.numericValue != null).slice(0, 8);

  if (numericMetrics.length === 0) {
    return (
      <Typography variant="body2" sx={{
        color: "text.secondary"
      }}>{t('metricGrid.noMetrics')}</Typography>
    );
  }

  return (
    <Grid container spacing={1.25} sx={{ mt: 0.5 }}>
      {numericMetrics.map((item) => {
        const metadata = getActivityMetricMetadata(item.name);
        return (
          <Grid key={item.name} size={{ xs: 12, sm: 6 }}>
            <Surface padding="sm" sx={{ height: '100%' }}>
              <Stack direction="row" spacing={0.75} sx={{
                alignItems: "center"
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 750
                  }}>
                  {metadata.label}
                </Typography>
                <Tooltip title={metadata.description} arrow>
                  <InfoOutlinedIcon aria-label={t('metricGrid.infoAriaLabel', { label: metadata.label })} sx={{ fontSize: 15, color: 'text.secondary' }} />
                </Tooltip>
              </Stack>
              <Typography variant="h6" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {formatActivityMetric(item.name, item.numericValue!)}
              </Typography>
            </Surface>
          </Grid>
        );
      })}
    </Grid>
  );
}
