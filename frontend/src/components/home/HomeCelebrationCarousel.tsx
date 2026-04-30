import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ActivitySummary } from '@/types/activity';
import type { Achievement, FtpProgress, ProgressionLevel } from '@/types/analytics';
import {
  buildHomeCelebrationPayload,
  readHomeCelebrationSnapshot,
  writeHomeCelebrationSnapshot,
} from '@/utils/homeCelebrations';

/**
 * Fullscreen editorial carousel that celebrates newly detected milestones on Home.
 */
export default function HomeCelebrationCarousel({
  latestActivity,
  ftpProgress,
  progressionLevels,
  achievements,
  ready,
}: {
  latestActivity?: ActivitySummary | null;
  ftpProgress?: FtpProgress;
  progressionLevels?: ProgressionLevel[];
  achievements?: Achievement[];
  ready: boolean;
}) {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<ReturnType<typeof buildHomeCelebrationPayload>['slides']>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const activityKey = latestActivity?.id ?? 'no-activity';
  const ftpKey = ftpProgress?.currentFtp ?? 'no-ftp';
  const achievementKey = useMemo(
    () =>
      (achievements ?? [])
        .filter((achievement) => achievement.unlocked)
        .map((achievement) => `${achievement.id}:${achievement.unlockedAt ?? 'unlocked'}`)
        .join('|'),
    [achievements],
  );
  const progressionKey = useMemo(
    () =>
      (progressionLevels ?? [])
        .map((level) => `${level.system}:${level.level}`)
        .join('|'),
    [progressionLevels],
  );

  useEffect(() => {
    if (!ready || typeof window === 'undefined') {
      return;
    }

    const previousSnapshot = readHomeCelebrationSnapshot(window.localStorage);
    const { slides: nextSlides, nextSnapshot } = buildHomeCelebrationPayload(
      {
        latestActivity,
        ftpProgress,
        progressionLevels,
        achievements,
      },
      previousSnapshot,
    );

    writeHomeCelebrationSnapshot(window.localStorage, nextSnapshot);

    if (nextSlides.length === 0) {
      setSlides([]);
      setOpen(false);
      setCurrentIndex(0);
      return;
    }

    setSlides(nextSlides);
    setCurrentIndex(0);
    setOpen(true);
  }, [ready, activityKey, ftpKey, achievementKey, progressionKey, latestActivity, ftpProgress, progressionLevels, achievements]);

  if (!open || slides.length === 0) {
    return null;
  }

  const slide = slides[currentIndex]!;
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <Dialog fullScreen open={open} onClose={() => setOpen(false)}>
      <Box
        sx={{
          minHeight: '100%',
          bgcolor: '#0d1117',
          color: 'common.white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(180deg, rgba(13,17,23,0.45) 0%, rgba(13,17,23,0.88) 100%), url('${slide.artwork}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(0.82) contrast(1.02)',
            transform: 'scale(1.03)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 15% 20%, rgba(78,205,196,0.16), transparent 28%), radial-gradient(circle at 85% 80%, rgba(255,123,57,0.14), transparent 24%)',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            px: { xs: 2.5, md: 5 },
            py: { xs: 2.5, md: 4 },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircleOutlineIcon sx={{ color: slide.accentColor }} />
              <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Nowości po synchronizacji
              </Typography>
            </Stack>

            <IconButton aria-label="Zamknij osiągnięcia" onClick={() => setOpen(false)} sx={{ color: 'common.white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Box
            sx={{
              flex: 1,
              display: 'grid',
              alignItems: 'center',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.05fr) minmax(320px, 0.95fr)' },
              gap: { xs: 3, lg: 5 },
              py: { xs: 3, md: 5 },
            }}
          >
            <Stack spacing={2.25} sx={{ maxWidth: 720 }}>
              <Typography
                variant="overline"
                sx={{
                  color: slide.accentColor,
                  letterSpacing: '0.12em',
                  fontWeight: 800,
                }}
              >
                {slide.eyebrow}
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1.02, maxWidth: 640 }}>
                {slide.title}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.45, maxWidth: 620 }}>
                {slide.description}
              </Typography>

              <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" alignItems="center">
                {slide.badge ? (
                  <Box
                    sx={{
                      px: 1.4,
                      py: 0.9,
                      borderRadius: 999,
                      bgcolor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 82,
                    }}
                  >
                    {slide.badge}
                  </Box>
                ) : null}
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.64)' }}>
                  Karta {currentIndex + 1} z {slides.length}
                </Typography>
              </Stack>
            </Stack>

            <Box
              sx={{
                alignSelf: { xs: 'stretch', lg: 'center' },
                justifySelf: { xs: 'stretch', lg: 'end' },
                p: { xs: 2, md: 2.5 },
                borderRadius: 5,
                bgcolor: 'rgba(13,17,23,0.62)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(18px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                minWidth: { lg: 360 },
              }}
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.12)',
                    height: { xs: 200, md: 240 },
                  }}
                >
                  <Box
                    component="img"
                    src={slide.artwork}
                    alt={slide.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      objectFit: 'cover',
                    }}
                  />
                </Box>

                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ color: slide.accentColor, fontWeight: 800 }}>
                    Co się zmieniło
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
                    Home wychwytuje nowe rzeczy po imporcie i pokazuje je tutaj jako krótkie, pełnoekranowe podsumowanie.
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => {
                      setOpen(false);
                      navigate(slide.ctaTo);
                    }}
                  >
                    {slide.ctaLabel}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={isLastSlide ? <CloseIcon /> : <ChevronRightIcon />}
                    onClick={() => {
                      if (isLastSlide) {
                        setOpen(false);
                        return;
                      }
                      setCurrentIndex((index) => Math.min(index + 1, slides.length - 1));
                    }}
                  >
                    {isLastSlide ? 'Zamknij' : 'Dalej'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>

          {slides.length > 1 ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                color="inherit"
                startIcon={<ChevronLeftIcon />}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
              >
                Wstecz
              </Button>
              <Stack direction="row" spacing={1}>
                {slides.map((item, index) => (
                  <Box
                    key={item.id}
                    sx={{
                      width: index === currentIndex ? 28 : 10,
                      height: 10,
                      borderRadius: 999,
                      bgcolor: index === currentIndex ? slide.accentColor : 'rgba(255,255,255,0.22)',
                      transition: 'all 0.18s ease',
                    }}
                  />
                ))}
              </Stack>
              <Button
                color="inherit"
                endIcon={<ChevronRightIcon />}
                disabled={isLastSlide}
                onClick={() => setCurrentIndex((index) => Math.min(index + 1, slides.length - 1))}
              >
                Dalej
              </Button>
            </Stack>
          ) : null}
        </Box>
      </Box>
    </Dialog>
  );
}
