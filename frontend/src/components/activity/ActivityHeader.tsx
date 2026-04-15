import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Chip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface ActivityHeaderProps {
  name: string;
  sportType: string;
  startedAt: string;
}

export default function ActivityHeader({ name, sportType, startedAt }: ActivityHeaderProps) {
  const navigate = useNavigate();
  const dateStr = new Date(startedAt).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.5,
        px: 0.5,
        borderBottom: 1,
        borderColor: 'divider',
        mb: 3,
        flexWrap: 'wrap',
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/activities')}
        sx={{
          color: 'text.secondary',
          textTransform: 'none',
          fontWeight: 500,
          '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
        }}
      >
        Aktywności
      </Button>

      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: 'text.primary', flex: '0 1 auto', minWidth: 0 }}
        noWrap
      >
        {name}
      </Typography>

      <Chip
        label={sportType}
        size="small"
        sx={{
          bgcolor: 'action.hover',
          color: 'primary.main',
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: '6px',
        }}
      />

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', ml: 'auto', whiteSpace: 'nowrap' }}
      >
        {dateStr}
      </Typography>
    </Box>
  );
}
