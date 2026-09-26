import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';

import RouteElevationChart from '@/components/route-planner/RouteElevationChart';
import RouteMap from '@/components/route-planner/RouteMap';
import MobileShortcutPinButton from '@/components/settings/MobileShortcutPinButton';
import { useSaveUiPreferences, useUiPreferences } from '@/hooks/useUiPreferences';
import { useI18n } from '@/i18n';
import RoutePlannerSidebar from '@/pages/route-planner/RoutePlannerSidebar';
import { useRoutePlannerState } from '@/pages/route-planner/useRoutePlannerState';
import { getAppThemeTokens } from '@/theme/theme';
import { HeroCard, Page } from '@/ui';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';

export default function RoutePlannerPage() {
  const planner = useRoutePlannerState();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();
  const { t } = useI18n();

  return (
    <Page
      maxWidth={1440}
    >
      <Box sx={{ mb: 2.5 }}>
        <HeroCard
          image={{ src: getCyclingHeroIllustrationPath('routes'), alt: 'Górska droga z zakrętami' }}
          eyebrow="Trasy · planowanie"
          title="Trasy"
          headingComponent="h1"
          description="Zaprojektuj kolejny przejazd: ułóż trasę, porównaj warianty i sprawdź pogodę zanim rozpoczniesz jazdę."
          minHeight={{ xs: 260, md: 290 }}
        >
          {preferences.data ? (
            <Box
              sx={(theme) => {
                const tokens = getAppThemeTokens(theme);
                return {
                  pt: 1.5,
                  '& .MuiButton-root': { color: tokens.media.ink, bgcolor: tokens.glass.bg, border: `1px solid ${tokens.glass.border}`, backdropFilter: tokens.glass.blur },
                };
              }}
            >
              <MobileShortcutPinButton
                label={t('nav.routes.label')}
                path="/routes"
                preferences={preferences.data}
                saving={savePreferences.isPending}
                onSave={async (nextPreferences) => {
                  await savePreferences.mutateAsync(nextPreferences);
                }}
              />
            </Box>
          ) : null}
        </HeroCard>
      </Box>
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
    </Page>
  );
}
