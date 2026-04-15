import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  IconButton,
  Button,
} from '@mui/material';

import {
  COMMON_COLORS,
  ROUTE_COLORS,
  UI_COLORS,
  alphaColor,
} from '../../utils/colors';
import RouteDrawingMap, { type RouteWeatherMarker } from '../route/RouteDrawingMap';

import type { MapTileVariant } from '../../constants/mapTiles';
import type { GeneratedRouteSuggestion, GeneratedRouteStyle } from '../../types/route';

function formatGeneratedStyle(style: GeneratedRouteStyle): string {
  switch (style) {
    case 'easier':
      return 'Łagodniejsza';
    case 'harder':
      return 'Trudniejsza';
    case 'longer':
      return 'Dłuższa';
    case 'balanced':
    default:
      return 'Bazowa';
  }
}

function formatRoutingProfile(profile: string): string {
  switch (profile) {
    case 'safety':
      return 'Spokojniej / ścieżki';
    case 'shortest':
      return 'Najkrócej';
    case 'gravel':
      return 'Szuter';
    case 'trekking':
      return 'Uniwersalnie';
    case 'hillclimb':
      return 'Więcej przewyższeń';
    case 'saved-route':
      return 'Zapisana trasa';
    default:
      return profile;
  }
}

export interface RouteMapProps {
  waypoints: [number, number][];
  polyline: [number, number][];
  mapVariant: MapTileVariant;
  weatherStops: RouteWeatherMarker[];
  showWeather: boolean;
  highlightIdx: number | null;
  generatedAlternatives: GeneratedRouteSuggestion[];
  selectedAlternativeIndex: number;
  createRoutePending: boolean;
  onAddWaypoint: (latlng: [number, number], afterIndex?: number) => void;
  onMoveWaypoint: (index: number, latlng: [number, number]) => void;
  onRemoveWaypoint: (index: number) => void;
  onCycleAlternative: (direction: -1 | 1) => void;
  onSelectAlternative: (index: number) => void;
  onSaveAlternative: (suggestion: GeneratedRouteSuggestion) => void;
}

export default function RouteMap({
  waypoints,
  polyline,
  mapVariant,
  weatherStops,
  showWeather,
  highlightIdx,
  generatedAlternatives,
  selectedAlternativeIndex,
  createRoutePending,
  onAddWaypoint,
  onMoveWaypoint,
  onRemoveWaypoint,
  onCycleAlternative,
  onSelectAlternative,
  onSaveAlternative,
}: RouteMapProps) {
  return (
    <Paper
      sx={{
        height: '100%',
        overflow: 'hidden',
        backgroundColor: UI_COLORS.backgroundDefault,
        border: `1px solid ${UI_COLORS.divider}`,
        position: 'relative',
      }}
    >
      <RouteDrawingMap
        waypoints={waypoints}
        polyline={polyline}
        mapVariant={mapVariant}
        weatherStops={weatherStops}
        showWeather={showWeather}
        onAddWaypoint={onAddWaypoint}
        onMoveWaypoint={onMoveWaypoint}
        onRemoveWaypoint={onRemoveWaypoint}
        highlightIndex={highlightIdx}
      />
      {generatedAlternatives.length > 0 ? (
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 10, md: 20 },
            right: { xs: 10, md: 'auto' },
            bottom: 16,
            zIndex: 1200,
            width: { xs: 'auto', md: 360 },
            maxWidth: 'calc(100% - 20px)',
            p: 1.25,
            borderRadius: 3,
            bgcolor: alphaColor(UI_COLORS.backgroundDefault, 0.9),
            border: `1px solid ${alphaColor(COMMON_COLORS.white, 0.14)}`,
            backdropFilter: 'blur(12px)',
            boxShadow: `0 20px 40px ${alphaColor(COMMON_COLORS.black, 0.35)}`,
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Chip
                  size="small"
                  label={formatGeneratedStyle(generatedAlternatives[selectedAlternativeIndex]?.style ?? 'balanced')}
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="body2" fontWeight={700}>
                  {generatedAlternatives[selectedAlternativeIndex]?.sourceName}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  size="small"
                  aria-label="Poprzednia propozycja"
                  onClick={() => onCycleAlternative(-1)}
                  sx={{ color: UI_COLORS.textPrimary }}
                >
                  <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Następna propozycja"
                  onClick={() => onCycleAlternative(1)}
                  sx={{ color: UI_COLORS.textPrimary }}
                >
                  <ArrowForwardIosRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            </Stack>
            <Typography variant="caption" sx={{ color: alphaColor(UI_COLORS.textPrimary, 0.72) }}>
              {generatedAlternatives[selectedAlternativeIndex]?.strategy}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                size="small"
                label={`${((generatedAlternatives[selectedAlternativeIndex]?.preview.distanceM ?? 0) / 1000).toFixed(1)} km`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${Math.round(generatedAlternatives[selectedAlternativeIndex]?.preview.elevationGainM ?? 0)} m`}
                variant="outlined"
              />
              <Chip
                size="small"
                label={formatRoutingProfile(generatedAlternatives[selectedAlternativeIndex]?.preview.profile ?? 'safety')}
                variant="outlined"
              />
            </Stack>
            <Stack direction="row" justifyContent="center" spacing={0.75}>
              {generatedAlternatives.map((suggestion, index) => (
                <Box
                  key={`${suggestion.seed}-${suggestion.style}-dot`}
                  component="button"
                  type="button"
                  aria-label={`Pokaż propozycję ${index + 1}`}
                  onClick={() => onSelectAlternative(index)}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                     border: 0,
                     p: 0,
                     cursor: 'pointer',
                     bgcolor: index === selectedAlternativeIndex
                       ? ROUTE_COLORS.alternative
                       : alphaColor(UI_COLORS.textPrimary, 0.28),
                   }}
                 />
              ))}
            </Stack>
            <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 0.5 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => {
                  const suggestion = generatedAlternatives[selectedAlternativeIndex];
                  if (!suggestion) return;
                  onSaveAlternative(suggestion);
                }}
                disabled={createRoutePending}
              >
                Zapisz sugestię
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}
    </Paper>
  );
}
