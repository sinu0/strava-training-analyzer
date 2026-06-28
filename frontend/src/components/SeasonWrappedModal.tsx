import { useState, useCallback } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Chip, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material';

import { useSeasonWrapped, type SeasonWrappedData } from '@/hooks/useSeasonWrapped';

interface Slide {
  title: string;
  subtitle: string;
  render: (data: SeasonWrappedData) => React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    title: 'Rok w liczbach',
    subtitle: 'Podsumowanie Twojego sezonu',
    render: (d) => (
      <Stack spacing={1} alignItems="center">
        <Typography variant="h3" fontWeight={900} color="primary.main">{d.totalKm.toFixed(0)} km</Typography>
        <Typography variant="body2" color="text.secondary">łącznie na rowerze</Typography>
        <Stack direction="row" spacing={2}>
          <Chip label={`${d.totalElevation.toFixed(0)} m ↑`} variant="outlined" />
          <Chip label={`${d.totalHours.toFixed(0)} h`} variant="outlined" />
          <Chip label={`${d.totalRides} jazd`} variant="outlined" />
        </Stack>
      </Stack>
    ),
  },
  {
    title: 'Najlepszy miesiąc',
    subtitle: 'Wtedy jeździłeś najwięcej',
    render: (d) => (
      <Typography variant="h4" fontWeight={800} color="secondary.main">{d.bestMonth}</Typography>
    ),
  },
  {
    title: 'Ulubiona pora',
    subtitle: 'Kiedy najchętniej wsiadasz na rower',
    render: (d) => (
      <Stack spacing={1} alignItems="center">
        <Chip label={d.favoriteTime} size="medium" color="primary" />
        <Typography variant="body2" color="text.secondary">{d.favoriteDay} to Twój dzień</Typography>
      </Stack>
    ),
  },
  {
    title: 'Rekordy',
    subtitle: 'Twoje najlepsze wyniki w tym roku',
    render: (d) => (
      <Stack spacing={1.5} alignItems="center" width="100%">
        {d.longestRideName && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} color="warning.main">{d.longestRideKm?.toFixed(0)} km</Typography>
            <Typography variant="caption" color="text.secondary">{d.longestRideName}</Typography>
          </Box>
        )}
        {d.mostElevationName && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} color="error.main">{d.mostElevationM?.toFixed(0)} m</Typography>
            <Typography variant="caption" color="text.secondary">{d.mostElevationName}</Typography>
          </Box>
        )}
      </Stack>
    ),
  },
  {
    title: 'Konsekwencja',
    subtitle: 'Regularność to klucz',
    render: (d) => (
      <Stack spacing={1} alignItems="center">
        <Typography variant="h3" fontWeight={900} color="success.main">{d.longestStreak}</Typography>
        <Typography variant="body2" color="text.secondary">dni z rzędu — najdłuższa seria</Typography>
        <Chip label={`${d.totalActiveDays} dni aktywnych w roku`} variant="outlined" />
      </Stack>
    ),
  },
  {
    title: 'Średnio na jazdę',
    subtitle: 'Twój typowy trening',
    render: (d) => (
      <Typography variant="h4" fontWeight={800} color="info.main">{d.averageKmPerRide.toFixed(0)} km</Typography>
    ),
  },
  {
    title: 'Ciekawostki',
    subtitle: 'Skala Twoich osiągnięć',
    render: (d) => (
      <Stack spacing={1.5} alignItems="center">
        <Chip label={d.distanceFun} color="primary" variant="outlined" />
        <Chip label={d.elevationFun} color="secondary" variant="outlined" />
      </Stack>
    ),
  },
];

export default function SeasonWrappedModal({ year, onClose }: { year: number; onClose: () => void }) {
  const { data, isLoading } = useSeasonWrapped(year);
  const [slide, setSlide] = useState(0);

  const goNext = useCallback(() => {
    if (data && slide < SLIDES.length - 1) setSlide((s) => s + 1);
    else onClose();
  }, [slide, data, onClose]);

  if (isLoading || !data) return null;

  const current = SLIDES[slide];
  if (!current) return null;

  return (
    <Dialog open fullScreen onClose={onClose}>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0D1117',
          backgroundImage: 'radial-gradient(ellipse at center, rgba(255,107,53,0.08) 0%, transparent 70%)',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16 }}>
          <CloseIcon />
        </IconButton>

        <Typography variant="overline" color="text.secondary" letterSpacing={2}>
          {data.year} — SEZON WRAPPED
        </Typography>

        <Box sx={{ minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {current.subtitle}
          </Typography>
          <Typography variant="h4" fontWeight={800}>{current.title}</Typography>
          <Box sx={{ mt: 2 }}>{current.render(data)}</Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {SLIDES.map((_, i) => (
            <Box
              key={i}
              sx={{
                width: i === slide ? 24 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === slide ? 'primary.main' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </Box>

        <Button variant="contained" size="large" onClick={goNext} sx={{ minWidth: 200 }}>
          {slide < SLIDES.length - 1 ? 'Dalej' : 'Zamknij'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
