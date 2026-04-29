import { Box, Stack, Typography } from '@mui/material';

import ActivityFeedCard from '@/components/ActivityFeedCard';
import type { ActivitySummary } from '@/types/activity';

type RecentActivityFeedProps = {
  activities: ActivitySummary[];
  buildSummary: (activity: ActivitySummary) => string;
  onSelect: (activityId: string) => void;
};

/**
 * Vertical feed-style list for recent workouts shown below the Home hero.
 */
export default function RecentActivityFeed({
  activities,
  buildSummary,
  onSelect,
}: RecentActivityFeedProps) {
  if (!activities.length) {
    return null;
  }

  return (
    <Stack data-testid="recent-activity-feed" spacing={1.5}>
      {activities.map((activity) => (
        <Box key={activity.id}>
          <ActivityFeedCard activity={activity} onClick={onSelect} summaryText={buildSummary(activity)} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              px: 0.5,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {buildSummary(activity)}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
