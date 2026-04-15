package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.RouteGenerationRequestDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.GeneratedRouteSuggestion;
import pl.strava.analizator.domain.model.PlannedRoute;
import pl.strava.analizator.domain.model.RoutePlanningPreferences;
import pl.strava.analizator.domain.model.RoutePreview;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.PlannedRouteRepository;

@Service
@RequiredArgsConstructor
public class RouteGeneratorService {

    private static final int RECENT_ACTIVITY_LIMIT = 120;
    private static final double EARTH_RADIUS_M = 6_371_000d;
    private static final double LOOP_THRESHOLD_M = 1_500d;
    private static final double START_PROXIMITY_M = 15_000d;
    private static final double NON_LOOP_ENDPOINT_PROXIMITY_M = 4_000d;
    private static final int DEFAULT_DISTANCE_KM = 40;
    private static final int DEFAULT_VARIATION = 35;

    private final ActivityRepository activityRepository;
    private final PlannedRouteRepository plannedRouteRepository;
    private final RoutePlannerService routePlannerService;

    public GeneratedRouteSuggestion generateHistoricalRoute(RouteGenerationRequestDto request) {
        String requestedStyle = normalizeStyle(request.style());
        List<GeneratedRouteSuggestion> suggestions = generateHistoricalRouteAlternatives(request);
        return suggestions.stream()
                .filter(suggestion -> requestedStyle.equals(suggestion.getStyle()))
                .findFirst()
                .orElseGet(suggestions::getFirst);
    }

    public List<GeneratedRouteSuggestion> generateHistoricalRouteAlternatives(RouteGenerationRequestDto request) {
        GenerationContext context = prepareContext(request);
        List<GeneratedRouteSuggestion> suggestions = new ArrayList<>();

        int variantIndex = 0;
        for (String style : selectAlternativeStyles(context.requestedStyle())) {
            GeneratedRouteSuggestion suggestion = generateSuggestion(context, style, context.seed() + (variantIndex * 97L));
            if (isDistinctSuggestion(suggestion, suggestions)) {
                suggestions.add(suggestion);
            }
            variantIndex++;
        }

        if (suggestions.isEmpty()) {
            throw new IllegalArgumentException("Nie udało się wygenerować trasy na bazie historii.");
        }

        return suggestions;
    }

    private List<RouteTemplate> collectTemplates() {
        List<RouteTemplate> templates = new ArrayList<>();

        for (PlannedRoute route : plannedRouteRepository.findAll()) {
            RouteTemplate template = toRouteTemplate(route);
            if (template != null) {
                templates.add(template);
            }
        }

        for (Activity activity : activityRepository.findRecentActivities(RECENT_ACTIVITY_LIMIT)) {
            RouteTemplate template = toRouteTemplate(activity);
            if (template != null) {
                templates.add(template);
            }
        }

        return templates;
    }

    private GenerationContext prepareContext(RouteGenerationRequestDto request) {
        String style = normalizeStyle(request.style());
        int targetDistanceKm = clamp(request.targetDistanceKm(), 20, 220, DEFAULT_DISTANCE_KM);
        int variationLevel = clamp(request.variationLevel(), 5, 95, DEFAULT_VARIATION);
        long seed = request.seed() != null ? request.seed() : OffsetDateTime.now().toInstant().toEpochMilli();

        List<RouteTemplate> templates = collectTemplates();
        if (templates.isEmpty()) {
            throw new IllegalArgumentException("Brak historycznych tras do wygenerowania nowej propozycji.");
        }

        double[] requestedStart = request.startPointCoordinates();
        List<RouteTemplate> candidateTemplates = filterTemplatesByStart(templates, requestedStart);
        if (candidateTemplates.isEmpty()) {
            throw new IllegalArgumentException(
                    "Brak historycznych tras w poblizu wybranego punktu startu. Wybierz start blizej swoich poprzednich przejazdow albo najpierw zapisz kilka tras w tej okolicy.");
        }

        return new GenerationContext(
                style,
                targetDistanceKm,
                variationLevel,
                seed,
                requestedStart,
                candidateTemplates,
                request.routePlanningPreferences());
    }

    private List<RouteTemplate> filterTemplatesByStart(List<RouteTemplate> templates, double[] requestedStart) {
        if (requestedStart == null || requestedStart.length < 2) {
            return preferLoopRoutes(templates);
        }

        List<RouteTemplate> nearby = templates.stream()
                .filter(template -> template.minDistanceTo(requestedStart) <= START_PROXIMITY_M)
                .toList();
        if (nearby.isEmpty()) {
            return List.of();
        }
        List<RouteTemplate> launchable = nearby.stream()
                .filter(template -> template.supportsRequestedStart(requestedStart))
                .toList();
        return preferLoopRoutes(launchable);
    }

    private List<RouteTemplate> preferLoopRoutes(List<RouteTemplate> templates) {
        List<RouteTemplate> loops = templates.stream().filter(RouteTemplate::loop).toList();
        return loops.isEmpty() ? templates : loops;
    }

    private RouteTemplate selectTemplate(
            List<RouteTemplate> templates,
            double[] requestedStart,
            double targetDistanceM,
            String style,
            long seed) {
        List<RouteTemplate> ranked = templates.stream()
                .sorted(Comparator.comparingDouble(template ->
                        templateScore(template, requestedStart, targetDistanceM, style)))
                .limit(5)
                .toList();
        double bestScore = templateScore(ranked.getFirst(), requestedStart, targetDistanceM, style);
        double competitiveWindow = Math.max(12_000d, targetDistanceM * 0.25d);
        List<RouteTemplate> competitive = ranked.stream()
                .filter(template -> templateScore(template, requestedStart, targetDistanceM, style) <= bestScore + competitiveWindow)
                .toList();
        List<RouteTemplate> pool = competitive.isEmpty() ? List.of(ranked.getFirst()) : competitive;
        return pool.get((int) Math.floorMod(seed, pool.size()));
    }

    private GeneratedRouteSuggestion generateSuggestion(GenerationContext context, String style, long seed) {
        RouteTemplate selectedTemplate = selectTemplate(
                context.candidateTemplates(),
                context.requestedStart(),
                context.targetDistanceM(),
                style,
                seed);
        RoutePlanningPreferences preferences = adaptPreferences(context.basePreferences(), style);

        Random random = new Random(seed);
        GeneratedRouteSuggestion bestSuggestion = null;
        double bestScore = Double.MAX_VALUE;
        for (int attempt = 0; attempt < 4; attempt++) {
            List<double[]> candidateWaypoints = buildCandidateWaypoints(
                    selectedTemplate,
                    context.requestedStart(),
                    context.targetDistanceM(),
                    context.variationLevel(),
                    style,
                    random);
            RoutePreview preview = routePlannerService.previewRoute(candidateWaypoints, preferences);
            double score = scoreGeneratedPreview(preview, selectedTemplate, context.targetDistanceM(), style);
            if (bestSuggestion == null || score < bestScore) {
                bestSuggestion = GeneratedRouteSuggestion.builder()
                        .waypoints(candidateWaypoints)
                        .preview(preview)
                        .sourceName(selectedTemplate.name())
                        .sourceType(selectedTemplate.sourceType())
                        .strategy(describeStrategy(style, context.targetDistanceKm(), context.variationLevel(), selectedTemplate))
                        .style(style)
                        .seed(seed)
                        .build();
                bestScore = score;
            }
        }

        if (bestSuggestion == null) {
            throw new IllegalArgumentException("Nie udało się wygenerować trasy na bazie historii.");
        }

        return bestSuggestion;
    }

    private List<String> selectAlternativeStyles(String requestedStyle) {
        LinkedHashSet<String> styles = new LinkedHashSet<>();
        styles.add(requestedStyle);
        switch (requestedStyle) {
            case "balanced" -> {
                styles.add("easier");
                styles.add("harder");
            }
            case "longer" -> {
                styles.add("balanced");
                styles.add("harder");
            }
            case "harder" -> {
                styles.add("balanced");
                styles.add("longer");
            }
            case "easier" -> {
                styles.add("balanced");
                styles.add("longer");
            }
            default -> {
                styles.add("balanced");
                styles.add("easier");
            }
        }
        return List.copyOf(styles);
    }

    private boolean isDistinctSuggestion(GeneratedRouteSuggestion candidate, List<GeneratedRouteSuggestion> selected) {
        for (GeneratedRouteSuggestion existing : selected) {
            if (existing.getStyle().equals(candidate.getStyle())) {
                return false;
            }
        }
        return true;
    }

    private double templateScore(RouteTemplate template, double[] requestedStart, double targetDistanceM, String style) {
        double score = Math.abs(template.distanceM() - targetDistanceM);
        if (requestedStart != null && requestedStart.length >= 2) {
            score += template.minDistanceTo(requestedStart) * 2;
        }

        double climbPerKm = template.distanceM() > 0 ? (template.elevationGainM() / (template.distanceM() / 1000d)) : 0;
        if ("harder".equals(style)) {
            score -= climbPerKm * 900d;
        } else if ("easier".equals(style)) {
            score += climbPerKm * 900d;
        } else if ("longer".equals(style)) {
            score -= template.distanceM() * 0.25d;
        }

        if (template.loop()) {
            score -= 2_000d;
        }
        return score;
    }

    private List<double[]> buildCandidateWaypoints(
            RouteTemplate template,
            double[] requestedStart,
            double targetDistanceM,
            int variationLevel,
            String style,
            Random random) {
        List<double[]> anchoredPolyline = anchorTemplatePolyline(template, requestedStart);
        List<Double> fractions = selectFractions(template, targetDistanceM, style);
        List<double[]> waypoints = new ArrayList<>();
        double jitterMeters = calculateJitterMeters(template.distanceM(), targetDistanceM, variationLevel, style);

        for (int index = 0; index < fractions.size(); index++) {
            double fraction = fractions.get(index);
            double[] point = samplePoint(anchoredPolyline, fraction);

            if (index == 0 && requestedStart != null && requestedStart.length >= 2) {
                point = new double[]{requestedStart[0], requestedStart[1]};
            } else if (index > 0 && index < fractions.size() - 1) {
                point = jitterPoint(anchoredPolyline, fraction, jitterMeters, random);
            }

            if (!waypoints.isEmpty() && haversineDistance(waypoints.getLast(), point) < 180d && index < fractions.size() - 1) {
                continue;
            }
            waypoints.add(point);
        }

        if (template.loop()) {
            double[] loopEnd = requestedStart != null && requestedStart.length >= 2
                    ? new double[]{requestedStart[0], requestedStart[1]}
                    : new double[]{waypoints.getFirst()[0], waypoints.getFirst()[1]};
            waypoints.add(loopEnd);
        }

        if (("longer".equals(style) || "harder".equals(style)) && targetDistanceM > template.distanceM() * 1.08d) {
            int insertIndex = Math.max(1, waypoints.size() / 2);
            double[] detour = jitterPoint(anchoredPolyline, 0.58d, jitterMeters * 1.35d, random);
            if (haversineDistance(waypoints.get(insertIndex - 1), detour) > 250d) {
                waypoints.add(insertIndex, detour);
            }
        }

        return waypoints;
    }

    private List<Double> selectFractions(RouteTemplate template, double targetDistanceM, String style) {
        if (template.loop()) {
            if ("harder".equals(style) || targetDistanceM > template.distanceM() * 1.1d) {
                return List.of(0d, 0.16d, 0.36d, 0.58d, 0.79d);
            }
            return List.of(0d, 0.22d, 0.5d, 0.78d);
        }

        if ("longer".equals(style) || "harder".equals(style)) {
            return List.of(0d, 0.18d, 0.42d, 0.68d, 1d);
        }
        return List.of(0d, 0.3d, 0.65d, 1d);
    }

    private double calculateJitterMeters(double baseDistanceM, double targetDistanceM, int variationLevel, String style) {
        double distanceFactor = Math.max(baseDistanceM, targetDistanceM) / 1000d;
        double base = Math.min(2_400d, Math.max(350d, distanceFactor * 45d));
        if ("harder".equals(style) || "longer".equals(style)) {
            base *= 1.2d;
        } else if ("easier".equals(style)) {
            base *= 0.75d;
        }
        return base * (variationLevel / 100d);
    }

    private double[] samplePoint(List<double[]> polyline, double fraction) {
        int index = (int) Math.round((polyline.size() - 1) * fraction);
        return copy(polyline.get(Math.max(0, Math.min(index, polyline.size() - 1))));
    }

    private List<double[]> anchorTemplatePolyline(RouteTemplate template, double[] requestedStart) {
        if (requestedStart == null || requestedStart.length < 2 || template.polyline().size() < 2) {
            return template.polyline();
        }
        if (template.loop()) {
            return rotateLoop(template.polyline(), template.nearestIndexTo(requestedStart));
        }
        if (template.distanceToLastEndpoint(requestedStart) < template.distanceToFirstEndpoint(requestedStart)) {
            return reversePolyline(template.polyline());
        }
        return template.polyline();
    }

    private List<double[]> rotateLoop(List<double[]> polyline, int anchorIndex) {
        int uniquePoints = haversineDistance(polyline.getFirst(), polyline.getLast()) <= LOOP_THRESHOLD_M
                ? polyline.size() - 1
                : polyline.size();
        if (uniquePoints <= 1) {
            return polyline;
        }

        int normalizedAnchor = Math.max(0, Math.min(anchorIndex, uniquePoints - 1));
        if (normalizedAnchor == 0) {
            return polyline;
        }

        List<double[]> rotated = new ArrayList<>(polyline.size());
        for (int index = 0; index < uniquePoints; index++) {
            rotated.add(copy(polyline.get((normalizedAnchor + index) % uniquePoints)));
        }
        rotated.add(copy(rotated.getFirst()));
        return rotated;
    }

    private List<double[]> reversePolyline(List<double[]> polyline) {
        List<double[]> reversed = new ArrayList<>(polyline.size());
        for (int index = polyline.size() - 1; index >= 0; index--) {
            reversed.add(copy(polyline.get(index)));
        }
        return reversed;
    }

    private double[] jitterPoint(List<double[]> polyline, double fraction, double meters, Random random) {
        double[] base = samplePoint(polyline, fraction);
        int index = (int) Math.round((polyline.size() - 1) * fraction);
        double[] previous = polyline.get(Math.max(0, index - 1));
        double[] next = polyline.get(Math.min(polyline.size() - 1, index + 1));

        double latScale = 111_320d;
        double lngScale = Math.max(20_000d, Math.cos(Math.toRadians(base[0])) * 111_320d);
        double directionX = (next[1] - previous[1]) * lngScale;
        double directionY = (next[0] - previous[0]) * latScale;
        double length = Math.hypot(directionX, directionY);
        if (length < 1d) {
            return base;
        }

        double normalX = -directionY / length;
        double normalY = directionX / length;
        double signedDistance = meters * (0.55d + random.nextDouble() * 0.8d) * (random.nextBoolean() ? 1d : -1d);

        double lngOffset = (normalX * signedDistance) / lngScale;
        double latOffset = (normalY * signedDistance) / latScale;
        return new double[]{base[0] + latOffset, base[1] + lngOffset};
    }

    private RoutePlanningPreferences adaptPreferences(RoutePlanningPreferences basePreferences, String style) {
        RoutePlanningPreferences effective = basePreferences == null ? RoutePlanningPreferences.defaults() : basePreferences;
        RoutePlanningPreferences.RoutePlanningPreferencesBuilder builder = effective.toBuilder();

        switch (style) {
            case "longer" -> builder.distancePreference(RoutePlanningPreferences.DistancePreference.LONGER);
            case "harder" -> builder
                    .distancePreference(RoutePlanningPreferences.DistancePreference.LONGER)
                    .climbPreference(RoutePlanningPreferences.ClimbPreference.HILLIER);
            case "easier" -> builder
                    .trafficPreference(RoutePlanningPreferences.TrafficPreference.QUIETER)
                    .climbPreference(RoutePlanningPreferences.ClimbPreference.FLATTER);
            default -> {
            }
        }

        return builder.build();
    }

    private double scoreGeneratedPreview(RoutePreview preview, RouteTemplate template, double targetDistanceM, String style) {
        double distance = preview.getDistanceM() == null ? 0 : preview.getDistanceM().doubleValue();
        double gain = preview.getElevationGainM() == null ? 0 : preview.getElevationGainM().doubleValue();
        double score = Math.abs(distance - targetDistanceM);

        if ("longer".equals(style) && distance < template.distanceM()) {
            score += (template.distanceM() - distance) * 1.8d;
        }
        if ("harder".equals(style)) {
            score -= gain * 2.5d;
        }
        if ("easier".equals(style)) {
            score += gain * 2.2d;
        }
        if (preview.getPolyline() == null || preview.getPolyline().size() < 6) {
            score += 100_000d;
        }

        return score;
    }

    private String describeStrategy(String style, int targetDistanceKm, int variationLevel, RouteTemplate template) {
        return switch (style) {
            case "longer" -> "Wariant dłuższej pętli na bazie „" + template.name() + "” (~" + targetDistanceKm + " km, losowość " + variationLevel + "%).";
            case "harder" -> "Wariant trudniejszy z większym naciskiem na przewyższenia, inspirowany „" + template.name() + "”.";
            case "easier" -> "Wariant łagodniejszy i spokojniejszy, oparty o „" + template.name() + "”.";
            default -> "Wariant podobny do historycznej trasy „" + template.name() + "”, lekko zrandomizowany dla świeżości przebiegu.";
        };
    }

    private RouteTemplate toRouteTemplate(PlannedRoute route) {
        if (route.getPolyline() == null || route.getPolyline().size() < 4) {
            return null;
        }

        double distance = route.getTotalDistanceM() != null
                ? route.getTotalDistanceM().doubleValue()
                : calculateDistance(route.getPolyline());
        if (distance < 5_000d) {
            return null;
        }

        return new RouteTemplate(
                route.getName() == null || route.getName().isBlank() ? "Zapisana trasa" : route.getName(),
                "planned-route",
                route.getPolyline(),
                distance,
                route.getTotalElevationGainM() == null ? 0 : route.getTotalElevationGainM().doubleValue(),
                isLoop(route.getPolyline()));
    }

    private RouteTemplate toRouteTemplate(Activity activity) {
        if (!isCyclingActivity(activity)) {
            return null;
        }

        List<double[]> polyline = extractActivityPolyline(activity);
        if (polyline.size() < 4) {
            return null;
        }

        double distance = activity.getDistanceM() != null
                ? activity.getDistanceM().doubleValue()
                : calculateDistance(polyline);
        if (distance < 5_000d) {
            return null;
        }

        return new RouteTemplate(
                activity.getName() == null || activity.getName().isBlank() ? "Aktywność historyczna" : activity.getName(),
                "activity",
                polyline,
                distance,
                activity.getElevationGainM() == null ? 0 : activity.getElevationGainM().doubleValue(),
                isLoop(polyline));
    }

    private List<double[]> extractActivityPolyline(Activity activity) {
        if (activity.hasGpsData() && activity.getLatStream().length == activity.getLngStream().length) {
            List<double[]> polyline = new ArrayList<>();
            for (int index = 0; index < activity.getLatStream().length; index++) {
                polyline.add(new double[]{activity.getLatStream()[index], activity.getLngStream()[index]});
            }
            return polyline;
        }
        if (activity.getSummaryPolyline() != null && !activity.getSummaryPolyline().isBlank()) {
            return PolylineCodec.decodeToLatLng(activity.getSummaryPolyline());
        }
        return List.of();
    }

    private boolean isCyclingActivity(Activity activity) {
        if (activity.getSportType() == null) {
            return false;
        }
        String sport = activity.getSportType().toLowerCase(Locale.ROOT);
        return sport.contains("ride") || sport.contains("cycling");
    }

    private boolean isLoop(List<double[]> polyline) {
        return polyline.size() > 2
                && haversineDistance(polyline.getFirst(), polyline.getLast()) <= LOOP_THRESHOLD_M;
    }

    private double calculateDistance(List<double[]> polyline) {
        double distance = 0;
        for (int index = 1; index < polyline.size(); index++) {
            distance += haversineDistance(polyline.get(index - 1), polyline.get(index));
        }
        return distance;
    }

    private double haversineDistance(double[] first, double[] second) {
        double dLat = Math.toRadians(second[0] - first[0]);
        double dLon = Math.toRadians(second[1] - first[1]);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(first[0])) * Math.cos(Math.toRadians(second[0]))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String normalizeStyle(String style) {
        if (style == null || style.isBlank()) {
            return "balanced";
        }
        String normalized = style.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "balanced", "longer", "harder", "easier" -> normalized;
            default -> "balanced";
        };
    }

    private int clamp(Integer value, int min, int max, int fallback) {
        if (value == null) {
            return fallback;
        }
        return Math.max(min, Math.min(max, value));
    }

    private double[] copy(double[] point) {
        return new double[]{point[0], point[1]};
    }

    private record GenerationContext(
            String requestedStyle,
            int targetDistanceKm,
            int variationLevel,
            long seed,
            double[] requestedStart,
            List<RouteTemplate> candidateTemplates,
            RoutePlanningPreferences basePreferences
    ) {
        double targetDistanceM() {
            return targetDistanceKm * 1000d;
        }
    }

    private record RouteTemplate(
            String name,
            String sourceType,
            List<double[]> polyline,
            double distanceM,
            double elevationGainM,
            boolean loop
    ) {
        boolean supportsRequestedStart(double[] start) {
            return loop || endpointDistanceTo(start) <= NON_LOOP_ENDPOINT_PROXIMITY_M;
        }

        double minDistanceTo(double[] start) {
            double best = Double.MAX_VALUE;
            for (int index = 0; index < polyline.size(); index++) {
                double distance = distanceBetween(polyline.get(index), start);
                if (distance < best) {
                    best = distance;
                }
            }
            return best;
        }

        int nearestIndexTo(double[] start) {
            int bestIndex = 0;
            double bestDistance = Double.MAX_VALUE;
            for (int index = 0; index < polyline.size(); index++) {
                double distance = distanceBetween(polyline.get(index), start);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestIndex = index;
                }
            }
            return bestIndex;
        }

        double endpointDistanceTo(double[] start) {
            return Math.min(distanceToFirstEndpoint(start), distanceToLastEndpoint(start));
        }

        double distanceToFirstEndpoint(double[] start) {
            return distanceBetween(polyline.getFirst(), start);
        }

        double distanceToLastEndpoint(double[] start) {
            return distanceBetween(polyline.getLast(), start);
        }

        private double distanceBetween(double[] point, double[] start) {
            double dLat = Math.toRadians(point[0] - start[0]);
            double dLon = Math.toRadians(point[1] - start[1]);
            double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                    + Math.cos(Math.toRadians(start[0])) * Math.cos(Math.toRadians(point[0]))
                    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
    }
}
