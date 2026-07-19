import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import PageContainer from '@/components/common/PageContainer';
import RouteElevationChart from '@/components/route-planner/RouteElevationChart';
import RouteMap from '@/components/route-planner/RouteMap';
import MobileShortcutPinButton from '@/components/settings/MobileShortcutPinButton';
import { useSaveUiPreferences, useUiPreferences } from '@/hooks/useUiPreferences';
import RoutePlannerSidebar from '@/pages/route-planner/RoutePlannerSidebar';
import { useRoutePlannerState } from '@/pages/route-planner/useRoutePlannerState';
import { getCyclingHeroIllustrationPath } from '@/utils/illustrationAssets';

export default function RoutePlannerPage() {
  const planner = useRoutePlannerState();
  const preferences = useUiPreferences();
  const savePreferences = useSaveUiPreferences();

  return (
    <PageContainer
      maxWidth={1440}
    >
      <Paper
        sx={{
          position: 'relative',
          minHeight: { xs: 230, md: 270 },
          mb: 2.5,
          overflow: 'hidden',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) => theme.tokens?.cardShadow ?? '0 14px 34px rgba(31, 47, 66, 0.12)',
        }}
      >
        <Box component="img" src={getCyclingHeroIllustrationPath('routes')} alt="" aria-hidden sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <Box sx={{ position: 'absolute', inset: 0, background: (theme) => theme.tokens?.heroScrim ?? 'linear-gradient(90deg, rgba(5,10,16,0.86), rgba(5,10,16,0.18))' }} />
        <Stack spacing={1.1} sx={{ position: 'relative', zIndex: 1, justifyContent: 'center', minHeight: 'inherit', p: { xs: 2.25, sm: 3, md: 4 }, color: '#fff', maxWidth: 760 }}>
          <Chip label="TRASY · PLANOWANIE" size="small" sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', letterSpacing: '0.06em' }} />
          <Typography component="h1" variant="h3" sx={{ color: '#fff', fontWeight: 850 }}>Trasy</Typography>
          <Typography component="h2" variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Zaprojektuj kolejny przejazd</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.82)', maxWidth: 620 }}>Ułóż trasę, porównaj warianty i sprawdź pogodę zanim rozpoczniesz jazdę.</Typography>
          {preferences.data ? (
            <Box sx={{ pt: 0.6 }}>
              <MobileShortcutPinButton
                label="Trasy"
                path="/routes"
                preferences={preferences.data}
                saving={savePreferences.isPending}
                onSave={async (nextPreferences) => {
                  await savePreferences.mutateAsync(nextPreferences);
                }}
              />
            </Box>
          ) : null}
        </Stack>
      </Paper>
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
