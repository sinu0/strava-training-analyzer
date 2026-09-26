
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Chip, Dialog, DialogContent, IconButton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState, useCallback } from 'react';

import { profileMessages, type ProfileTranslator } from '@/components/profile/messages';
import { useSeasonWrapped, type SeasonWrappedData } from '@/hooks/useSeasonWrapped';
import { getAppThemeTokens } from '@/theme/theme';

type SlideId = 'numbers' | 'bestMonth' | 'favoriteTime' | 'records' | 'consistency' | 'average' | 'funFacts';

interface Slide {
  id: SlideId;
  render: (data: SeasonWrappedData, t: ProfileTranslator) => React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    id: 'numbers',
    render: (d, t) => (
      <Stack spacing={1} sx={{
        alignItems: "center"
      }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            color: "primary.main"
          }}>{d.totalKm.toFixed(0)} km</Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>{t('wrapped.totalOnBike')}</Typography>
        <Stack direction="row" spacing={2}>
          <Chip label={`${d.totalElevation.toFixed(0)} m ↑`} variant="outlined" />
          <Chip label={`${d.totalHours.toFixed(0)} h`} variant="outlined" />
          <Chip label={t('wrapped.rides', { count: d.totalRides })} variant="outlined" />
        </Stack>
      </Stack>
    ),
  },
  {
    id: 'bestMonth',
    render: (d) => (
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "secondary.main"
        }}>{d.bestMonth}</Typography>
    ),
  },
  {
    id: 'favoriteTime',
    render: (d, t) => (
      <Stack spacing={1} sx={{
        alignItems: "center"
      }}>
        <Chip label={d.favoriteTime} size="medium" color="primary" />
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>{t('wrapped.favoriteDay', { day: d.favoriteDay })}</Typography>
      </Stack>
    ),
  },
  {
    id: 'records',
    render: (d) => (
      <Stack
        spacing={1.5}
        sx={{
          alignItems: "center",
          width: "100%"
        }}>
        {!!d.longestRideName && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "warning.main"
              }}>{d.longestRideKm?.toFixed(0)} km</Typography>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>{d.longestRideName}</Typography>
          </Box>
        )}
        {!!d.mostElevationName && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "error.main"
              }}>{d.mostElevationM?.toFixed(0)} m</Typography>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>{d.mostElevationName}</Typography>
          </Box>
        )}
      </Stack>
    ),
  },
  {
    id: 'consistency',
    render: (d, t) => (
      <Stack spacing={1} sx={{
        alignItems: "center"
      }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            color: "success.main"
          }}>{d.longestStreak}</Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>{t('wrapped.longestStreak')}</Typography>
        <Chip label={t('wrapped.activeDays', { count: d.totalActiveDays })} variant="outlined" />
      </Stack>
    ),
  },
  {
    id: 'average',
    render: (d) => (
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "info.main"
        }}>{d.averageKmPerRide.toFixed(0)} km</Typography>
    ),
  },
  {
    id: 'funFacts',
    render: (d) => (
      <Stack spacing={1.5} sx={{
        alignItems: "center"
      }}>
        <Chip label={d.distanceFun} color="primary" variant="outlined" />
        <Chip label={d.elevationFun} color="secondary" variant="outlined" />
      </Stack>
    ),
  },
];

export default function SeasonWrappedModal({ year, onClose }: { year: number; onClose: () => void }) {
  const t = profileMessages.useT();
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
          bgcolor: (theme) => getAppThemeTokens(theme).media.thumbnailBg,
          backgroundImage: (theme) => `radial-gradient(ellipse at center, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
          textAlign: 'center',
          gap: 3,
        }}
      >
        <IconButton aria-label={t('wrapped.close')} onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16 }}>
          <CloseIcon />
        </IconButton>

        <Typography
          variant="overline"
          sx={{
            color: "text.secondary",
            letterSpacing: 2
          }}>
          {t('wrapped.heading', { year: data.year })}
        </Typography>

        <Box sx={{ minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{
            color: "text.secondary"
          }}>
            {t(`wrapped.slides.${current.id}.subtitle`)}
          </Typography>
          <Typography variant="h4" sx={{
            fontWeight: 800
          }}>{t(`wrapped.slides.${current.id}.title`)}</Typography>
          <Box sx={{ mt: 2 }}>{current.render(data, t)}</Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {SLIDES.map((item, i) => (
            <Box
              key={item.id}
              sx={{
                width: i === slide ? 24 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === slide ? 'primary.main' : (theme) => getAppThemeTokens(theme).media.pageDot,
                transition: 'all 0.3s',
              }}
            />
          ))}
        </Box>

        <Button variant="contained" size="large" onClick={goNext} sx={{ minWidth: 200 }}>
          {slide < SLIDES.length - 1 ? t('wrapped.next') : t('wrapped.close')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
