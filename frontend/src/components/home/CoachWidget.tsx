import { AutoAwesome } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { STATUS_COLORS, alphaColor } from '@/utils/colors';

export default function CoachWidget() {
  const navigate = useNavigate();

  return (
    <Paper
      sx={{
        p: { xs: 1.75, md: 2 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: alphaColor(STATUS_COLORS.accent, 0.15),
        background: `linear-gradient(135deg, ${alphaColor(STATUS_COLORS.accent, 0.06)}, ${alphaColor(STATUS_COLORS.success, 0.03)})`,
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome sx={{ color: STATUS_COLORS.accent, fontSize: 18 }} />
          <Typography
            variant="overline"
            sx={{
              color: STATUS_COLORS.accent,
              letterSpacing: '0.08em',
              fontWeight: 800,
              fontSize: '0.65rem',
            }}
          >
            Coach
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          Sprawdz pelna analize, decyzje na dziś, cel treningowy i AI insights.
        </Typography>
        <Button
          variant="contained"
          size="small"
          fullWidth
          startIcon={<AutoAwesome />}
          onClick={() => navigate('/coach')}
          sx={{
            fontWeight: 700,
            fontSize: '0.72rem',
            bgcolor: STATUS_COLORS.accent,
            '&:hover': { bgcolor: STATUS_COLORS.accent, filter: 'brightness(1.1)' },
          }}
        >
          Otworz Coacha
        </Button>
      </Stack>
    </Paper>
  );
}
