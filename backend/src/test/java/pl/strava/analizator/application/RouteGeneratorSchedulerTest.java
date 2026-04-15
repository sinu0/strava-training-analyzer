package pl.strava.analizator.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.GeneratedRouteSuggestion;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.RoutePreview;

@ExtendWith(MockitoExtension.class)
class RouteGeneratorSchedulerTest {

    @Mock
    private RouteGeneratorService generatorService;

    @Mock
    private RoutePlannerService plannerService;

    @Test
    void scheduledRunsAndCreatesPlannedRoutes() {
        GeneratedRouteSuggestion suggestion = GeneratedRouteSuggestion.builder()
                .waypoints(List.of(new double[]{50.0, 19.0}, new double[]{50.1, 19.1}))
                .preview(RoutePreview.builder()
                        .polyline(List.of(new double[]{50.0, 19.0}, new double[]{50.1, 19.1}))
                        .distanceM(BigDecimal.valueOf(20000))
                        .elevationGainM(BigDecimal.valueOf(150))
                        .estimatedTimeSec(3600)
                        .estimatedTss(42)
                        .provider("BRouter")
                        .profile("safety#0")
                        .pavedDistanceM(BigDecimal.valueOf(18000))
                        .unpavedDistanceM(BigDecimal.ZERO)
                        .cyclewayDistanceM(BigDecimal.ZERO)
                        .quietDistanceM(BigDecimal.ZERO)
                        .notices(List.of())
                        .build())
                .sourceName("Template")
                .strategy("Strategia testowa")
                .style("balanced")
                .seed(1L)
                .build();

        when(generatorService.generateHistoricalRoute(any())).thenReturn(suggestion);
        when(plannerService.createRoute(any())).thenReturn(PlannedRoute.builder()
                .id(UUID.randomUUID())
                .name("Saved")
                .polyline(List.of())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        RouteGeneratorScheduler scheduler = new RouteGeneratorScheduler(generatorService, plannerService, 2, 40, 35);
        scheduler.runScheduledGeneration();

        verify(generatorService, times(2)).generateHistoricalRoute(any());
        verify(plannerService, times(2)).createRoute(any());
    }
}
