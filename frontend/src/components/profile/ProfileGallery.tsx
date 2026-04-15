import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import { useRecentActivities } from '@/hooks/useAnalytics';
import type { ActivitySummary } from '@/types/activity';
import { formatDistance, formatDuration } from '@/utils/formatters';

import type { TransitionProps } from '@mui/material/transitions';

const PAGE_SIZE = 12;

interface PhotoItem {
  url: string;
  activityId: string;
  title: string;
  startedAt?: string;
  activity: ActivitySummary;
}

const NoTransition = forwardRef(function NoTransition(
  props: TransitionProps & { children?: React.ReactElement<unknown> },
  ref,
) {
  const { children } = props;
  void ref;
  return children ?? null;
});

function buildPhotoList(activities: ActivitySummary[]): PhotoItem[] {
  return activities.flatMap((activity) =>
    (activity.photoUrls ?? []).map((url) => ({
      url,
      activityId: activity.id,
      title: activity.name,
      startedAt: activity.startedAt,
      activity,
    })),
  );
}

function formatStartedAt(value?: string) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString('pl-PL');
}

function Stat({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <Box
      sx={{
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 999,
        px: 1.25,
        py: 0.5,
        bgcolor: 'rgba(255,255,255,0.04)',
      }}
    >
      <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.72rem' }}>
        {label}
      </Typography>
      <Typography sx={{ color: 'white', fontSize: '0.82rem', fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ProfileGallery() {
  const { data: activities = [] } = useRecentActivities(200);
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const photos = useMemo(() => buildPhotoList(activities), [activities]);
  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = photos.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const currentPhoto = openIndex === null ? null : photos[openIndex] ?? null;

  const openLightbox = useCallback((index: number) => {
    setOpenIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setOpenIndex(null);
  }, []);

  const goToActivity = useCallback((activityId?: string) => {
    if (activityId) {
      navigate(`/activities/${activityId}`);
    }
  }, [navigate]);

  const showPrevPhoto = useCallback(() => {
    setOpenIndex((value) => {
      if (value === null || photos.length === 0) {
        return value;
      }
      return (value - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNextPhoto = useCallback(() => {
    setOpenIndex((value) => {
      if (value === null || photos.length === 0) {
        return value;
      }
      return (value + 1) % photos.length;
    });
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <EmptyState
        title="Brak zdjęć do wyświetlenia"
        description="Dodaj zdjęcia do aktywności, aby je tu zobaczyć."
        illustration="/illustrations/empty-gallery.png"
      />
    );
  }

  return (
    <Box>
      <Box sx={{ position: 'relative', mb: 2 }}>
        <IconButton
          aria-label="carousel-prev"
          disabled={currentPage === 0}
          onClick={() => setPage((value) => Math.max(0, value - 1))}
          sx={{
            position: 'absolute',
            left: -8,
            top: '40%',
            zIndex: 5,
            bgcolor: 'rgba(0,0,0,0.38)',
            color: 'white',
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.2)' },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 1,
            px: 4,
          }}
        >
          {paged.map((photo, index) => {
            const globalIndex = index + currentPage * PAGE_SIZE;

            return (
              <Box
                key={`${photo.activityId}-${globalIndex}`}
                component="button"
                type="button"
                data-testid={`profile-photo-${globalIndex}`}
                aria-label={`Otwórz zdjęcie: ${photo.title}`}
                onClick={() => openLightbox(globalIndex)}
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  p: 0,
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  bgcolor: '#0D1117',
                  appearance: 'none',
                  transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: 'rgba(255,107,53,0.55)',
                    boxShadow: '0 14px 30px rgba(0,0,0,0.28)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid #FF6B35',
                    outlineOffset: 2,
                  },
                }}
              >
                <Box
                  component="img"
                  src={photo.url}
                  alt={photo.title}
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    pointerEvents: 'none',
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    inset: 'auto 0 0 0',
                    px: 1,
                    py: 0.75,
                    background: 'linear-gradient(180deg, rgba(6,12,18,0) 0%, rgba(6,12,18,0.88) 100%)',
                    textAlign: 'left',
                  }}
                >
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {photo.title}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        <IconButton
          aria-label="carousel-next"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
          sx={{
            position: 'absolute',
            right: -8,
            top: '40%',
            zIndex: 5,
            bgcolor: 'rgba(0,0,0,0.38)',
            color: 'white',
            '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.2)' },
          }}
        >
          <ChevronRightIcon />
        </IconButton>

        {photos.length > PAGE_SIZE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <Box
                key={`dot-${index}`}
                sx={{
                  width: index === currentPage ? 22 : 8,
                  height: 8,
                  borderRadius: 999,
                  bgcolor: index === currentPage ? 'primary.main' : 'rgba(255,255,255,0.16)',
                  mx: 0.4,
                  transition: 'all 0.18s ease',
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {photos.length > PAGE_SIZE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} size="small">
              Poprzednia
            </Button>
            <Typography sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {currentPage + 1} / {totalPages}
            </Typography>
            <Button disabled={currentPage >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} size="small">
              Następna
            </Button>
          </Stack>
        </Box>
      )}

      <Dialog
        open={openIndex !== null}
        onClose={closeLightbox}
        fullScreen
        keepMounted
        TransitionComponent={NoTransition}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(4, 8, 12, 0.98)',
            backgroundImage: 'none',
          },
        }}
      >
        {!!currentPhoto && (
          <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <IconButton
              aria-label="close"
              onClick={closeLightbox}
              sx={{ position: 'absolute', top: 12, right: 12, color: 'white', zIndex: 10 }}
            >
              <CloseIcon />
            </IconButton>

            <IconButton
              aria-label="prev"
              onClick={showPrevPhoto}
              sx={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.35)',
              }}
            >
              <ChevronLeftIcon />
            </IconButton>

            <IconButton
              aria-label="next"
              onClick={showNextPhoto}
              sx={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                zIndex: 10,
                bgcolor: 'rgba(0,0,0,0.35)',
              }}
            >
              <ChevronRightIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', px: { xs: 2, md: 10 }, pb: { xs: 18, md: 16 } }}>
              <Box
                component="img"
                src={currentPhoto.url}
                alt={currentPhoto.title}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </Box>

            <Box
              sx={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                px: { xs: 2, md: 3 },
                py: 2,
                background: 'linear-gradient(180deg, rgba(4,8,12,0) 0%, rgba(4,8,12,0.94) 52%, rgba(4,8,12,0.98) 100%)',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                    {currentPhoto.title}
                  </Typography>
                  {!!currentPhoto.startedAt && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', mt: 0.5 }}>
                      {formatStartedAt(currentPhoto.startedAt)}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                    <Stat label="Dystans" value={currentPhoto.activity.distanceM ? formatDistance(currentPhoto.activity.distanceM) : null} />
                    <Stat label="Czas" value={currentPhoto.activity.movingTimeSec ? formatDuration(currentPhoto.activity.movingTimeSec) : null} />
                    <Stat label="Moc śr." value={currentPhoto.activity.avgPowerW ? `${Math.round(currentPhoto.activity.avgPowerW)} W` : null} />
                    <Stat label="Tętno śr." value={currentPhoto.activity.avgHeartrate ? `${Math.round(currentPhoto.activity.avgHeartrate)} bpm` : null} />
                  </Stack>
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  onClick={() => goToActivity(currentPhoto.activityId)}
                >
                  Otwórz aktywność
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
