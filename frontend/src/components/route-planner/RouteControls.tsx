import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import {
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  FormControlLabel,
  MenuItem,
  Switch,
} from '@mui/material';

import { UI_COLORS } from '../../utils/colors';

import type { MapTileVariant } from '../../constants/mapTiles';
import type { GeneratedRouteStyle, RoutePlanningPreferences, RoutePreview } from '../../types/route';

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

export interface RouteControlsProps {
  routeName: string;
  routeDesc: string;
  mapVariant: MapTileVariant;
  showWeather: boolean;
  routingPreferences: RoutePlanningPreferences;
  routePreview: RoutePreview | null;
  generatorDistanceKm: number;
  generatorStyle: GeneratedRouteStyle;
  generatorVariationLevel: number;
  isGenerating: boolean;
  isRouting: boolean;
  waypointCount: number;
  createRoutePending: boolean;
  generationInfo: { strategy: string } | null;
  generationError: string | null;
  defaultGeneratorDistanceKm: number;
  defaultGeneratorVariation: number;
  onRouteNameChange: (value: string) => void;
  onRouteDescChange: (value: string) => void;
  onMapVariantChange: (value: MapTileVariant) => void;
  onShowWeatherChange: (value: boolean) => void;
  onRoutingPreferencesChange: (updater: (prev: RoutePlanningPreferences) => RoutePlanningPreferences) => void;
  onGeneratorDistanceKmChange: (value: number) => void;
  onGeneratorStyleChange: (value: GeneratedRouteStyle) => void;
  onGeneratorVariationLevelChange: (value: number) => void;
  onGenerateFromHistory: () => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
}

export default function RouteControls({
  routeName,
  routeDesc,
  mapVariant,
  showWeather,
  routingPreferences,
  routePreview,
  generatorDistanceKm,
  generatorStyle,
  generatorVariationLevel,
  isGenerating,
  isRouting,
  waypointCount,
  createRoutePending,
  generationInfo,
  generationError,
  defaultGeneratorDistanceKm,
  defaultGeneratorVariation,
  onRouteNameChange,
  onRouteDescChange,
  onMapVariantChange,
  onShowWeatherChange,
  onRoutingPreferencesChange,
  onGeneratorDistanceKmChange,
  onGeneratorStyleChange,
  onGeneratorVariationLevelChange,
  onGenerateFromHistory,
  onUndo,
  onClear,
  onSave,
}: RouteControlsProps) {
  return (
    <Paper sx={{ p: 2, backgroundColor: UI_COLORS.backgroundDefault, border: `1px solid ${UI_COLORS.divider}` }}>
      <Typography variant="subtitle2" gutterBottom>
        Nowa trasa
      </Typography>
      <Stack spacing={1.5}>
        <TextField
          size="small"
          label="Nazwa trasy"
          value={routeName}
          onChange={(e) => onRouteNameChange(e.target.value)}
          fullWidth
        />
        <TextField
          size="small"
          label="Opis"
          value={routeDesc}
          onChange={(e) => onRouteDescChange(e.target.value)}
          fullWidth
          multiline
          maxRows={2}
        />
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            size="small"
            icon={<DirectionsBikeOutlinedIcon />}
            label="Planner rowerowy"
            color="success"
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<LayersOutlinedIcon />}
            label={mapVariant === 'cycling' ? 'Warstwa rowerowa (beta)' : 'OpenStreetMap'}
            variant="outlined"
          />
          {routePreview?.profile ? (
            <Chip
              size="small"
              label={formatRoutingProfile(routePreview.profile)}
              variant="outlined"
            />
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Warstwa mapy"
            value={mapVariant}
            onChange={(event) => onMapVariantChange(event.target.value as MapTileVariant)}
            sx={{ minWidth: 160, flex: 1 }}
          >
            <MenuItem value="standard">OSM Standard</MenuItem>
            <MenuItem value="cycling">Rowerowa (best effort)</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Ruch"
            value={routingPreferences.trafficPreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                trafficPreference: event.target.value as RoutePlanningPreferences['trafficPreference'],
              }))
            }
            sx={{ minWidth: 140, flex: 1 }}
          >
            <MenuItem value="quieter">Spokojniej</MenuItem>
            <MenuItem value="balanced">Balans</MenuItem>
            <MenuItem value="direct">Bez objazdów</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Nawierzchnia"
            value={routingPreferences.surfacePreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                surfacePreference: event.target.value as RoutePlanningPreferences['surfacePreference'],
              }))
            }
            sx={{ minWidth: 150, flex: 1 }}
          >
            <MenuItem value="asphalt">Asfalt</MenuItem>
            <MenuItem value="balanced">Bez preferencji</MenuItem>
            <MenuItem value="gravel">Szuter</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Długość"
            value={routingPreferences.distancePreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                distancePreference: event.target.value as RoutePlanningPreferences['distancePreference'],
              }))
            }
            sx={{ minWidth: 150, flex: 1 }}
          >
            <MenuItem value="shortest">Najkrócej</MenuItem>
            <MenuItem value="balanced">Balans</MenuItem>
            <MenuItem value="longer">Trochę dłużej</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Profil"
            value={routingPreferences.climbPreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                climbPreference: event.target.value as RoutePlanningPreferences['climbPreference'],
              }))
            }
            sx={{ minWidth: 150, flex: 1 }}
          >
            <MenuItem value="flatter">Mniej podjazdów</MenuItem>
            <MenuItem value="balanced">Balans</MenuItem>
            <MenuItem value="hillier">Więcej przewyższeń</MenuItem>
          </TextField>
        </Stack>
        <FormControlLabel
          control={(
            <Switch
              checked={showWeather}
              onChange={(event) => onShowWeatherChange(event.target.checked)}
              color="primary"
            />
          )}
          label={(
            <Stack direction="row" spacing={1} alignItems="center">
              <WbSunnyOutlinedIcon fontSize="small" />
              <Typography variant="body2">Pokaż dymki pogodowe na trasie</Typography>
            </Stack>
          )}
        />
        <Typography variant="caption" color="text.secondary">
          Kliknij trasę dokładnie tam, gdzie chcesz wstawić punkt pośredni — meta zostaje
          ostatnim punktem. Potem przeciągnij numerowany marker, aby dopracować przebieg.
        </Typography>
        <Divider sx={{ borderColor: UI_COLORS.divider }} />
        <Stack spacing={1.2}>
          <Typography variant="subtitle2">
            Generator z historii
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <TextField
              size="small"
              type="number"
              label="Cel dystansu (km)"
              value={generatorDistanceKm}
              onChange={(event) => onGeneratorDistanceKmChange(Number(event.target.value) || defaultGeneratorDistanceKm)}
              inputProps={{ min: 20, max: 220, step: 5 }}
              sx={{ minWidth: 150, flex: 1 }}
            />
            <TextField
              select
              size="small"
              label="Charakter"
              value={generatorStyle}
              onChange={(event) => onGeneratorStyleChange(event.target.value as GeneratedRouteStyle)}
              sx={{ minWidth: 150, flex: 1 }}
            >
              <MenuItem value="balanced">Podobna</MenuItem>
              <MenuItem value="longer">Dłuższa</MenuItem>
              <MenuItem value="harder">Trudniejsza</MenuItem>
              <MenuItem value="easier">Łagodniejsza</MenuItem>
            </TextField>
            <TextField
              size="small"
              type="number"
              label="Losowość (%)"
              value={generatorVariationLevel}
              onChange={(event) => onGeneratorVariationLevelChange(Number(event.target.value) || defaultGeneratorVariation)}
              inputProps={{ min: 5, max: 95, step: 5 }}
              sx={{ minWidth: 140, flex: 1 }}
            />
          </Stack>
          <Button
            size="small"
            variant="outlined"
            onClick={onGenerateFromHistory}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generowanie…' : 'Generuj 3 warianty'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Generator bazuje na Twoich zapisanych trasach i wcześniejszych aktywnościach.
            Jeśli ustawisz pierwszy punkt na mapie, potraktuje go jako preferowany start i przygotuje
            kilka wariantów do porównania.
          </Typography>
          {generationInfo ? (
            <Alert severity="success" icon={false}>
              {generationInfo.strategy}
            </Alert>
          ) : null}
          {generationError ? (
            <Alert severity="error">
              {generationError}
            </Alert>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<UndoIcon />} onClick={onUndo} disabled={waypointCount === 0}>
            Cofnij
          </Button>
          <Button size="small" startIcon={<DeleteSweepIcon />} onClick={onClear} disabled={waypointCount === 0}>
            Wyczyść
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={isRouting ? <CircularProgress size={14} /> : <SaveIcon />}
            onClick={onSave}
            disabled={!routeName.trim() || waypointCount < 2 || createRoutePending}
          >
            Zapisz
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
