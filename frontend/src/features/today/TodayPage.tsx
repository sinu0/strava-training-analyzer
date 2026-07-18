import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataUsageOutlinedIcon from '@mui/icons-material/DataUsageOutlined';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PageContainer from '@/components/common/PageContainer';

import { useToday } from './useToday';

const statusLabels = {
  UNKNOWN: 'Brak danych',
  PARTIAL: 'Dane częściowe',
  AVAILABLE: 'Dane aktualne',
} as const;

const confidenceLabels = {
  LOW: 'Podstawa danych: niska',
  MEDIUM: 'Podstawa danych: częściowa',
  HIGH: 'Podstawa danych: pełna',
} as const;

const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  bgcolor: 'background.paper',
} as const;

function formatDuration(seconds?: number | null) {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export default function TodayPage() {
  const navigate = useNavigate();
  const today = useToday();

  if (today.isLoading) return <LoadingState message="Buduję dzisiejszy wniosek…" />;
  if (today.isError || !today.data) {
    return (
      <ErrorState
        title="Nie udało się przygotować widoku Dzisiaj"
        message="Sprawdź synchronizację danych i spróbuj ponownie."
        onRetry={() => void today.refetch()}
      />
    );
  }

  const data = today.data;
  const recommendation = data.recommendation;

  return (
    <PageContainer
      title="Dzisiaj"
      subtitle="Jedna decyzja treningowa, jej podstawa i najbliższy kontekst."
      maxWidth={1320}
      actions={(
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={statusLabels[data.dataStatus]}
            color={data.dataStatus === 'AVAILABLE' ? 'success' : data.dataStatus === 'PARTIAL' ? 'warning' : 'default'}
            variant="outlined"
          />
          <Chip size="small" label={confidenceLabels[data.confidence.level]} variant="outlined" />
        </Stack>
      )}
    >
      {data.dataStatus !== 'AVAILABLE' && (
        <Alert severity={data.dataStatus === 'UNKNOWN' ? 'info' : 'warning'} sx={{ mb: 2.5 }}>
          {data.confidence.reasons.join(' · ')}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              ...panelSx,
              p: { xs: 2.5, md: 4 },
              minHeight: 310,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderColor: 'primary.main',
              background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 20%, ${theme.palette.action.hover} 100%)`,
            }}
          >
            <Box>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>
                Główny wniosek
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, fontWeight: 850, maxWidth: 760 }}>
                {recommendation?.sessionType ?? recommendation?.decision ?? 'Najpierw uzupełnij dane'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 760, lineHeight: 1.7 }}>
                {recommendation?.description
                  ?? 'Po synchronizacji system pokaże rekomendację wraz ze źródłami i zastrzeżeniami.'}
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
              {recommendation?.durationMinutes != null && (
                <Chip label={`${recommendation.durationMinutes} min`} color="primary" />
              )}
              {recommendation?.targetTss != null && <Chip label={`${Math.round(recommendation.targetTss)} TSS`} />}
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/training')}
                sx={{ ml: { sm: 'auto' } }}
              >
                Otwórz plan
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ ...panelSx, p: 2.5, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <InfoOutlinedIcon color="primary" />
              <Typography variant="h6" fontWeight={750}>Dlaczego</Typography>
            </Stack>
            <Stack spacing={1.5}>
              {data.evidence.length > 0 ? data.evidence.map((item) => (
                <Box key={`${item.code}-${item.message}`}>
                  <Typography variant="body2" fontWeight={650}>{item.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.source} · {new Date(item.asOf).toLocaleDateString('pl-PL')}
                  </Typography>
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">
                  Brak wystarczających dowodów. Wniosek nie jest promowany jako pewny.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ ...panelSx, p: 2.25, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DirectionsBikeOutlinedIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={750}>Ostatni trening</Typography>
            </Stack>
            {data.lastActivity ? (
              <>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 750 }}>{data.lastActivity.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {formatDuration(data.lastActivity.movingTimeSec)} · {data.lastActivity.distanceM ? `${(data.lastActivity.distanceM / 1000).toFixed(1)} km` : 'dystans —'}
                </Typography>
                <Button size="small" onClick={() => navigate(`/activities/${data.lastActivity?.id}`)} sx={{ mt: 1.5 }}>
                  Zobacz aktywność
                </Button>
              </>
            ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Brak zsynchronizowanej aktywności.</Typography>}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ ...panelSx, p: 2.25, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <DataUsageOutlinedIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={750}>Obciążenie 7/42 dni</Typography>
            </Stack>
            {data.load ? (
              <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                <Box><Typography variant="h5" fontWeight={800}>{data.load.ctl42.toFixed(1)}</Typography><Typography variant="caption" color="text.secondary">CTL</Typography></Box>
                <Box><Typography variant="h5" fontWeight={800}>{data.load.atl7.toFixed(1)}</Typography><Typography variant="caption" color="text.secondary">ATL</Typography></Box>
                <Box><Typography variant="h5" fontWeight={800}>{data.load.form.toFixed(1)}</Typography><Typography variant="caption" color="text.secondary">Forma</Typography></Box>
              </Stack>
            ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Brak historii wymaganej do obliczenia obciążenia.</Typography>}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ ...panelSx, p: 2.25, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EventOutlinedIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={750}>Następny trening</Typography>
            </Stack>
            {data.nextTraining ? (
              <>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 750 }}>{data.nextTraining.plannedType}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(data.nextTraining.date).toLocaleDateString('pl-PL')} · {data.nextTraining.plannedDurationMin ?? '—'} min
                </Typography>
              </>
            ) : <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Brak zaplanowanej sesji.</Typography>}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ ...panelSx, p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <CloudOutlinedIcon color="primary" />
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="subtitle2" fontWeight={750}>Pogoda jako pełny kontekst treningu</Typography>
              <Typography variant="body2" color="text.secondary">Widok godzinowy, tygodniowy, lokalizacje i ustawienia pozostają dostępne.</Typography>
            </Box>
            <Button variant="outlined" onClick={() => navigate('/weather')}>Otwórz pełną pogodę</Button>
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
