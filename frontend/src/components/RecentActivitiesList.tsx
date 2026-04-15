import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ActivitySummary } from '@/types/activity';
import { formatDistance, formatDuration } from '@/utils/formatters';

interface RecentActivitiesListProps {
  activities: ActivitySummary[] | undefined;
}

interface RecentActivityItemProps {
  activity: ActivitySummary;
  onActivityClick: (id: string) => void;
}

const RecentActivityItem = memo(function RecentActivityItem({
  activity,
  onActivityClick,
}: RecentActivityItemProps) {
  const handleClick = useCallback(() => {
    onActivityClick(activity.id);
  }, [activity.id, onActivityClick]);

  return (
    <ListItemButton onClick={handleClick} sx={{ borderRadius: 1 }}>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{activity.name}</Typography>
            <Chip label={activity.sportType} size="small" variant="outlined" />
          </Box>
        }
        secondary={
          <Typography variant="caption" color="text.secondary">
            {new Date(activity.startedAt).toLocaleDateString('pl-PL')} · {formatDistance(activity.distanceM)} · {formatDuration(activity.movingTimeSec)}
          </Typography>
        }
      />
      {activity.avgPowerW != null && (
        <Typography variant="body2" color="primary">
          {activity.avgPowerW} W
        </Typography>
      )}
    </ListItemButton>
  );
});

const RecentActivitiesList = memo(function RecentActivitiesList({
  activities,
}: RecentActivitiesListProps) {
  const navigate = useNavigate();
  const handleActivityClick = useCallback(
    (id: string) => {
      navigate(`/activities/${id}`);
    },
    [navigate],
  );

  if (!activities?.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        Brak aktywności.
      </Typography>
    );
  }

  const recent = activities.slice(0, 5);

  return (
    <List disablePadding>
      {recent.map((activity) => (
        <RecentActivityItem
          key={activity.id}
          activity={activity}
          onActivityClick={handleActivityClick}
        />
      ))}
    </List>
  );
});

export default RecentActivitiesList;
