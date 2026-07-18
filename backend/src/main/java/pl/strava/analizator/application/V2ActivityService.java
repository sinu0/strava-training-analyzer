package pl.strava.analizator.application;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.ActivityStreamsDto;
import pl.strava.analizator.application.dto.ActivitySummaryDto;
import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.application.dto.ActivityTrainingEffectDto;
import pl.strava.analizator.application.dto.ActivityV2DetailDto;
import pl.strava.analizator.application.dto.MetricValueDto;
import pl.strava.analizator.application.dto.LapDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityCoreView;
import pl.strava.analizator.domain.model.ActivityTrainingEffect;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityReadRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.ActivityTrainingEffectRepository;

@Service
@RequiredArgsConstructor
public class V2ActivityService {

    private static final OffsetDateTime EARLIEST_ACTIVITY = OffsetDateTime.parse("1970-01-01T00:00:00Z");
    private static final OffsetDateTime LATEST_ACTIVITY = OffsetDateTime.parse("2200-01-01T00:00:00Z");
    private static final Set<String> ALLOWED_SERIES = Set.of(
            "power", "heartrate", "cadence", "altitude", "distance", "velocity", "latitude", "longitude");
    private static final Set<String> DEFAULT_SERIES = Set.of(
            "power", "heartrate", "cadence", "altitude", "distance", "velocity");

    private final ActivityReadRepository activityReadRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository metricRepository;
    private final ActivityTrainingEffectRepository trainingEffectRepository;

    public ActivitySummaryPageDto findActivities(String sportType, OffsetDateTime from, OffsetDateTime to,
                                                  int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        OffsetDateTime safeFrom = from != null ? from : EARLIEST_ACTIVITY;
        OffsetDateTime safeTo = to != null ? to : LATEST_ACTIVITY;
        var result = activityReadRepository.findSummaries(
                blankToNull(sportType), safeFrom, safeTo, safePage, safeSize);
        Map<UUID, ActivityTrainingEffect> effects = trainingEffectRepository.findByActivityIds(
                result.items().stream().map(ActivityCoreView::getId).toList());
        List<ActivitySummaryDto> items = result.items().stream()
                .map(item -> toSummary(item, effects.get(item.getId())))
                .toList();
        return ActivitySummaryPageDto.builder()
                .items(items)
                .total(result.total())
                .page(result.page())
                .size(result.size())
                .totalPages(result.totalPages())
                .build();
    }

    public ActivityV2DetailDto findActivity(UUID id) {
        ActivityCoreView activity = activityReadRepository.findCoreById(id)
                .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + id));
        ActivityTrainingEffect effect = trainingEffectRepository.findByActivityId(id).orElse(null);
        return ActivityV2DetailDto.builder()
                .id(activity.getId())
                .externalId(activity.getExternalId())
                .source(activity.getSource())
                .sportType(activity.getSportType())
                .name(activity.getName())
                .description(activity.getDescription())
                .startedAt(activity.getStartedAt())
                .elapsedTimeSec(activity.getElapsedTimeSec())
                .movingTimeSec(activity.getMovingTimeSec())
                .distanceM(activity.getDistanceM())
                .elevationGainM(activity.getElevationGainM())
                .elevationLossM(activity.getElevationLossM())
                .avgSpeedMs(activity.getAvgSpeedMs())
                .maxSpeedMs(activity.getMaxSpeedMs())
                .avgHeartrate(activity.getAvgHeartrate())
                .maxHeartrate(activity.getMaxHeartrate())
                .avgPowerW(activity.getAvgPowerW())
                .maxPowerW(activity.getMaxPowerW())
                .avgCadence(activity.getAvgCadence())
                .maxCadence(activity.getMaxCadence())
                .calories(activity.getCalories())
                .avgTempC(activity.getAvgTempC())
                .summaryPolyline(activity.getSummaryPolyline())
                .metrics(metricRepository.findAllByActivityId(id).stream().map(MetricValueDto::from).toList())
                .trainingEffect(effect != null ? toEffect(effect) : null)
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }

    public ActivityStreamsDto findStreams(UUID id, String requestedSeries, String requestedResolution) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + id));
        Set<String> series = parseSeries(requestedSeries);
        int originalPoints = originalPointCount(activity, series);
        int maxPoints = parseResolution(requestedResolution);
        int step = maxPoints == Integer.MAX_VALUE || originalPoints <= maxPoints
                ? 1
                : (int) Math.ceil((double) originalPoints / maxPoints);

        ActivityStreamsDto dto = ActivityStreamsDto.builder()
                .series(List.copyOf(series))
                .originalPoints(originalPoints)
                .resolution(maxPoints == Integer.MAX_VALUE ? "full" : Integer.toString(maxPoints))
                .time(downsample(activity.getTimeStream(), step))
                .power(series.contains("power") ? downsample(activity.getPowerStream(), step) : null)
                .heartrate(series.contains("heartrate") ? downsample(activity.getHeartrateStream(), step) : null)
                .cadence(series.contains("cadence") ? downsample(activity.getCadenceStream(), step) : null)
                .altitude(series.contains("altitude") ? downsample(activity.getAltitudeStream(), step) : null)
                .distance(series.contains("distance") ? downsample(activity.getDistanceStream(), step) : null)
                .velocity(series.contains("velocity") ? downsample(activity.getVelocityStream(), step) : null)
                .latitude(series.contains("latitude") ? downsample(activity.getLatStream(), step) : null)
                .longitude(series.contains("longitude") ? downsample(activity.getLngStream(), step) : null)
                .build();
        dto.setReturnedPoints(returnedPointCount(dto));
        return dto;
    }

    public List<LapDto> findLaps(UUID id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + id));
        if (activity.getLaps() == null) return List.of();
        return activity.getLaps().stream().map(lap -> LapDto.builder()
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
                .build()).toList();
    }

    private ActivitySummaryDto toSummary(ActivityCoreView activity, ActivityTrainingEffect effect) {
        return ActivitySummaryDto.builder()
                .id(activity.getId())
                .externalId(activity.getExternalId())
                .sportType(activity.getSportType())
                .name(activity.getName())
                .startedAt(activity.getStartedAt())
                .movingTimeSec(activity.getMovingTimeSec())
                .distanceM(activity.getDistanceM())
                .elevationGainM(activity.getElevationGainM())
                .avgHeartrate(activity.getAvgHeartrate())
                .avgPowerW(activity.getAvgPowerW())
                .avgSpeedMs(activity.getAvgSpeedMs())
                .calories(activity.getCalories())
                .summaryPolyline(activity.getSummaryPolyline())
                .primaryBenefit(effect != null ? effect.getPrimaryBenefit() : null)
                .trainingScore(effect != null ? effect.getTrainingScore() : null)
                .build();
    }

    private ActivityTrainingEffectDto toEffect(ActivityTrainingEffect effect) {
        return ActivityTrainingEffectDto.builder()
                .trainingScore(effect.getTrainingScore())
                .aerobicTe(effect.getAerobicTe())
                .anaerobicTe(effect.getAnaerobicTe())
                .aerobicLabel(effect.getAerobicLabel())
                .anaerobicLabel(effect.getAnaerobicLabel())
                .primaryBenefit(effect.getPrimaryBenefit())
                .secondaryBenefit(effect.getSecondaryBenefit())
                .recoveryTimeHours(effect.getRecoveryTimeHours())
                .qualityScore(effect.getQualityScore())
                .calculatedAt(effect.getCalculatedAt())
                .dataQuality(effect.getDataQuality())
                .details(effect.getDetails())
                .build();
    }

    private Set<String> parseSeries(String requestedSeries) {
        if (requestedSeries == null || requestedSeries.isBlank()) {
            return new LinkedHashSet<>(DEFAULT_SERIES);
        }
        Set<String> parsed = new LinkedHashSet<>();
        Arrays.stream(requestedSeries.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .forEach(value -> {
                    if (!ALLOWED_SERIES.contains(value)) {
                        throw new IllegalArgumentException("Unknown stream series: " + value);
                    }
                    parsed.add(value);
                });
        return parsed;
    }

    private int parseResolution(String requestedResolution) {
        if (requestedResolution == null || requestedResolution.isBlank()) return 1000;
        if ("full".equalsIgnoreCase(requestedResolution)) return Integer.MAX_VALUE;
        try {
            return Math.max(50, Math.min(Integer.parseInt(requestedResolution), 10_000));
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Resolution must be a point limit or 'full'");
        }
    }

    private int originalPointCount(Activity activity, Set<String> series) {
        int count = length(activity.getTimeStream());
        if (series.contains("power")) count = Math.max(count, length(activity.getPowerStream()));
        if (series.contains("heartrate")) count = Math.max(count, length(activity.getHeartrateStream()));
        if (series.contains("cadence")) count = Math.max(count, length(activity.getCadenceStream()));
        if (series.contains("altitude")) count = Math.max(count, length(activity.getAltitudeStream()));
        if (series.contains("distance")) count = Math.max(count, length(activity.getDistanceStream()));
        if (series.contains("velocity")) count = Math.max(count, length(activity.getVelocityStream()));
        if (series.contains("latitude")) count = Math.max(count, length(activity.getLatStream()));
        if (series.contains("longitude")) count = Math.max(count, length(activity.getLngStream()));
        return count;
    }

    private int returnedPointCount(ActivityStreamsDto dto) {
        int count = length(dto.getTime());
        count = Math.max(count, length(dto.getPower()));
        count = Math.max(count, length(dto.getHeartrate()));
        count = Math.max(count, length(dto.getCadence()));
        count = Math.max(count, length(dto.getAltitude()));
        count = Math.max(count, length(dto.getDistance()));
        count = Math.max(count, length(dto.getVelocity()));
        count = Math.max(count, length(dto.getLatitude()));
        return Math.max(count, length(dto.getLongitude()));
    }

    private int[] downsample(int[] values, int step) {
        if (values == null) return null;
        int[] result = new int[(values.length + step - 1) / step];
        for (int source = 0, target = 0; source < values.length; source += step, target++) {
            result[target] = values[source];
        }
        return result;
    }

    private double[] downsample(double[] values, int step) {
        if (values == null) return null;
        double[] result = new double[(values.length + step - 1) / step];
        for (int source = 0, target = 0; source < values.length; source += step, target++) {
            result[target] = values[source];
        }
        return result;
    }

    private int length(int[] values) {
        return values != null ? values.length : 0;
    }

    private int length(double[] values) {
        return values != null ? values.length : 0;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
