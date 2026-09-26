import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import { Typography, Button, TextField, Stack, Divider, CircularProgress, Alert, Chip, FormControlLabel, MenuItem, Switch } from '@mui/material';

import { Surface } from '@/ui';

import { routePlannerControlsMessages } from './messages';

import type { MapTileVariant } from '../../constants/mapTiles';
import type { GeneratedRouteStyle, RoutePlanningPreferences, RoutePreview } from '../../types/route';

function formatRoutingProfile(profile: string, t: ReturnType<typeof routePlannerControlsMessages.useT>): string {
  switch (profile) {
    case 'safety':
      return t('routingProfile.safety');
    case 'shortest':
      return t('routingProfile.shortest');
    case 'gravel':
      return t('routingProfile.gravel');
    case 'trekking':
      return t('routingProfile.trekking');
    case 'hillclimb':
      return t('routingProfile.hillclimb');
    case 'saved-route':
      return t('routingProfile.savedRoute');
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
  const t = routePlannerControlsMessages.useT();
  return (
    <Surface>
      <Typography variant="subtitle2" gutterBottom>
        {t('controls.newRouteTitle')}
      </Typography>
      <Stack spacing={1.5}>
        <TextField
          size="small"
          label={t('controls.routeNameLabel')}
          value={routeName}
          onChange={(e) => onRouteNameChange(e.target.value)}
          fullWidth
        />
        <TextField
          size="small"
          label={t('controls.routeDescLabel')}
          value={routeDesc}
          onChange={(e) => onRouteDescChange(e.target.value)}
          fullWidth
          multiline
          maxRows={2}
        />
        <Stack direction="row" spacing={1} useFlexGap sx={{
          flexWrap: "wrap"
        }}>
          <Chip
            size="small"
            icon={<DirectionsBikeOutlinedIcon />}
            label={t('controls.cyclingPlannerChip')}
            color="success"
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<LayersOutlinedIcon />}
            label={mapVariant === 'cycling' ? t('controls.cyclingLayerChip') : t('controls.osmLayerChip')}
            variant="outlined"
          />
          {routePreview?.profile ? (
            <Chip
              size="small"
              label={formatRoutingProfile(routePreview.profile, t)}
              variant="outlined"
            />
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{
          flexWrap: "wrap"
        }}>
          <TextField
            select
            size="small"
            label={t('controls.mapLayerLabel')}
            value={mapVariant}
            onChange={(event) => onMapVariantChange(event.target.value as MapTileVariant)}
            sx={{ minWidth: 160, flex: 1 }}
          >
            <MenuItem value="standard">{t('controls.mapLayerStandard')}</MenuItem>
            <MenuItem value="cycling">{t('controls.mapLayerCycling')}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label={t('controls.trafficLabel')}
            value={routingPreferences.trafficPreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                trafficPreference: event.target.value as RoutePlanningPreferences['trafficPreference'],
              }))
            }
            sx={{ minWidth: 140, flex: 1 }}
          >
            <MenuItem value="quieter">{t('controls.trafficQuieter')}</MenuItem>
            <MenuItem value="balanced">{t('controls.trafficBalanced')}</MenuItem>
            <MenuItem value="direct">{t('controls.trafficDirect')}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label={t('controls.surfaceLabel')}
            value={routingPreferences.surfacePreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                surfacePreference: event.target.value as RoutePlanningPreferences['surfacePreference'],
              }))
            }
            sx={{ minWidth: 150, flex: 1 }}
          >
            <MenuItem value="asphalt">{t('controls.surfaceAsphalt')}</MenuItem>
            <MenuItem value="balanced">{t('controls.surfaceBalanced')}</MenuItem>
            <MenuItem value="gravel">{t('controls.surfaceGravel')}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label={t('controls.distanceLabel')}
            value={routingPreferences.distancePreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                distancePreference: event.target.value as RoutePlanningPreferences['distancePreference'],
              }))
            }
            sx={{ minWidth: 150, flex: 1 }}
          >
            <MenuItem value="shortest">{t('controls.distanceShortest')}</MenuItem>
            <MenuItem value="balanced">{t('controls.distanceBalanced')}</MenuItem>
            <MenuItem value="longer">{t('controls.distanceLonger')}</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label={t('controls.climbLabel')}
            value={routingPreferences.climbPreference}
            onChange={(event) =>
              onRoutingPreferencesChange((current) => ({
                ...current,
                climbPreference: event.target.value as RoutePlanningPreferences['climbPreference'],
              }))
            }
            sx={{ minWidth: 150, flex: 1 }}
          >
            <MenuItem value="flatter">{t('controls.climbFlatter')}</MenuItem>
            <MenuItem value="balanced">{t('controls.climbBalanced')}</MenuItem>
            <MenuItem value="hillier">{t('controls.climbHillier')}</MenuItem>
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
            <Stack direction="row" spacing={1} sx={{
              alignItems: "center"
            }}>
              <WbSunnyOutlinedIcon fontSize="small" />
              <Typography variant="body2">{t('controls.showWeatherLabel')}</Typography>
            </Stack>
          )}
        />
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          {t('controls.clickHint')}
        </Typography>
        <Divider />
        <Stack spacing={1.2}>
          <Typography variant="subtitle2">
            {t('controls.generatorTitle')}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{
            flexWrap: "wrap"
          }}>
            <TextField
              size="small"
              type="number"
              label={t('controls.generatorDistanceLabel')}
              value={generatorDistanceKm}
              onChange={(event) => onGeneratorDistanceKmChange(Number(event.target.value) || defaultGeneratorDistanceKm)}
              sx={{ minWidth: 150, flex: 1 }}
              slotProps={{
                htmlInput: { min: 20, max: 220, step: 5 }
              }}
            />
            <TextField
              select
              size="small"
              label={t('controls.generatorStyleLabel')}
              value={generatorStyle}
              onChange={(event) => onGeneratorStyleChange(event.target.value as GeneratedRouteStyle)}
              sx={{ minWidth: 150, flex: 1 }}
            >
              <MenuItem value="balanced">{t('controls.styleBalanced')}</MenuItem>
              <MenuItem value="longer">{t('controls.styleLonger')}</MenuItem>
              <MenuItem value="harder">{t('controls.styleHarder')}</MenuItem>
              <MenuItem value="easier">{t('controls.styleEasier')}</MenuItem>
            </TextField>
            <TextField
              size="small"
              type="number"
              label={t('controls.generatorVariationLabel')}
              value={generatorVariationLevel}
              onChange={(event) => onGeneratorVariationLevelChange(Number(event.target.value) || defaultGeneratorVariation)}
              sx={{ minWidth: 140, flex: 1 }}
              slotProps={{
                htmlInput: { min: 5, max: 95, step: 5 }
              }}
            />
          </Stack>
          <Button
            size="small"
            variant="outlined"
            onClick={onGenerateFromHistory}
            disabled={isGenerating}
          >
            {isGenerating ? t('controls.generating') : t('controls.generateButton')}
          </Button>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            {t('controls.generatorHint')}
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
            {t('controls.undo')}
          </Button>
          <Button size="small" startIcon={<DeleteSweepIcon />} onClick={onClear} disabled={waypointCount === 0}>
            {t('controls.clear')}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={isRouting ? <CircularProgress size={14} /> : <SaveIcon />}
            onClick={onSave}
            disabled={!routeName.trim() || waypointCount < 2 || createRoutePending}
          >
            {t('controls.save')}
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
