package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.ActivityHeatmapBoundsDto;
import pl.strava.analizator.application.dto.ActivityHeatmapDto;
import pl.strava.analizator.application.dto.ActivityDetailDto;
import pl.strava.analizator.application.dto.ActivitySummaryDto;
import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.application.dto.HeatmapSegmentDto;
import pl.strava.analizator.application.dto.LapDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.HeatmapSegment;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.HeatmapSegmentRepository;
import pl.strava.analizator.domain.vo.ActivityFilter;
import pl.strava.analizator.domain.vo.ActivityPage;
import pl.strava.analizator.domain.vo.Lap;
import pl.strava.analizator.domain.vo.ActivityTimelineEntry;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private static final Map<String, String> METRIC_ALIASES = Map.of(
            "normalized_power", "normalizedPower",
            "training_stress_score", "tss",
            "intensity_factor", "if",
            "efficiency_factor", "ef",
            "aerobic_decoupling", "aerobicDecoupling",
            "power_fade", "powerFade",
            "power_curve", "powerCurve",
            "time_in_zones", "timeInZones",
            "hr_training_stress_score", "hrTss"
    );

    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository metricRepository;
    private final HeatmapSegmentRepository heatmapSegmentRepository;
    private final HeatmapBuildService heatmapBuildService;

    public ActivitySummaryPageDto findAll(String sportType, OffsetDateTime from, OffsetDateTime to,
            BigDecimal minDistanceM, BigDecimal maxDistanceM,
            Integer minMovingTimeSec, Integer maxMovingTimeSec,
            Short minAvgPowerW, Short maxAvgPowerW,
            Short minAvgHr, Short maxAvgHr,
            int page, int size) {
        ActivityFilter filter = new ActivityFilter(
            sportType, from, to,
            minDistanceM, maxDistanceM,
            minMovingTimeSec, maxMovingTimeSec,
            minAvgPowerW, maxAvgPowerW,
            minAvgHr, maxAvgHr,
            page, size
        );
        ActivityPage activityPage = activityRepository.findFiltered(filter);
        List<ActivitySummaryDto> items = activityPage.items().stream().map(this::toSummary).toList();
        return ActivitySummaryPageDto.builder()
                .items(items)
                .total(activityPage.total())
                .page(activityPage.page())
                .size(activityPage.size())
                .totalPages(activityPage.totalPages())
                .build();
    }

    public List<ActivityTimelineEntry> getTimeline() {
        return activityRepository.getTimeline();
    }

    public ActivityDetailDto findById(UUID id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + id));

        List<MetricResult> metrics = metricRepository.findAllByActivityId(id);
        Map<String, Object> metricsMap = new HashMap<>();
        for (MetricResult m : metrics) {
            Object value = m.isNumeric() ? m.getNumericValue() : m.getJsonValue();
            String alias = METRIC_ALIASES.get(m.getMetricName());
            String displayName = alias != null ? alias : m.getMetricName();
            metricsMap.put(displayName, value);
        }

        return toDetail(activity, metricsMap);
    }

    public Map<String, Object> getActivityMapGeoJson(UUID id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + id));

        if (activity.getSummaryPolyline() == null) {
            return Map.of("type", "FeatureCollection", "features", List.of());
        }

        return Map.of(
                "type", "Feature",
                "geometry", Map.of(
                        "type", "LineString",
                        "coordinates", decodePolyline(activity.getSummaryPolyline())
                ),
                "properties", Map.of(
                        "name", activity.getName() != null ? activity.getName() : "",
                        "sportType", activity.getSportType() != null ? activity.getSportType() : ""
                )
        );
    }

    public List<HeatmapSegment> getHeatmapSegmentsInBounds(double minLat, double maxLat, double minLon, double maxLon) {
        return heatmapSegmentRepository.findInBounds(minLat, maxLat, minLon, maxLon);
    }

    public int getHeatmapMaxCount() {
        return heatmapSegmentRepository.findMaxTraversalCount();
    }

    public ActivityHeatmapDto getRouteHeatmap() {
        if (heatmapBuildService.isRebuilding()) {
            return new ActivityHeatmapDto(List.of(), 0, null, 0.0, 0, "rebuilding");
        }

        List<HeatmapSegment> segments = heatmapSegmentRepository.findAll();
        if (segments.isEmpty()) {
            int activitiesWithPolylines = activityRepository.countActivitiesWithPolylines();
            if (activitiesWithPolylines == 0) {
                return new ActivityHeatmapDto(List.of(), 0, null, 0.0, 0, "ready");
            }
            heatmapBuildService.rebuildAll(); // async — returns immediately
            return new ActivityHeatmapDto(List.of(), 0, null, 0.0, 0, "rebuilding");
        }

        int maxCount = heatmapSegmentRepository.findMaxTraversalCount();
        int routeCount = activityRepository.countActivitiesWithPolylines();
        double totalDistanceKm = activityRepository.sumDistanceMetersForActivitiesWithPolylines() / 1000.0;

        ActivityHeatmapBoundsDto bounds = computeBoundsFromSegments(segments);

        List<HeatmapSegmentDto> dtos = segments.stream()
                .map(s -> new HeatmapSegmentDto(s.getLat1(), s.getLon1(), s.getLat2(), s.getLon2(), s.getTraversalCount()))
                .toList();

        return new ActivityHeatmapDto(dtos, routeCount, bounds, totalDistanceKm, maxCount, "ready");
    }

    private ActivityHeatmapBoundsDto computeBoundsFromSegments(List<HeatmapSegment> segments) {
        double north = segments.stream().mapToDouble(s -> Math.max(s.getLat1(), s.getLat2())).max().orElse(0);
        double south = segments.stream().mapToDouble(s -> Math.min(s.getLat1(), s.getLat2())).min().orElse(0);
        double east  = segments.stream().mapToDouble(s -> Math.max(s.getLon1(), s.getLon2())).max().orElse(0);
        double west  = segments.stream().mapToDouble(s -> Math.min(s.getLon1(), s.getLon2())).min().orElse(0);
        return new ActivityHeatmapBoundsDto(south, west, north, east);
    }

    private ActivitySummaryDto toSummary(Activity a) {
        return ActivitySummaryDto.builder()
                .id(a.getId())
                .externalId(a.getExternalId())
                .sportType(a.getSportType())
                .name(a.getName())
                .startedAt(a.getStartedAt())
                .movingTimeSec(a.getMovingTimeSec())
                .distanceM(a.getDistanceM())
                .elevationGainM(a.getElevationGainM())
                .avgHeartrate(a.getAvgHeartrate())
                .avgPowerW(a.getAvgPowerW())
                .avgSpeedMs(a.getAvgSpeedMs())
                .calories(a.getCalories())
                .summaryPolyline(a.getSummaryPolyline())
                .photoUrls(a.getPhotoUrls())
                .build();
    }

    private ActivityDetailDto toDetail(Activity a, Map<String, Object> metrics) {
        return ActivityDetailDto.builder()
                .id(a.getId())
                .externalId(a.getExternalId())
                .source(a.getSource())
                .sportType(a.getSportType())
                .name(a.getName())
                .description(a.getDescription())
                .startedAt(a.getStartedAt())
                .elapsedTimeSec(a.getElapsedTimeSec())
                .movingTimeSec(a.getMovingTimeSec())
                .distanceM(a.getDistanceM())
                .elevationGainM(a.getElevationGainM())
                .elevationLossM(a.getElevationLossM())
                .avgSpeedMs(a.getAvgSpeedMs())
                .maxSpeedMs(a.getMaxSpeedMs())
                .avgHeartrate(a.getAvgHeartrate())
                .maxHeartrate(a.getMaxHeartrate())
                .avgPowerW(a.getAvgPowerW())
                .maxPowerW(a.getMaxPowerW())
                .avgCadence(a.getAvgCadence())
                .maxCadence(a.getMaxCadence())
                .calories(a.getCalories())
                .avgTempC(a.getAvgTempC())
                .summaryPolyline(a.getSummaryPolyline())
                .photoUrls(a.getPhotoUrls())
                .powerStream(a.getPowerStream())
                .heartrateStream(a.getHeartrateStream())
                .cadenceStream(a.getCadenceStream())
                .altitudeStream(a.getAltitudeStream())
                .timeStream(a.getTimeStream())
                .latStream(a.getLatStream())
                .lngStream(a.getLngStream())
                .distanceStream(a.getDistanceStream())
                .velocityStream(a.getVelocityStream())
                .laps(mapLaps(a))
                .metrics(metrics)
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private List<LapDto> mapLaps(Activity a) {
        if (a.getLaps() == null || a.getLaps().isEmpty()) return List.of();
        return a.getLaps().stream().map(lap -> LapDto.builder()
                .lapIndex(lap.getLapIndex() != null ? lap.getLapIndex() : 0)
                .name(lap.getName())
                .startIndex(lap.getStartIndex())
                .endIndex(lap.getEndIndex())
                .distanceM(lap.getDistanceM())
                .elapsedTimeSec(lap.getElapsedTimeSec())
                .movingTimeSec(lap.getMovingTimeSec())
                .avgSpeedMs(lap.getAvgSpeedMs())
                .maxSpeedMs(lap.getMaxSpeedMs())
                .avgHeartrate(lap.getAvgHeartrate())
                .maxHeartrate(lap.getMaxHeartrate())
                .avgPowerW(lap.getAvgPowerW())
                .maxPowerW(lap.getMaxPowerW())
                .avgCadence(lap.getAvgCadence())
                .totalElevationGain(lap.getTotalElevationGain())
                .normalizedPowerW(lap.getNormalizedPowerW())
                .variabilityIndex(lap.getVariabilityIndex())
                .powerDropPct(lap.getPowerDropPct())
                .intensityClass(lap.getIntensityClass())
                .build()
        ).toList();
    }

    /**
     * Decode Google encoded polyline to list of [lng, lat] coordinate pairs (GeoJSON format).
     */
    private List<double[]> decodePolyline(String encoded) {
        List<double[]> coords = new java.util.ArrayList<>();
        int index = 0;
        int lat = 0;
        int lng = 0;

        while (index < encoded.length()) {
            int shift = 0;
            int result = 0;
            int b;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lat += ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            lng += ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));

            coords.add(new double[]{lng / 1e5, lat / 1e5}); // GeoJSON: [lng, lat]
        }
        return coords;
    }
}
