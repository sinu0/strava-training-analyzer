import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, IconButton, Stack, Dialog, Popover, Typography } from '@mui/material';
import { useEffect, useMemo, useState, useRef } from 'react';


import {
  COMMON_COLORS,
  STATUS_COLORS,
  UI_COLORS,
  alphaColor,
} from '@/utils/colors';
import { formatDistance, formatDuration } from '@/utils/formatters';

import ActivityMap from './ActivityMap';
import { extractActivityRoutePositions } from '../utils/map';

import type { GeoJsonFeature } from '../types/activity';

interface ActivityMediaCarouselProps {
  activityName: string;
  geoJson: GeoJsonFeature | null;
  photoUrls?: string[] | null;
  latStream?: number[] | null;
  lngStream?: number[] | null;
  summaryPolyline?: string | null;
  activitySummary?: {
    movingTimeSec?: number | null;
    distanceM?: number | null;
    avgPowerW?: number | null;
    avgHeartrate?: number | null;
  } | null;
}

interface MediaItem {
  key: string;
  type: 'map' | 'photo';
  url?: string;
}

export default function ActivityMediaCarousel({
  activityName,
  geoJson,
  photoUrls,
  latStream,
  lngStream,
  summaryPolyline,
  activitySummary,
}: ActivityMediaCarouselProps) {
  const mapPositions = useMemo(
    () => extractActivityRoutePositions({ geoJson, latStream, lngStream, summaryPolyline }),
    [geoJson, latStream, lngStream, summaryPolyline],
  );

  const items = useMemo<MediaItem[]>(() => {
    const media: MediaItem[] = [];
    const hasMap = mapPositions.length >= 2;

    if (hasMap) {
      media.push({ key: 'map', type: 'map' });
    }

    (photoUrls ?? []).forEach((url, index) => {
      media.push({ key: `photo-${index}`, type: 'photo', url });
    });

    return media;
  }, [mapPositions.length, photoUrls]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);
  const longPressTimeout = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(items.length - 1, 0)));
  }, [items.length]);

  if (!items.length) return null;

  const activeItem = items[activeIndex]!;

  const openInfo = (anchor: HTMLElement | null) => setInfoAnchor(anchor);
  const closeInfo = () => setInfoAnchor(null);

  const handleInfoMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (longPressTimeout.current) window.clearTimeout(longPressTimeout.current);
    const target = e.currentTarget as HTMLElement;
    // long-press to open
    longPressTimeout.current = window.setTimeout(() => openInfo(target), 500);
  };
  const handleInfoMouseUp = () => {
    if (longPressTimeout.current) {
      window.clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Media content (click to open full-screen) */}
      <Box sx={{ minHeight: 320, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setOpenDialog(true)}>
        {activeItem.type === 'map' ? (
          <ActivityMap
            geoJson={geoJson}
            latStream={latStream}
            lngStream={lngStream}
            summaryPolyline={summaryPolyline}
            minHeight={360}
          />
        ) : (
          <Box
            component="img"
            src={activeItem.url}
            alt={activityName}
            sx={{
              width: '100%',
              height: { xs: 320, md: 380 },
              objectFit: 'cover',
              display: 'block',
              borderRadius: 1.5,
            }}
          />
        )}
      </Box>

      {/* Navigation overlay */}
      {items.length > 1 && (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            maxWidth: 'calc(100% - 24px)',
            bgcolor: alphaColor(UI_COLORS.backgroundDefault, 0.76),
            borderRadius: 999,
            px: 0.5,
            py: 0.25,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alphaColor(COMMON_COLORS.white, 0.14)}`,
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setActiveIndex((c) => (c - 1 + items.length) % items.length); }}
            sx={{ color: COMMON_COLORS.white, p: 0.3 }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Box
            component="span"
            sx={{
              color: COMMON_COLORS.white,
              fontSize: '0.72rem',
              fontWeight: 700,
              px: 0.75,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              maxWidth: 48,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeIndex + 1}/{items.length}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setActiveIndex((c) => (c + 1) % items.length); }}
            sx={{ color: COMMON_COLORS.white, p: 0.3 }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}

      {/* Dot indicators */}
      {items.length > 1 && (
        <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 1 }}>
          {items.map((item, i) => (
            <Box
              key={item.key}
              onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
              sx={{
                width: i === activeIndex ? 18 : 6,
                height: 6,
                borderRadius: 999,
                bgcolor: i === activeIndex ? STATUS_COLORS.accent : alphaColor(COMMON_COLORS.white, 0.25),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Stack>
      )}

      {/* Fullscreen dialog / lightbox */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullScreen>
        <Box sx={{ position: 'relative', height: '100vh', bgcolor: COMMON_COLORS.black }}>
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', left: 12, top: 12, color: COMMON_COLORS.white, zIndex: 30 }}
            aria-label="Zamknij"
          >
            <CloseIcon />
          </IconButton>

          {/* Prev/Next */}
          <IconButton
            onClick={(e) => { e.stopPropagation(); setActiveIndex((c) => (c - 1 + items.length) % items.length); }}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: COMMON_COLORS.white,
              background: alphaColor(COMMON_COLORS.black, 0.35),
              zIndex: 25,
            }}
            aria-label="Poprzednie"
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); setActiveIndex((c) => (c + 1) % items.length); }}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: COMMON_COLORS.white,
              background: alphaColor(COMMON_COLORS.black, 0.35),
              zIndex: 25,
            }}
            aria-label="Następne"
          >
            <ChevronRightIcon />
          </IconButton>

          {/* Content */}
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeItem.type === 'map' ? (
              <Box sx={{ width: '100%', height: '100%' }}>
                <ActivityMap
                  geoJson={geoJson}
                  latStream={latStream}
                  lngStream={lngStream}
                  summaryPolyline={summaryPolyline}
                  minHeight={0}
                />
              </Box>
            ) : (
              <Box component="img" src={activeItem.url} alt={activityName} sx={{ maxHeight: '100vh', maxWidth: '100%', objectFit: 'contain' }} />
            )}
          </Box>

          {/* Info icon (long-press or click) */}
          <IconButton
            onMouseDown={handleInfoMouseDown}
            onMouseUp={handleInfoMouseUp}
            onMouseLeave={handleInfoMouseUp}
            onClick={(e) => { e.stopPropagation(); openInfo(e.currentTarget as HTMLElement); }}
            sx={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              color: COMMON_COLORS.white,
              background: alphaColor(COMMON_COLORS.black, 0.4),
              zIndex: 30,
            }}
            aria-label="Info"
          >
            <InfoOutlinedIcon />
          </IconButton>

          <Popover
            open={Boolean(infoAnchor)}
            anchorEl={infoAnchor}
            onClose={closeInfo}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Box sx={{ p: 2, minWidth: 220 }}>
              <Typography sx={{ fontWeight: 700 }}>{activityName}</Typography>
              <Typography sx={{ color: UI_COLORS.textSecondary, fontSize: '0.85rem', mt: 0.5 }}>
                {activitySummary?.distanceM ? formatDistance(activitySummary.distanceM) : 'Brak dystansu'}
              </Typography>
              <Typography sx={{ color: UI_COLORS.textSecondary, fontSize: '0.85rem' }}>
                {activitySummary?.movingTimeSec ? formatDuration(activitySummary.movingTimeSec) : 'Brak czasu'}
              </Typography>
              {activitySummary?.avgPowerW ? (
                <Typography sx={{ color: UI_COLORS.textSecondary, fontSize: '0.85rem' }}>Śr. moc: {Math.round(activitySummary.avgPowerW)} W</Typography>
              ) : null}
              {activitySummary?.avgHeartrate ? (
                <Typography sx={{ color: UI_COLORS.textSecondary, fontSize: '0.85rem' }}>Śr. tętno: {Math.round(activitySummary.avgHeartrate)} bpm</Typography>
              ) : null}
            </Box>
          </Popover>
        </Box>
      </Dialog>
    </Box>
  );
}
