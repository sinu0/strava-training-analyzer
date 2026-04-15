package pl.strava.analizator.infrastructure.web;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.RouteGeneratorService;
import pl.strava.analizator.application.RoutePlannerService;
import pl.strava.analizator.domain.model.GeneratedRouteSuggestion;
import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;
import pl.strava.analizator.infrastructure.config.SecurityConfig;

@WebMvcTest(RoutePlannerController.class)
@Import(SecurityConfig.class)
class RoutePlannerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RoutePlannerService routePlannerService;

    @MockitoBean
    private RouteGeneratorService routeGeneratorService;

    @Test
    void previewRouteAcceptsLowercasePreferencesFromFrontend() throws Exception {
        when(routePlannerService.previewRoute(argThat(waypoints -> waypoints.size() == 2), argThat(preferences ->
                preferences.getTrafficPreference() == RoutePlanningPreferences.TrafficPreference.QUIETER
                        && preferences.getSurfacePreference() == RoutePlanningPreferences.SurfacePreference.ASPHALT
                        && preferences.getDistancePreference() == RoutePlanningPreferences.DistancePreference.BALANCED
                        && preferences.getClimbPreference() == RoutePlanningPreferences.ClimbPreference.BALANCED
        ))).thenReturn(RoutePreview.builder()
                .polyline(List.of(new double[]{50.0647, 19.9450}, new double[]{49.9870, 20.0644}))
                .distanceM(BigDecimal.valueOf(13_500))
                .elevationGainM(BigDecimal.valueOf(320))
                .estimatedTimeSec(3600)
                .estimatedTss(88)
                .provider("BRouter")
                .profile("safety#0")
                .pavedDistanceM(BigDecimal.valueOf(11_000))
                .unpavedDistanceM(BigDecimal.valueOf(2_500))
                .cyclewayDistanceM(BigDecimal.valueOf(5_000))
                .quietDistanceM(BigDecimal.valueOf(9_000))
                .notices(List.of())
                .build());

        mockMvc.perform(post("/api/routes/preview")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "waypoints": [[50.0647, 19.9450], [49.9870, 20.0644]],
                                  "preferences": {
                                    "trafficPreference": "quieter",
                                    "surfacePreference": "asphalt",
                                    "distancePreference": "balanced",
                                    "climbPreference": "balanced"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider", is("BRouter")))
                .andExpect(jsonPath("$.profile", is("safety#0")))
                .andExpect(jsonPath("$.distanceM", is(13500)))
                .andExpect(jsonPath("$.estimatedTss", is(88)));

        verify(routePlannerService).previewRoute(
                argThat(waypoints -> waypoints.size() == 2
                        && closeTo(waypoints.get(0)[0], 50.0647)
                        && closeTo(waypoints.get(0)[1], 19.9450)
                        && closeTo(waypoints.get(1)[0], 49.9870)
                        && closeTo(waypoints.get(1)[1], 20.0644)),
                argThat(preferences ->
                        preferences.getTrafficPreference() == RoutePlanningPreferences.TrafficPreference.QUIETER
                                && preferences.getSurfacePreference() == RoutePlanningPreferences.SurfacePreference.ASPHALT
                                && preferences.getDistancePreference() == RoutePlanningPreferences.DistancePreference.BALANCED
                                && preferences.getClimbPreference() == RoutePlanningPreferences.ClimbPreference.BALANCED));
    }

    @Test
    void generateRouteReturnsSuggestionFromHistory() throws Exception {
        when(routeGeneratorService.generateHistoricalRoute(argThat(request ->
                request.startPointCoordinates() != null
                        && closeTo(request.startPointCoordinates()[0], 50.0647)
                        && closeTo(request.startPointCoordinates()[1], 19.9450)
                        &&
                request.targetDistanceKm() != null
                        && request.targetDistanceKm() == 45
                        && "harder".equals(request.style())
                        && request.routePlanningPreferences() != null
                        && request.routePlanningPreferences().getTrafficPreference() == RoutePlanningPreferences.TrafficPreference.QUIETER
        ))).thenReturn(GeneratedRouteSuggestion.builder()
                .waypoints(List.of(
                        new double[]{50.0647, 19.9450},
                        new double[]{50.0790, 19.9810},
                        new double[]{50.0647, 19.9450}))
                .preview(RoutePreview.builder()
                        .polyline(List.of(
                                new double[]{50.0647, 19.9450},
                                new double[]{50.0700, 19.9650},
                                new double[]{50.0790, 19.9810},
                                new double[]{50.0647, 19.9450}))
                        .distanceM(BigDecimal.valueOf(45_000))
                        .elevationGainM(BigDecimal.valueOf(650))
                        .estimatedTimeSec(6300)
                        .estimatedTss(115)
                        .provider("BRouter")
                        .profile("gravel#1")
                        .pavedDistanceM(BigDecimal.valueOf(20_000))
                        .unpavedDistanceM(BigDecimal.valueOf(8_000))
                        .cyclewayDistanceM(BigDecimal.valueOf(7_000))
                        .quietDistanceM(BigDecimal.valueOf(18_000))
                        .notices(List.of())
                        .build())
                .sourceName("Morning Ride")
                .sourceType("activity")
                .strategy("Wariant trudniejszy")
                .seed(123L)
                .build());

        mockMvc.perform(post("/api/routes/generate")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "startPoint": {
                                    "lat": 50.0647,
                                    "lng": 19.9450
                                  },
                                  "targetDistanceKm": 45,
                                  "style": "harder",
                                  "variationLevel": 40,
                                  "seed": 123,
                                  "routePlanningPreferences": {
                                    "trafficPreference": "quieter",
                                    "surfacePreference": "asphalt",
                                    "distancePreference": "balanced",
                                    "climbPreference": "balanced"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceName", is("Morning Ride")))
                .andExpect(jsonPath("$.preview.provider", is("BRouter")))
                .andExpect(jsonPath("$.waypoints.length()", is(3)));
    }

    @Test
    void generateRouteAlternativesReturnsSuggestionList() throws Exception {
        when(routeGeneratorService.generateHistoricalRouteAlternatives(argThat(request ->
                request.targetDistanceKm() != null
                        && request.targetDistanceKm() == 45
                        && "balanced".equals(request.style())
        ))).thenReturn(List.of(
                GeneratedRouteSuggestion.builder()
                        .waypoints(List.of(
                                new double[]{50.0647, 19.9450},
                                new double[]{50.0790, 19.9810},
                                new double[]{50.0647, 19.9450}))
                        .preview(RoutePreview.builder()
                                .polyline(List.of(
                                        new double[]{50.0647, 19.9450},
                                        new double[]{50.0700, 19.9650},
                                        new double[]{50.0790, 19.9810},
                                        new double[]{50.0647, 19.9450}))
                                .distanceM(BigDecimal.valueOf(45_000))
                                .elevationGainM(BigDecimal.valueOf(420))
                                .estimatedTimeSec(5200)
                                .estimatedTss(98)
                                .provider("BRouter")
                                .profile("safety#0")
                                .pavedDistanceM(BigDecimal.valueOf(20_000))
                                .unpavedDistanceM(BigDecimal.valueOf(8_000))
                                .cyclewayDistanceM(BigDecimal.valueOf(7_000))
                                .quietDistanceM(BigDecimal.valueOf(18_000))
                                .notices(List.of())
                                .build())
                        .sourceName("Weekend Loop")
                        .sourceType("planned-route")
                        .strategy("Wariant bazowy")
                        .style("balanced")
                        .seed(123L)
                        .build(),
                GeneratedRouteSuggestion.builder()
                        .waypoints(List.of(
                                new double[]{50.0647, 19.9450},
                                new double[]{50.0840, 19.9910},
                                new double[]{50.0647, 19.9450}))
                        .preview(RoutePreview.builder()
                                .polyline(List.of(
                                        new double[]{50.0647, 19.9450},
                                        new double[]{50.0710, 19.9680},
                                        new double[]{50.0840, 19.9910},
                                        new double[]{50.0647, 19.9450}))
                                .distanceM(BigDecimal.valueOf(48_000))
                                .elevationGainM(BigDecimal.valueOf(620))
                                .estimatedTimeSec(5600)
                                .estimatedTss(116)
                                .provider("BRouter")
                                .profile("hillclimb#0")
                                .pavedDistanceM(BigDecimal.valueOf(18_000))
                                .unpavedDistanceM(BigDecimal.valueOf(9_000))
                                .cyclewayDistanceM(BigDecimal.valueOf(6_000))
                                .quietDistanceM(BigDecimal.valueOf(16_000))
                                .notices(List.of())
                                .build())
                        .sourceName("Climb Builder")
                        .sourceType("activity")
                        .strategy("Wariant trudniejszy")
                        .style("harder")
                        .seed(124L)
                        .build()));

        mockMvc.perform(post("/api/routes/generate/alternatives")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "startPoint": {
                                    "lat": 50.0647,
                                    "lng": 19.9450
                                  },
                                  "targetDistanceKm": 45,
                                  "style": "balanced",
                                  "variationLevel": 40,
                                  "seed": 123,
                                  "routePlanningPreferences": {
                                    "trafficPreference": "quieter",
                                    "surfacePreference": "asphalt",
                                    "distancePreference": "balanced",
                                    "climbPreference": "balanced"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(2)))
                .andExpect(jsonPath("$[0].style", is("balanced")))
                .andExpect(jsonPath("$[1].style", is("harder")))
                .andExpect(jsonPath("$[1].sourceName", is("Climb Builder")));
    }

    private static boolean closeTo(double actual, double expected) {
        return Math.abs(actual - expected) < 0.000001d;
    }
}
