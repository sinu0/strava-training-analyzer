package pl.strava.analizator.infrastructure.routing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;
import pl.strava.analizator.domain.port.RouteRoutingPort;

@Component
@RequiredArgsConstructor
public class ExternalRouteRoutingAdapter implements RouteRoutingPort {

    private static final Logger log = LoggerFactory.getLogger(ExternalRouteRoutingAdapter.class);

    private static final Set<String> PAVED_SURFACES = Set.of(
            "asphalt", "paved", "concrete", "paving_stones", "concrete:lanes", "concrete:plates");
    private static final Set<String> UNPAVED_SURFACES = Set.of(
            "gravel", "fine_gravel", "compacted", "dirt", "ground", "sand", "mud",
            "earth", "grass", "unpaved", "pebblestone", "rock");
    private static final Set<String> QUIET_HIGHWAYS = Set.of(
            "cycleway", "residential", "living_street", "service", "path", "track", "pedestrian", "footway");

    private final RestTemplate restTemplate;
    private final RoutingProperties routingProperties;

    @Override
    public RoutePreview calculateRoute(List<double[]> waypoints, RoutePlanningPreferences preferences) {
        List<String> notices = new ArrayList<>();

        if (routingProperties.getBrouter().isEnabled()) {
            try {
                return calculateWithBrouter(waypoints, preferences, notices);
            } catch (RuntimeException e) {
                log.warn("BRouter routing failed, falling back to OSRM: {}", e.getMessage());
                notices.add("BRouter chwilowo nie odpowiedział — użyto zapasowego routingu.");
            }
        }

        if (routingProperties.getOsrm().isEnabled()) {
            try {
                return calculateWithOsrm(waypoints, notices);
            } catch (RuntimeException e) {
                log.warn("OSRM routing failed, using straight-line fallback: {}", e.getMessage());
                notices.add("OSRM także nie odpowiedział — pokazano prosty przebieg między punktami.");
            }
        }

        return buildStraightLinePreview(waypoints, notices);
    }

    private RoutePreview calculateWithBrouter(
            List<double[]> waypoints,
            RoutePlanningPreferences preferences,
            List<String> notices) {
        String profile = resolveBrouterProfile(preferences);
        List<Integer> alternativeIndexes = resolveAlternativeIndexes(preferences);
        List<RoutePreview> candidates = new ArrayList<>();

        for (Integer alternativeIndex : alternativeIndexes) {
            URI uri = UriComponentsBuilder.fromHttpUrl(routingProperties.getBrouter().getBaseUrl())
                    .queryParam("lonlats", formatLonLats(waypoints))
                    .queryParam("profile", profile)
                    .queryParam("alternativeidx", alternativeIndex)
                    .queryParam("format", "geojson")
                    .build()
                    .encode()
                    .toUri();

            JsonNode root = getJson(uri);
            candidates.add(parseBrouterResponse(root, profile, alternativeIndex, notices));
        }

        if (candidates.isEmpty()) {
            throw new IllegalStateException("BRouter did not return any route candidates");
        }

        RoutePreview selected = selectCandidate(candidates, preferences);
        return selected.toBuilder()
                .notices(List.copyOf(new LinkedHashSet<>(notices)))
                .build();
    }

    private RoutePreview calculateWithOsrm(List<double[]> waypoints, List<String> notices) {
        String coords = formatOsrmCoords(waypoints);
        URI uri = URI.create(routingProperties.getOsrm().getBaseUrl()
                + "/route/v1/cycling/" + coords
                + "?overview=full&geometries=geojson");

        JsonNode root = getJson(uri);
        JsonNode route = root.path("routes").path(0);
        if (route.isMissingNode()) {
            throw new IllegalStateException("OSRM response did not contain a route");
        }

        List<double[]> polyline = new ArrayList<>();
        for (JsonNode coordinate : route.path("geometry").path("coordinates")) {
            if (coordinate.size() >= 2) {
                polyline.add(new double[]{coordinate.get(1).asDouble(), coordinate.get(0).asDouble()});
            }
        }

        notices.add("OSRM nie uwzględnia w pełni nawierzchni, ruchu i przewyższeń tak dokładnie jak BRouter.");

        return RoutePreview.builder()
                .polyline(polyline.isEmpty() ? new ArrayList<>(waypoints) : polyline)
                .distanceM(decimal(route.path("distance").asDouble(0)))
                .elevationGainM(BigDecimal.ZERO)
                .estimatedTimeSec((int) Math.round(route.path("duration").asDouble(0)))
                .estimatedTss(0)
                .provider("OSRM")
                .profile("cycling")
                .pavedDistanceM(null)
                .unpavedDistanceM(null)
                .cyclewayDistanceM(null)
                .quietDistanceM(null)
                .notices(List.copyOf(new LinkedHashSet<>(notices)))
                .build();
    }

    private RoutePreview buildStraightLinePreview(List<double[]> waypoints, List<String> notices) {
        return RoutePreview.builder()
                .polyline(new ArrayList<>(waypoints))
                .distanceM(BigDecimal.ZERO)
                .elevationGainM(BigDecimal.ZERO)
                .estimatedTimeSec(0)
                .estimatedTss(0)
                .provider("MANUAL")
                .profile("straight-line")
                .pavedDistanceM(null)
                .unpavedDistanceM(null)
                .cyclewayDistanceM(null)
                .quietDistanceM(null)
                .notices(List.copyOf(new LinkedHashSet<>(notices)))
                .build();
    }

    private JsonNode getJson(URI uri) {
        try {
            JsonNode root = restTemplate.getForObject(uri, JsonNode.class);
            if (root == null) {
                throw new IllegalStateException("Empty routing response");
            }
            return root;
        } catch (RestClientException e) {
            throw new IllegalStateException("Routing HTTP request failed for " + uri, e);
        }
    }

    private RoutePreview parseBrouterResponse(
            JsonNode root,
            String profile,
            int alternativeIndex,
            List<String> notices) {
        JsonNode feature = root.path("features").path(0);
        if (feature.isMissingNode()) {
            throw new IllegalStateException("BRouter response did not contain a feature");
        }

        JsonNode properties = feature.path("properties");
        List<double[]> polyline = extractPolyline(feature, properties);
        BrouterSurfaceStats surfaceStats = extractSurfaceStats(properties.path("messages"));

        if (surfaceStats.unpavedDistanceM.compareTo(BigDecimal.ZERO) > 0) {
            notices.add("Trasa zawiera odcinki nieasfaltowe — sprawdź udział szutru przed zapisem.");
        }

        return RoutePreview.builder()
                .polyline(polyline)
                .distanceM(decimal(properties.path("track-length").asDouble(0)))
                .elevationGainM(decimal(properties.path("filtered ascend").asDouble(0)))
                .estimatedTimeSec(properties.path("total-time").asInt(0))
                .estimatedTss(0)
                .provider("BRouter")
                .profile(profile + "#" + alternativeIndex)
                .pavedDistanceM(surfaceStats.pavedDistanceM)
                .unpavedDistanceM(surfaceStats.unpavedDistanceM)
                .cyclewayDistanceM(surfaceStats.cyclewayDistanceM)
                .quietDistanceM(surfaceStats.quietDistanceM)
                .notices(List.of())
                .build();
    }

    private List<double[]> extractPolyline(JsonNode feature, JsonNode properties) {
        List<double[]> polyline = new ArrayList<>();

        for (JsonNode coordinate : feature.path("geometry").path("coordinates")) {
            if (coordinate.size() >= 2) {
                polyline.add(new double[]{coordinate.get(1).asDouble(), coordinate.get(0).asDouble()});
            }
        }

        if (!polyline.isEmpty()) {
            return polyline;
        }

        JsonNode messages = properties.path("messages");
        for (int index = 1; index < messages.size(); index++) {
            JsonNode row = messages.get(index);
            if (row == null || row.size() < 2) {
                continue;
            }
            polyline.add(new double[]{
                    row.get(1).asDouble() / 1_000_000d,
                    row.get(0).asDouble() / 1_000_000d
            });
        }

        return polyline;
    }

    private BrouterSurfaceStats extractSurfaceStats(JsonNode messages) {
        BigDecimal pavedDistanceM = BigDecimal.ZERO;
        BigDecimal unpavedDistanceM = BigDecimal.ZERO;
        BigDecimal cyclewayDistanceM = BigDecimal.ZERO;
        BigDecimal quietDistanceM = BigDecimal.ZERO;

        for (int index = 1; index < messages.size(); index++) {
            JsonNode row = messages.get(index);
            if (row == null || row.size() < 10) {
                continue;
            }

            BigDecimal distance = decimal(row.get(3).asDouble(0));
            Map<String, String> tags = parseTags(row.get(9).asText(""));
            String surface = tags.get("surface");
            String highway = tags.get("highway");
            String trafficClass = tags.get("estimated_traffic_class");

            if (surface != null && PAVED_SURFACES.contains(surface)) {
                pavedDistanceM = pavedDistanceM.add(distance);
            }
            if (surface != null && UNPAVED_SURFACES.contains(surface)) {
                unpavedDistanceM = unpavedDistanceM.add(distance);
            }
            if (isCycleFriendly(tags)) {
                cyclewayDistanceM = cyclewayDistanceM.add(distance);
            }
            if (isQuietSegment(highway, trafficClass, tags)) {
                quietDistanceM = quietDistanceM.add(distance);
            }
        }

        return new BrouterSurfaceStats(pavedDistanceM, unpavedDistanceM, cyclewayDistanceM, quietDistanceM);
    }

    private boolean isCycleFriendly(Map<String, String> tags) {
        String highway = tags.get("highway");
        return "cycleway".equals(highway)
                || tags.containsKey("cycleway:left")
                || tags.containsKey("cycleway:right")
                || tags.containsKey("cycleway")
                || "designated".equals(tags.get("bicycle"));
    }

    private boolean isQuietSegment(String highway, String trafficClass, Map<String, String> tags) {
        if (trafficClass != null) {
            try {
                if (Integer.parseInt(trafficClass) <= 2) {
                    return true;
                }
            } catch (NumberFormatException ignored) {
                // ignore malformed traffic class
            }
        }

        return QUIET_HIGHWAYS.contains(highway) || isCycleFriendly(tags);
    }

    private Map<String, String> parseTags(String rawTags) {
        Map<String, String> tags = new LinkedHashMap<>();
        if (rawTags == null || rawTags.isBlank()) {
            return tags;
        }

        for (String token : rawTags.split(" ")) {
            int separatorIndex = token.indexOf('=');
            if (separatorIndex <= 0 || separatorIndex >= token.length() - 1) {
                continue;
            }

            String key = token.substring(0, separatorIndex).trim().toLowerCase(Locale.ROOT);
            String value = token.substring(separatorIndex + 1).trim().toLowerCase(Locale.ROOT);
            if (!key.isEmpty() && !value.isEmpty()) {
                tags.put(key, value);
            }
        }

        return tags;
    }

    private RoutePreview selectCandidate(
            List<RoutePreview> candidates,
            RoutePlanningPreferences preferences) {
        RoutePreview best = candidates.get(0);
        double bestScore = scoreCandidate(best, preferences);

        for (int index = 1; index < candidates.size(); index++) {
            RoutePreview candidate = candidates.get(index);
            double score = scoreCandidate(candidate, preferences);
            if (score < bestScore) {
                best = candidate;
                bestScore = score;
            }
        }

        return best;
    }

    private double scoreCandidate(RoutePreview candidate, RoutePlanningPreferences preferences) {
        double score = 0;
        double distance = candidate.getDistanceM() == null ? 0 : candidate.getDistanceM().doubleValue();
        double elevationGain = candidate.getElevationGainM() == null ? 0 : candidate.getElevationGainM().doubleValue();

        switch (preferences.getDistancePreference()) {
            case SHORTEST -> score += distance;
            case LONGER -> score -= distance;
            case BALANCED -> score += distance * 0.05;
        }

        switch (preferences.getClimbPreference()) {
            case FLATTER -> score += elevationGain * 2;
            case HILLIER -> score -= elevationGain * 2;
            case BALANCED -> score += elevationGain * 0.1;
        }

        return score;
    }

    private List<Integer> resolveAlternativeIndexes(RoutePlanningPreferences preferences) {
        int candidateCount = routingProperties.getBrouter().getAlternativeCandidates();
        if (candidateCount < 1) {
            return List.of(0);
        }

        boolean needsAlternatives =
                preferences.getDistancePreference() == RoutePlanningPreferences.DistancePreference.LONGER
                        || preferences.getClimbPreference() != RoutePlanningPreferences.ClimbPreference.BALANCED;

        if (!needsAlternatives) {
            return List.of(0);
        }

        List<Integer> indexes = new ArrayList<>();
        for (int index = 0; index < candidateCount; index++) {
            indexes.add(index);
        }
        return indexes;
    }

    private String resolveBrouterProfile(RoutePlanningPreferences preferences) {
        if (preferences.getDistancePreference() == RoutePlanningPreferences.DistancePreference.SHORTEST) {
            return "shortest";
        }
        if (preferences.getSurfacePreference() == RoutePlanningPreferences.SurfacePreference.GRAVEL
                || preferences.getClimbPreference() == RoutePlanningPreferences.ClimbPreference.HILLIER) {
            return "gravel";
        }
        if (preferences.getTrafficPreference() == RoutePlanningPreferences.TrafficPreference.QUIETER) {
            return "safety";
        }
        if (preferences.getSurfacePreference() == RoutePlanningPreferences.SurfacePreference.ASPHALT
                || preferences.getTrafficPreference() == RoutePlanningPreferences.TrafficPreference.DIRECT) {
            return "fastbike";
        }
        return "trekking";
    }

    private String formatLonLats(List<double[]> waypoints) {
        return waypoints.stream()
                .map(point -> String.format(Locale.US, "%.6f,%.6f", point[1], point[0]))
                .reduce((left, right) -> left + "|" + right)
                .orElse("");
    }

    private String formatOsrmCoords(List<double[]> waypoints) {
        return waypoints.stream()
                .map(point -> String.format(Locale.US, "%.6f,%.6f", point[1], point[0]))
                .reduce((left, right) -> left + ";" + right)
                .orElse("");
    }

    private BigDecimal decimal(double value) {
        return BigDecimal.valueOf(value).setScale(0, RoundingMode.HALF_UP);
    }

    private record BrouterSurfaceStats(
            BigDecimal pavedDistanceM,
            BigDecimal unpavedDistanceM,
            BigDecimal cyclewayDistanceM,
            BigDecimal quietDistanceM
    ) {
    }
}
