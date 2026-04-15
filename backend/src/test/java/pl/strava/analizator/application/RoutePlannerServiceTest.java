package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;
import pl.strava.analizator.domain.model.RouteWaypoint;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.PlannedRouteRepository;
import pl.strava.analizator.domain.port.RouteRoutingPort;

@ExtendWith(MockitoExtension.class)
class RoutePlannerServiceTest {

    @Mock
    private PlannedRouteRepository routeRepository;

    @Mock
    private AthleteProfileRepository profileRepository;

    @Mock
    private RouteRoutingPort routeRoutingPort;

    @InjectMocks
    private RoutePlannerService service;

    // Kraków (50.0647, 19.9450) → Wieliczka (49.9870, 20.0644) ≈ 11–13 km
    private static final double[] KRAKOW = {50.0647, 19.9450};
    private static final double[] WIELICZKA = {49.9870, 20.0644};

    @Test
    void createRouteCalculatesDistance() {
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(routeRepository.save(any(PlannedRoute.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<double[]> polyline = List.of(KRAKOW, WIELICZKA);
        List<Double> elevations = List.of(200.0, 280.0);
        var request = new RoutePlannerService.CreateRouteRequest(
                "Kraków–Wieliczka", null,
                List.of(waypoint(0, KRAKOW), waypoint(1, WIELICZKA)),
                polyline, elevations);

        PlannedRoute result = service.createRoute(request);

        // Haversine Kraków→Wieliczka ≈ 11–13 km
        assertThat(result.getTotalDistanceM().doubleValue()).isBetween(10_000.0, 14_000.0);
    }

    @Test
    void createRouteCalculatesElevation() {
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(routeRepository.save(any(PlannedRoute.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        List<double[]> polyline = List.of(KRAKOW, WIELICZKA, KRAKOW);
        List<Double> elevations = List.of(200.0, 350.0, 220.0);
        var request = new RoutePlannerService.CreateRouteRequest(
                "Elevation test", null, List.of(), polyline, elevations);

        PlannedRoute result = service.createRoute(request);

        // Gain: 200→350 = +150, Loss: 350→220 = -130
        assertThat(result.getTotalElevationGainM()).isEqualByComparingTo(BigDecimal.valueOf(150));
        assertThat(result.getTotalElevationLossM()).isEqualByComparingTo(BigDecimal.valueOf(130));
    }

    @Test
    void estimateTimeWithGradient() {
        List<double[]> flat = List.of(new double[]{50.0, 20.0}, new double[]{50.01, 20.0});
        List<Double> flatElev = List.of(200.0, 200.0);
        int flatTime = service.estimateTime(flat, flatElev);

        // Same distance but with steep uphill
        List<Double> uphillElev = List.of(200.0, 500.0);
        int uphillTime = service.estimateTime(flat, uphillElev);

        assertThat(flatTime).isGreaterThan(0);
        assertThat(uphillTime).isGreaterThan(flatTime);
    }

    @Test
    void estimateTssIncreasesWithElevation() {
        when(profileRepository.findFirst()).thenReturn(Optional.of(
                AthleteProfile.builder()
                        .id(UUID.randomUUID())
                        .ftpWatts((short) 250)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build()));

        int flatTss = service.estimateTss(3600, List.of(100.0, 100.0));
        int hillyTss = service.estimateTss(3600, List.of(100.0, 1200.0));

        assertThat(flatTss).isGreaterThan(0);
        assertThat(hillyTss).isGreaterThan(flatTss);
    }

    @Test
    void exportGpxContainsValidXml() {
        UUID routeId = UUID.randomUUID();
        PlannedRoute route = PlannedRoute.builder()
                .id(routeId)
                .name("Test Route & <Special>")
                .description("A \"test\" route")
                .polyline(List.of(new double[]{50.0, 20.0}, new double[]{50.1, 20.1}))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(routeRepository.findById(routeId)).thenReturn(Optional.of(route));

        String gpx = service.exportGpx(routeId);

        assertThat(gpx).contains("<?xml version=\"1.0\"");
        assertThat(gpx).contains("<gpx version=\"1.1\"");
        assertThat(gpx).contains("<name>Test Route &amp; &lt;Special&gt;</name>");
        assertThat(gpx).contains("<desc>A &quot;test&quot; route</desc>");
        assertThat(gpx).contains("trkpt lat=\"50.0\" lon=\"20.0\"");
        assertThat(gpx).contains("trkpt lat=\"50.1\" lon=\"20.1\"");
        assertThat(gpx).contains("</gpx>");
    }

    @Test
    void getRouteThrowsOnMissing() {
        UUID missingId = UUID.randomUUID();
        when(routeRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getRoute(missingId))
                .isInstanceOf(RoutePlannerService.RouteNotFoundException.class)
                .hasMessageContaining(missingId.toString());
    }

    @Test
    void calculateDistanceWithEmptyPolyline() {
        BigDecimal distance = service.calculateTotalDistance(List.of());

        assertThat(distance).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void previewRouteUsesRoutingPortAndAddsEstimatedTss() {
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(routeRoutingPort.calculateRoute(any(), any())).thenReturn(
                RoutePreview.builder()
                        .polyline(List.of(KRAKOW, WIELICZKA))
                        .distanceM(BigDecimal.valueOf(13500))
                        .elevationGainM(BigDecimal.valueOf(320))
                        .estimatedTimeSec(3600)
                        .estimatedTss(0)
                        .provider("BRouter")
                        .profile("safety#0")
                        .pavedDistanceM(BigDecimal.valueOf(11000))
                        .unpavedDistanceM(BigDecimal.valueOf(2500))
                        .cyclewayDistanceM(BigDecimal.valueOf(5000))
                        .quietDistanceM(BigDecimal.valueOf(9000))
                        .notices(List.of("test"))
                        .build());

        RoutePreview preview = service.previewRoute(List.of(KRAKOW, WIELICZKA), RoutePlanningPreferences.defaults());

        assertThat(preview.getProvider()).isEqualTo("BRouter");
        assertThat(preview.getEstimatedTss()).isGreaterThan(0);
        verify(routeRoutingPort).calculateRoute(any(), any());
    }

    private RouteWaypoint waypoint(int index, double[] coords) {
        return RouteWaypoint.builder()
                .index(index)
                .lat(coords[0])
                .lng(coords[1])
                .build();
    }
}
