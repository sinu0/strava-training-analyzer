
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageContainer from '@/components/common/PageContainer';
import { useTimeline } from '@/hooks/useTimeline';

const TYPE_ICON: Record<string, React.ReactElement> = {
  ACTIVITY: <DirectionsBikeIcon />,
  PR: <EmojiEventsIcon />,
  ACHIEVEMENT: <WorkspacePremiumIcon />,
};

export default function TrainingTimelinePage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const { data: events, isLoading } = useTimeline(undefined, undefined, typeFilter ?? undefined);

  return (
    <PageContainer
      title="Oś czasu"
      subtitle="Chronologiczny przegląd Twoich treningów, rekordów i osiągnięć."
      breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Oś czasu' }]}
    >
      <ToggleButtonGroup
        value={typeFilter ?? 'all'}
        exclusive
        onChange={(_, val) => setTypeFilter(val === 'all' ? null : val)}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all">Wszystko</ToggleButton>
        <ToggleButton value="activity">Aktywności</ToggleButton>
        <ToggleButton value="pr">Rekordy</ToggleButton>
        <ToggleButton value="achievement">Osiągnięcia</ToggleButton>
      </ToggleButtonGroup>

      {!!isLoading && <CircularProgress />}

      <Stack spacing={0}>
        {events?.map((event) => (
          <Box
            key={`${event.date}-${event.type}-${event.title}`}
            onClick={event.link ? () => navigate(event.link!) : undefined}
            sx={{
              display: 'flex',
              gap: 1.5,
              py: 1.5,
              px: 1,
              borderLeft: '2px solid',
              borderColor: event.color ?? 'divider',
              ml: 1,
              cursor: event.link ? 'pointer' : 'default',
              '&:hover': event.link ? { bgcolor: 'rgba(255,255,255,0.02)' } : {},
              borderRadius: '0 8px 8px 0',
            }}
          >
            <Box sx={{ color: event.color, mt: 0.2 }}>{TYPE_ICON[event.type]}</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{event.title}</Typography>
              <Typography variant="caption" color="text.secondary">{event.subtitle}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Chip
                label={event.type === 'PR' ? 'Rekord' : event.type === 'ACHIEVEMENT' ? 'Osiągnięcie' : 'Jazda'}
                size="small"
                sx={{ fontSize: '0.6rem', bgcolor: `${event.color}22`, color: event.color }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {event.date}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </PageContainer>
  );
}
