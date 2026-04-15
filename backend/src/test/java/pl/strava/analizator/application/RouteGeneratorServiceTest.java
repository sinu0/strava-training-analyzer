package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.RouteGenerationRequestDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.GeneratedRouteSuggestion;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.PlannedRouteRepository;

@ExtendWith(MockitoExtension.class)
class RouteGeneratorServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private PlannedRouteRepository plannedRouteRepository;

    @Mock
    private RoutePlannerService routePlannerService;

    @InjectMocks
    private RouteGeneratorService service;

    private static final double[] KRAKOW = {50.0647, 19.9450};

    @Test
    void generateHistoricalRouteBuildsLongerVariantFromSavedLoop() {
        PlannedRoute template = PlannedRoute.builder()
                .id(UUID.randomUUID())
                .name("Weekend Loop")
                .polyline(List.of(
                        new double[]{50.0647, 19.9450},
                        new double[]{50.0790, 19.9810},
                        new double[]{50.0580, 20.0260},
                        new double[]{50.0180, 19.9970},
                        new double[]{50.0647, 19.9450}))
                .totalDistanceM(BigDecimal.valueOf(32_000))
                .totalElevationGainM(BigDecimal.valueOf(420))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(plannedRouteRepository.findAll()).thenReturn(List.of(template));
        when(activityRepository.findRecentActivities(anyInt())).thenReturn(List.of());
        when(routePlannerService.previewRoute(any(), any())).thenReturn(preview("BRouter", "safety#1"));

        GeneratedRouteSuggestion suggestion = service.generateHistoricalRoute(new RouteGenerationRequestDto(
                startPoint(KRAKOW),
                45,
                "longer",
                35,
                123L,
                RoutePlanningPreferences.defaults()));

        assertThat(suggestion.getSourceName()).isEqualTo("Weekend Loop");
        assertThat(suggestion.getSourceType()).isEqualTo("planned-route");
        assertThat(suggestion.getPreview().getProvider()).isEqualTo("BRouter");
        assertThat(suggestion.getStrategy()).contains("dłuższ");
        assertThat(suggestion.getWaypoints()).hasSizeGreaterThanOrEqualTo(4);
        assertThat(suggestion.getWaypoints().getFirst()[0]).isEqualTo(KRAKOW[0]);
        assertThat(suggestion.getWaypoints().getFirst()[1]).isEqualTo(KRAKOW[1]);

        verify(routePlannerService, atLeastOnce()).previewRoute(
                argThat(waypoints -> waypoints.size() >= 4),
                argThat(preferences ->
                        preferences.getDistancePreference() == RoutePlanningPreferences.DistancePreference.LONGER
                                && preferences.getTrafficPreference() == RoutePlanningPreferences.TrafficPreference.QUIETER));
    }

    @Test
    void generateHistoricalRouteFallsBackToActivityHistoryWhenNoSavedRoutesExist() {
        Activity activity = Activity.builder()
                .id(UUID.randomUUID())
                .sportType("cycling")
                .name("Morning Ride")
                .startedAt(OffsetDateTime.parse("2024-06-01T08:00:00Z"))
                .distanceM(BigDecimal.valueOf(28_000))
                .elevationGainM(BigDecimal.valueOf(240))
                .latStream(new double[]{50.0647, 50.0710, 50.0600, 50.0647})
                .lngStream(new double[]{19.9450, 19.9800, 20.0110, 19.9450})
                .build();

        when(plannedRouteRepository.findAll()).thenReturn(List.of());
        when(activityRepository.findRecentActivities(anyInt())).thenReturn(List.of(activity));
        when(routePlannerService.previewRoute(any(), any())).thenReturn(preview("BRouter", "trekking#0"));

        GeneratedRouteSuggestion suggestion = service.generateHistoricalRoute(new RouteGenerationRequestDto(
                null,
                30,
                "balanced",
                20,
                99L,
                RoutePlanningPreferences.defaults()));

        assertThat(suggestion.getSourceName()).isEqualTo("Morning Ride");
        assertThat(suggestion.getSourceType()).isEqualTo("activity");
        assertThat(suggestion.getWaypoints()).isNotEmpty();
    }

    @Test
    void generateHistoricalRoutePrefersNonLoopTemplateThatStartsNearRequestedPoint() {
        Activity midpointMatch = Activity.builder()
                .id(UUID.randomUUID())
                .sportType("cycling")
                .name("Midpoint Match Ride")
                .startedAt(OffsetDateTime.parse("2024-06-01T08:00:00Z"))
                .distanceM(BigDecimal.valueOf(60_000))
                .elevationGainM(BigDecimal.valueOf(250))
                .latStream(new double[]{49.9000, 50.0647, 50.2200, 50.3400})
                .lngStream(new double[]{18.7000, 19.9450, 20.0500, 20.1800})
                .build();
        Activity endpointMatch = Activity.builder()
                .id(UUID.randomUUID())
                .sportType("cycling")
                .name("Endpoint Match Ride")
                .startedAt(OffsetDateTime.parse("2024-06-02T08:00:00Z"))
                .distanceM(BigDecimal.valueOf(62_000))
                .elevationGainM(BigDecimal.valueOf(280))
                .latStream(new double[]{50.0647, 50.1200, 50.1800, 50.2350})
                .lngStream(new double[]{19.9450, 19.9900, 20.0700, 20.1100})
                .build();

        when(plannedRouteRepository.findAll()).thenReturn(List.of());
        when(activityRepository.findRecentActivities(anyInt())).thenReturn(List.of(midpointMatch, endpointMatch));
        when(routePlannerService.previewRoute(any(), any())).thenReturn(preview("BRouter", "trekking#0"));

        GeneratedRouteSuggestion suggestion = service.generateHistoricalRoute(new RouteGenerationRequestDto(
                startPoint(KRAKOW),
                60,
                "balanced",
                20,
                0L,
                RoutePlanningPreferences.defaults()));

        assertThat(suggestion.getSourceName()).isEqualTo("Endpoint Match Ride");
    }

    @Test
    void generateHistoricalRouteRotatesLoopAroundRequestedStartPoint() {
        PlannedRoute loopTemplate = PlannedRoute.builder()
                .id(UUID.randomUUID())
                .name("Square Loop")
                .polyline(List.of(
                        new double[]{50.0000, 19.0000},
                        new double[]{50.0000, 19.1000},
                        new double[]{50.1000, 19.1000},
                        new double[]{50.1000, 19.0000},
                        new double[]{50.0000, 19.0000}))
                .totalDistanceM(BigDecimal.valueOf(44_000))
                .totalElevationGainM(BigDecimal.valueOf(200))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(plannedRouteRepository.findAll()).thenReturn(List.of(loopTemplate));
        when(activityRepository.findRecentActivities(anyInt())).thenReturn(List.of());
        when(routePlannerService.previewRoute(any(), any())).thenReturn(preview("BRouter", "safety#0"));

        GeneratedRouteSuggestion suggestion = service.generateHistoricalRoute(new RouteGenerationRequestDto(
                new RouteGenerationRequestDto.StartPointDto(50.1000, 19.1000),
                40,
                "balanced",
                5,
                77L,
                RoutePlanningPreferences.defaults()));

        assertThat(suggestion.getWaypoints()).hasSizeGreaterThanOrEqualTo(4);
        assertThat(suggestion.getWaypoints().get(1)[0]).isGreaterThan(50.08d);
        assertThat(suggestion.getWaypoints().get(1)[1]).isLessThan(19.05d);
    }

    @Test
    void generateHistoricalRouteThrowsWhenRequestedStartHasNoNearbyHistory() {
        Activity farAwayActivity = Activity.builder()
                .id(UUID.randomUUID())
                .sportType("cycling")
                .name("Far Away Ride")
                .startedAt(OffsetDateTime.parse("2024-06-03T08:00:00Z"))
                .distanceM(BigDecimal.valueOf(55_000))
                .elevationGainM(BigDecimal.valueOf(320))
                .latStream(new double[]{50.0647, 50.0710, 50.0600, 50.0647})
                .lngStream(new double[]{19.9450, 19.9800, 20.0110, 19.9450})
                .build();

        when(plannedRouteRepository.findAll()).thenReturn(List.of());
        when(activityRepository.findRecentActivities(anyInt())).thenReturn(List.of(farAwayActivity));

        assertThatThrownBy(() -> service.generateHistoricalRoute(new RouteGenerationRequestDto(
                new RouteGenerationRequestDto.StartPointDto(50.2649, 19.0238),
                60,
                "balanced",
                20,
                55L,
                RoutePlanningPreferences.defaults())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Brak historycznych tras w poblizu");
    }

    @Test
    void generateHistoricalRouteAlternativesReturnsThreeRankedVariants() {
        PlannedRoute template = PlannedRoute.builder()
                .id(UUID.randomUUID())
                .name("Weekend Loop")
                .polyline(List.of(
                        new double[]{50.0647, 19.9450},
                        new double[]{50.0790, 19.9810},
                        new double[]{50.0580, 20.0260},
                        new double[]{50.0180, 19.9970},
                        new double[]{50.0647, 19.9450}))
                .totalDistanceM(BigDecimal.valueOf(42_000))
                .totalElevationGainM(BigDecimal.valueOf(420))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(plannedRouteRepository.findAll()).thenReturn(List.of(template));
        when(activityRepository.findRecentActivities(anyInt())).thenReturn(List.of());
        when(routePlannerService.previewRoute(any(), any())).thenAnswer(invocation -> {
            RoutePlanningPreferences preferences = invocation.getArgument(1);
            return previewForPreferences(preferences);
        });

        List<GeneratedRouteSuggestion> suggestions = service.generateHistoricalRouteAlternatives(new RouteGenerationRequestDto(
                startPoint(KRAKOW),
                45,
                "balanced",
                35,
                123L,
                RoutePlanningPreferences.defaults()));

        assertThat(suggestions).hasSize(3);
        assertThat(suggestions)
                .extracting(GeneratedRouteSuggestion::getStyle)
                .containsExactly("balanced", "easier", "harder");
        assertThat(suggestions)
                .extracting(GeneratedRouteSuggestion::getPreview)
                .extracting(RoutePreview::getProvider)
                .containsOnly("BRouter");
    }

    @Test
    void generateHistoricalRouteThrowsWhenHistoryIsMissing() {
        when(plannedRouteRepository.findAll()).thenReturn(List.of());
        when(activityRepository.findRecentActivities(anyInt())).thenReturn(List.of());

        assertThatThrownBy(() -> service.generateHistoricalRoute(new RouteGenerationRequestDto(
                startPoint(KRAKOW),
                35,
                "balanced",
                20,
                1L,
                RoutePlanningPreferences.defaults())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Brak historycznych tras");
    }

    private RoutePreview preview(String provider, String profile) {
        return RoutePreview.builder()
                .polyline(List.of(
                        new double[]{50.0647, 19.9450},
                        new double[]{50.0710, 19.9800},
                        new double[]{50.0580, 20.0110},
                        new double[]{50.0647, 19.9450}))
                .distanceM(BigDecimal.valueOf(36_000))
                .elevationGainM(BigDecimal.valueOf(360))
                .estimatedTimeSec(4200)
                .estimatedTss(92)
                .provider(provider)
                .profile(profile)
                .pavedDistanceM(BigDecimal.valueOf(24_000))
                .unpavedDistanceM(BigDecimal.valueOf(3_000))
                .cyclewayDistanceM(BigDecimal.valueOf(9_000))
                .quietDistanceM(BigDecimal.valueOf(21_000))
                .notices(List.of())
                .build();
    }

    private RoutePreview previewForPreferences(RoutePlanningPreferences preferences) {
        if (preferences.getClimbPreference() == RoutePlanningPreferences.ClimbPreference.HILLIER) {
            return RoutePreview.builder()
                    .polyline(List.of(
                            new double[]{50.0647, 19.9450},
                            new double[]{50.0730, 19.9840},
                            new double[]{50.0580, 20.0110},
                            new double[]{50.0647, 19.9450}))
                    .distanceM(BigDecimal.valueOf(47_500))
                    .elevationGainM(BigDecimal.valueOf(690))
                    .estimatedTimeSec(5600)
                    .estimatedTss(118)
                    .provider("BRouter")
                    .profile("hillclimb#0")
                    .pavedDistanceM(BigDecimal.valueOf(24_000))
                    .unpavedDistanceM(BigDecimal.valueOf(3_000))
                    .cyclewayDistanceM(BigDecimal.valueOf(9_000))
                    .quietDistanceM(BigDecimal.valueOf(21_000))
                    .notices(List.of())
                    .build();
        }
        if (preferences.getClimbPreference() == RoutePlanningPreferences.ClimbPreference.FLATTER) {
            return RoutePreview.builder()
                    .polyline(List.of(
                            new double[]{50.0647, 19.9450},
                            new double[]{50.0690, 19.9720},
                            new double[]{50.0540, 19.9950},
                            new double[]{50.0647, 19.9450}))
                    .distanceM(BigDecimal.valueOf(43_200))
                    .elevationGainM(BigDecimal.valueOf(210))
                    .estimatedTimeSec(4700)
                    .estimatedTss(82)
                    .provider("BRouter")
                    .profile("safety#1")
                    .pavedDistanceM(BigDecimal.valueOf(24_000))
                    .unpavedDistanceM(BigDecimal.valueOf(3_000))
                    .cyclewayDistanceM(BigDecimal.valueOf(9_000))
                    .quietDistanceM(BigDecimal.valueOf(21_000))
                    .notices(List.of())
                    .build();
        }
        return preview("BRouter", "safety#0");
    }

    private RouteGenerationRequestDto.StartPointDto startPoint(double[] coordinates) {
        return new RouteGenerationRequestDto.StartPointDto(coordinates[0], coordinates[1]);
    }
}
