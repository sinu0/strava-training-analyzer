import { Box, Typography } from '@mui/material';
import PerformancePredictionPanel from '@/components/PerformancePredictionPanel';

export default function PerformancePredictionPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Prognoza formy
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Oszacuj optymalne okno peak performance na podstawie danych PMC (CTL/ATL/TSB), trendów treningowych i sygnalow recovery.
      </Typography>
      <PerformancePredictionPanel />
    </Box>
  );
}
