import Grid from '@mui/material/Grid';

import PageContainer from '@/components/common/PageContainer';
import RouteElevationChart from '@/components/route-planner/RouteElevationChart';
import RouteMap from '@/components/route-planner/RouteMap';
import MobileShortcutPinButton from '@/components/settings/MobileShortcutPinButton';
import { useSaveUiPreferences, useUiPreferences } from '@/hooks/useUiPreferences';
import RoutePlannerSidebar from '@/pages/route-planner/RoutePlannerSidebar';
import { useRoutePlannerState } from '@/pages/route-planner/useRoutePlannerState';

export default function RoutePlannerPage() {
  const planner = useRoutePlannerState();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();

  return (
    <PageContainer
      title="Trasy"
      subtitle="Zaplanuj przejazd, porównaj warianty i sprawdź pogodę na trasie."
      maxWidth={1440}
      actions={preferences.data ? (
        <MobileShortcutPinButton
          label="Trasy"
          path="/routes"
          preferences={preferences.data}
          saving={savePreferences.isPending}
          onSave={async (nextPreferences) => {
            await savePreferences.mutateAsync(nextPreferences);
          }}
        />
      ) : undefined}
    >
      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ minHeight: 400 }}>
          <RouteMap
            waypoints={planner.waypoints}
            polyline={planner.polyline}
            mapVariant={planner.mapVariant}
            weatherStops={planner.routeWeatherStops}
            showWeather={planner.showWeather}
            highlightIdx={planner.highlightIdx}
            generatedAlternatives={planner.generatedAlternatives}
            selectedAlternativeIndex={planner.selectedAlternativeIndex}
            createRoutePending={planner.createRoutePending}
            onAddWaypoint={planner.handleAddWaypoint}
            onMoveWaypoint={planner.handleMoveWaypoint}
            onRemoveWaypoint={planner.handleRemoveWaypoint}
            onCycleAlternative={planner.handleCycleAlternative}
            onSelectAlternative={planner.handleSelectAlternative}
            onSaveAlternative={planner.handleSaveAlternative}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }} sx={{ minHeight: 0 }}>
          <RoutePlannerSidebar planner={planner} />
        </Grid>
      </Grid>

      <RouteElevationChart
        elevationPoints={planner.elevationPoints}
        onHover={planner.setHighlightIdx}
      />
    </PageContainer>
  );
}
