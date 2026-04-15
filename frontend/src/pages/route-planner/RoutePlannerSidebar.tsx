import { CircularProgress, Paper, Stack, Typography } from '@mui/material';

import SavedRoutesList from '@/components/route/SavedRoutesList';
import RouteControls from '@/components/route-planner/RouteControls';
import RouteStats from '@/components/route-planner/RouteStats';
import type { useRoutePlannerState } from '@/pages/route-planner/useRoutePlannerState';
import { SURFACE_COLORS } from '@/utils/colors';

interface RoutePlannerSidebarProps {
  planner: ReturnType<typeof useRoutePlannerState>;
}

export default function RoutePlannerSidebar({ planner }: RoutePlannerSidebarProps) {
  return (
    <Stack spacing={2} sx={{ height: '100%', minHeight: 0 }}>
      <RouteControls
        routeName={planner.routeName}
        routeDesc={planner.routeDesc}
        mapVariant={planner.mapVariant}
        showWeather={planner.showWeather}
        routingPreferences={planner.routingPreferences}
        routePreview={planner.routePreview}
        generatorDistanceKm={planner.generatorDistanceKm}
        generatorStyle={planner.generatorStyle}
        generatorVariationLevel={planner.generatorVariationLevel}
        isGenerating={planner.isGenerating}
        isRouting={planner.isRouting}
        waypointCount={planner.waypoints.length}
        createRoutePending={planner.createRoutePending}
        generationInfo={planner.generationInfo}
        generationError={planner.generationError}
        defaultGeneratorDistanceKm={planner.defaultGeneratorDistanceKm}
        defaultGeneratorVariation={planner.defaultGeneratorVariation}
        onRouteNameChange={planner.setRouteName}
        onRouteDescChange={planner.setRouteDesc}
        onMapVariantChange={planner.setMapVariant}
        onShowWeatherChange={planner.setShowWeather}
        onRoutingPreferencesChange={planner.setRoutingPreferences}
        onGeneratorDistanceKmChange={planner.setGeneratorDistanceKm}
        onGeneratorStyleChange={planner.setGeneratorStyle}
        onGeneratorVariationLevelChange={planner.setGeneratorVariationLevel}
        onGenerateFromHistory={planner.handleGenerateFromHistory}
        onUndo={planner.handleUndo}
        onClear={planner.handleClear}
        onSave={planner.handleSave}
      />

      {planner.waypoints.length >= 2 && (
        <RouteStats
          totalDistance={planner.totalDistance}
          totalGain={planner.totalGain}
          estimatedTimeSec={planner.estimatedTimeSec}
          estimatedTss={planner.estimatedTss}
          routePreview={planner.routePreview}
          routeProviderLabel={planner.routeProviderLabel}
          generationInfo={planner.generationInfo}
          showWeather={planner.showWeather}
          weatherStopCount={planner.routeWeatherStops.length}
          isRouting={planner.isRouting}
        />
      )}

      <Paper
        sx={{
          p: 2,
          backgroundColor: 'background.default',
          border: `1px solid ${SURFACE_COLORS.strongBorder}`,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Zapisane trasy
        </Typography>
        {planner.routesLoading ? (
          <CircularProgress size={20} />
        ) : (
          <SavedRoutesList
            routes={planner.savedRoutes}
            selectedId={planner.selectedRouteId}
            onSelect={planner.handleSelectRoute}
            onDelete={planner.handleDeleteRoute}
            onExportGpx={planner.handleExportGpx}
          />
        )}
      </Paper>
    </Stack>
  );
}
