package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;
import pl.strava.analizator.domain.model.RouteWaypoint;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.PlannedRouteRepository;
import pl.strava.analizator.domain.port.RouteRoutingPort;

@Service
@RequiredArgsConstructor
public class RoutePlannerService {

    private static final double EARTH_RADIUS_M = 6371000.0;
    private static final double BASE_SPEED_KMH = 25.0;
    private static final double GRADIENT_PENALTY_FACTOR = 0.8;

    private final PlannedRouteRepository routeRepository;
    private final AthleteProfileRepository profileRepository;
    private final RouteRoutingPort routeRoutingPort;

    public PlannedRoute createRoute(CreateRouteRequest request) {
        List<RouteWaypoint> waypoints = request.waypoints();
        List<double[]> polyline = request.polyline();

        BigDecimal totalDistance = calculateTotalDistance(polyline);
        BigDecimal[] elevations = calculateElevation(request.elevations());
        int estimatedTime = estimateTime(polyline, request.elevations());
        int estimatedTss = estimateTss(estimatedTime, request.elevations());

        PlannedRoute route = PlannedRoute.builder()
                .id(UUID.randomUUID())
                .name(request.name())
                .description(request.description())
                .waypoints(waypoints)
                .polyline(polyline)
                .totalDistanceM(totalDistance)
                .totalElevationGainM(elevations[0])
                .totalElevationLossM(elevations[1])
                .estimatedTimeSec(estimatedTime)
                .estimatedTss(estimatedTss)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return routeRepository.save(route);
    }

    public List<PlannedRoute> listRoutes() {
        return routeRepository.findAll();
    }

    public PlannedRoute getRoute(UUID id) {
        return routeRepository.findById(id)
                .orElseThrow(() -> new RouteNotFoundException("Trasa nie została znaleziona: " + id));
    }

    public RoutePreview previewRoute(List<double[]> waypoints, RoutePlanningPreferences preferences) {
        if (waypoints == null || waypoints.size() < 2) {
            return RoutePreview.builder()
                    .polyline(waypoints == null ? List.of() : new ArrayList<>(waypoints))
                    .distanceM(BigDecimal.ZERO)
                    .elevationGainM(BigDecimal.ZERO)
                    .estimatedTimeSec(0)
                    .estimatedTss(0)
                    .provider("NONE")
                    .profile("manual")
                    .pavedDistanceM(BigDecimal.ZERO)
                    .unpavedDistanceM(BigDecimal.ZERO)
                    .cyclewayDistanceM(BigDecimal.ZERO)
                    .quietDistanceM(BigDecimal.ZERO)
                    .notices(List.of())
                    .build();
        }

        RoutePlanningPreferences effectivePreferences = preferences == null
                ? RoutePlanningPreferences.defaults()
                : preferences;

        RoutePreview preview = routeRoutingPort.calculateRoute(waypoints, effectivePreferences);
        return preview.toBuilder()
                .estimatedTss(estimateTss(
                        preview.getEstimatedTimeSec() == null ? 0 : preview.getEstimatedTimeSec(),
                        preview.getElevationGainM()))
                .build();
    }

    public void deleteRoute(UUID id) {
        routeRepository.deleteById(id);
    }

    public String exportGpx(UUID routeId) {
        PlannedRoute route = getRoute(routeId);
        return generateGpx(route);
    }

    BigDecimal calculateTotalDistance(List<double[]> polyline) {
        double total = 0;
        for (int i = 1; i < polyline.size(); i++) {
            total += haversineDistance(
                    polyline.get(i - 1)[0], polyline.get(i - 1)[1],
                    polyline.get(i)[0], polyline.get(i)[1]);
        }
        return BigDecimal.valueOf(total).setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal[] calculateElevation(List<Double> elevations) {
        if (elevations == null || elevations.size() < 2) {
            return new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO};
        }
        double gain = 0, loss = 0;
        for (int i = 1; i < elevations.size(); i++) {
            double diff = elevations.get(i) - elevations.get(i - 1);
            if (diff > 0) gain += diff;
            else loss += Math.abs(diff);
        }
        return new BigDecimal[]{
                BigDecimal.valueOf(gain).setScale(0, RoundingMode.HALF_UP),
                BigDecimal.valueOf(loss).setScale(0, RoundingMode.HALF_UP)
        };
    }

    int estimateTime(List<double[]> polyline, List<Double> elevations) {
        if (polyline.size() < 2) return 0;
        double totalSeconds = 0;
        for (int i = 1; i < polyline.size(); i++) {
            double dist = haversineDistance(
                    polyline.get(i - 1)[0], polyline.get(i - 1)[1],
                    polyline.get(i)[0], polyline.get(i)[1]);

            double gradient = 0;
            if (elevations != null && i < elevations.size()) {
                double elevDiff = elevations.get(i) - elevations.get(i - 1);
                if (dist > 0) gradient = (elevDiff / dist) * 100;
            }

            double speedKmh = Math.max(5.0, BASE_SPEED_KMH - gradient * GRADIENT_PENALTY_FACTOR);
            double speedMs = speedKmh / 3.6;
            totalSeconds += dist / speedMs;
        }
        return (int) totalSeconds;
    }

    int estimateTss(int timeSec, List<Double> elevations) {
        BigDecimal totalGain = calculateElevation(elevations)[0];
        return estimateTss(timeSec, totalGain);
    }

    int estimateTss(int timeSec, BigDecimal totalGain) {
        int ftp = profileRepository.findFirst()
                .map(p -> p.getFtpWatts() != null && p.getFtpWatts() > 0 ? (int) p.getFtpWatts() : 200)
                .orElse(200);

        double hoursRiding = timeSec / 3600.0;
        double gainPerHour = hoursRiding > 0
                ? (totalGain == null ? 0 : totalGain.doubleValue()) / hoursRiding
                : 0;
        double intensityFactor = Math.min(1.0, 0.65 + gainPerHour / 2000.0);

        return (int) (hoursRiding * intensityFactor * intensityFactor * 100);
    }

    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String generateGpx(PlannedRoute route) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<gpx version=\"1.1\" creator=\"StravaAnalizator\">\n");
        sb.append("  <trk>\n");
        sb.append("    <name>").append(escapeXml(route.getName())).append("</name>\n");
        if (route.getDescription() != null) {
            sb.append("    <desc>").append(escapeXml(route.getDescription())).append("</desc>\n");
        }
        sb.append("    <trkseg>\n");
        if (route.getPolyline() != null) {
            for (double[] point : route.getPolyline()) {
                sb.append("      <trkpt lat=\"").append(point[0]).append("\" lon=\"").append(point[1]).append("\"/>\n");
            }
        }
        sb.append("    </trkseg>\n");
        sb.append("  </trk>\n");
        sb.append("</gpx>\n");
        return sb.toString();
    }

    private String escapeXml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }

    public record CreateRouteRequest(
            String name,
            String description,
            List<RouteWaypoint> waypoints,
            List<double[]> polyline,
            List<Double> elevations
    ) {}

    public static class RouteNotFoundException extends RuntimeException {
        public RouteNotFoundException(String message) {
            super(message);
        }
    }
}
