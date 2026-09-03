package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.ActivitySegmentsDto;
import pl.strava.analizator.application.dto.SegmentComparisonDto;
import pl.strava.analizator.application.dto.SegmentComparisonPointDto;
import pl.strava.analizator.application.dto.SegmentComparisonSeriesDto;
import pl.strava.analizator.application.dto.SegmentDetailDto;
import pl.strava.analizator.application.dto.SegmentEffortDto;
import pl.strava.analizator.application.dto.SegmentPageDto;
import pl.strava.analizator.application.dto.SegmentSummaryDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AnalysisBackfillState;
import pl.strava.analizator.domain.model.Segment;
import pl.strava.analizator.domain.model.SegmentEffort;
import pl.strava.analizator.domain.model.SegmentPage;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AnalysisBackfillRepository;
import pl.strava.analizator.domain.port.SegmentRepository;

@Service
@RequiredArgsConstructor
public class SegmentAnalysisService {

    private final SegmentRepository segmentRepository;
    private final ActivityRepository activityRepository;
    private final AnalysisBackfillRepository backfillRepository;
    private final SegmentEffortMetricsCalculator metricsCalculator;
    private final SegmentRecordDetector recordDetector;
    private final SegmentEffortRanker effortRanker;

    @Transactional
    public int importActivity(Activity activity, List<SegmentEffort> importedEfforts, String availability) {
        if (activity == null || activity.getId() == null) return 0;
        List<SegmentEffort> efforts = importedEfforts != null ? importedEfforts : List.of();
        String capability = "AVAILABLE".equals(availability) ? "AVAILABLE" : "UNAVAILABLE";
        if (!"AVAILABLE".equals(capability)) {
            segmentRepository.markActivityScanned(activity.getId(), capability, 0);
            return 0;
        }

        Instant now = Instant.now();
        java.util.Set<Long> changedSegments = new java.util.LinkedHashSet<>();
        for (int sequence = 0; sequence < efforts.size(); sequence++) {
            SegmentEffort imported = efforts.get(sequence);
            Segment metadata = imported.getSegment();
            if (metadata == null || metadata.getId() == null) continue;
            Segment existing = segmentRepository.findSegment(metadata.getId()).orElse(null);
            String polyline = existing != null && existing.getRoutePolyline() != null
                    ? existing.getRoutePolyline() : metricsCalculator.routePolyline(activity, imported);
            Segment savedSegment = segmentRepository.saveSegment(metadata.toBuilder()
                    .localFavorite(existing != null && existing.isLocalFavorite())
                    .routePolyline(polyline)
                    .effortCount(existing != null ? existing.getEffortCount() : 0)
                    .bestElapsedTimeSec(existing != null ? existing.getBestElapsedTimeSec() : null)
                    .latestEffortAt(existing != null ? existing.getLatestEffortAt() : null)
                    .createdAt(existing != null ? existing.getCreatedAt() : now)
                    .updatedAt(now)
                    .build());
            SegmentEffort enriched = metricsCalculator.enrich(activity, imported.toBuilder()
                    .segmentId(savedSegment.getId()).segment(null).activityId(activity.getId())
                    .startedAt(imported.getStartedAt() != null ? imported.getStartedAt() : activity.getStartedAt())
                    .sequence(sequence).build());
            segmentRepository.saveEffort(enriched);
            changedSegments.add(savedSegment.getId());
        }

        for (Long segmentId : changedSegments) recalculateSegment(segmentId);
        segmentRepository.markActivityScanned(activity.getId(), capability, efforts.size());
        return efforts.size();
    }

    private void recalculateSegment(long segmentId) {
        List<SegmentEffort> detected = recordDetector.detect(segmentRepository.findEffortsBySegment(segmentId));
        detected.forEach(segmentRepository::saveEffort);
        Segment segment = requireSegment(segmentId);
        Integer best = detected.stream().map(SegmentEffort::getElapsedTimeSec).filter(value -> value != null && value > 0)
                .min(Integer::compareTo).orElse(null);
        var latest = detected.stream().map(SegmentEffort::getStartedAt).filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder()).orElse(null);
        segmentRepository.saveSegment(segment.toBuilder().effortCount(detected.size())
                .bestElapsedTimeSec(best).latestEffortAt(latest).updatedAt(Instant.now()).build());
    }

    public SegmentPageDto findSegments(String query, Boolean favorite, BigDecimal minDistanceM, BigDecimal maxDistanceM,
                                       BigDecimal minAverageGrade, String sort, int page, int size) {
        SegmentPage result = segmentRepository.findSegments(query, favorite, minDistanceM, maxDistanceM,
                minAverageGrade, sort, page, size);
        return SegmentPageDto.builder().items(result.items().stream().map(this::toSummary).toList())
                .total(result.total()).page(result.page()).size(result.size()).totalPages(result.totalPages()).build();
    }

    public SegmentDetailDto findSegment(long id) {
        Segment segment = requireSegment(id);
        List<SegmentEffort> efforts = segmentRepository.findEffortsBySegment(id);
        boolean complete = isSegmentBackfillComplete();
        Map<UUID, String> names = activityRepository.findNamesByIds(
                efforts.stream().map(SegmentEffort::getActivityId).distinct().toList());
        Map<UUID, Integer> ranks = effortRanker.rank(efforts);
        return SegmentDetailDto.builder().segment(toSummary(segment))
                .efforts(efforts.stream().sorted(Comparator.comparing(SegmentEffort::getStartedAt).reversed())
                        .map(effort -> toEffort(effort, segment, names.get(effort.getActivityId()), ranks, complete)).toList())
                .backfillStatus(segmentBackfillStatus()).personalBestConfirmed(complete).build();
    }

    public List<SegmentEffortDto> findSegmentEfforts(long id) {
        return findSegment(id).getEfforts();
    }

    public ActivitySegmentsDto findActivitySegments(UUID activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + activityId));
        List<SegmentEffort> efforts = segmentRepository.findEffortsByActivity(activityId);
        boolean complete = isSegmentBackfillComplete();
        Map<Long, Segment> segments = efforts.stream().map(SegmentEffort::getSegmentId).distinct()
                .map(this::requireSegment).collect(Collectors.toMap(Segment::getId, Function.identity()));
        List<SegmentEffort> histories = segmentRepository.findEffortsBySegments(new ArrayList<>(segments.keySet()));
        Map<Long, List<SegmentEffort>> bySegment = histories.stream().collect(Collectors.groupingBy(SegmentEffort::getSegmentId));
        Map<Long, Map<UUID, Integer>> ranksBySegment = bySegment.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> effortRanker.rank(entry.getValue())));
        return ActivitySegmentsDto.builder().activityId(activityId).routePolyline(activity.getSummaryPolyline())
                .availability(segmentRepository.findActivityScanCapability(activityId).orElse("PENDING"))
                .backfillStatus(segmentBackfillStatus()).personalBestConfirmed(complete)
                .efforts(efforts.stream().map(effort -> toEffort(effort, segments.get(effort.getSegmentId()),
                        activity.getName(), ranksBySegment.getOrDefault(effort.getSegmentId(), Map.of()), complete)).toList())
                .build();
    }

    @Transactional
    public SegmentSummaryDto setFavorite(long id, boolean favorite) {
        Segment segment = requireSegment(id);
        return toSummary(segmentRepository.saveSegment(segment.toBuilder().localFavorite(favorite)
                .updatedAt(Instant.now()).build()));
    }

    public SegmentComparisonDto compare(long segmentId, List<UUID> effortIds, UUID referenceEffortId) {
        if (effortIds == null || effortIds.isEmpty()) throw new IllegalArgumentException("Choose at least one effort");
        List<UUID> distinct = effortIds.stream().distinct().toList();
        if (distinct.size() > 3) throw new IllegalArgumentException("At most 3 efforts can be compared");
        UUID selectedReferenceId = referenceEffortId != null ? referenceEffortId : distinct.getFirst();
        if (!distinct.contains(selectedReferenceId)) throw new IllegalArgumentException("Reference effort must be selected");
        Segment segment = requireSegment(segmentId);
        Map<UUID, SegmentEffort> available = segmentRepository.findEffortsBySegment(segmentId).stream()
                .collect(Collectors.toMap(SegmentEffort::getId, Function.identity()));
        Map<UUID, String> names = activityRepository.findNamesByIds(distinct.stream()
                .map(id -> requireEffort(available, id).getActivityId()).toList());
        List<SegmentComparisonSeriesDto> series = distinct.stream().map(id -> {
            SegmentEffort effort = requireEffort(available, id);
            Activity activity = activityRepository.findById(effort.getActivityId())
                    .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + effort.getActivityId()));
            return comparisonSeries(segment, effort, activity, names.get(effort.getActivityId()));
        }).toList();
        SegmentComparisonSeriesDto reference = series.stream().filter(item -> item.getEffortId().equals(selectedReferenceId))
                .findFirst().orElseThrow();
        for (SegmentComparisonSeriesDto item : series) {
            for (int i = 0; i < item.getPoints().size(); i++) {
                Double time = item.getPoints().get(i).getTimeSec();
                Double referenceTime = reference.getPoints().get(i).getTimeSec();
                item.getPoints().get(i).setTimeDeltaSec(time != null && referenceTime != null ? time - referenceTime : null);
            }
        }
        double distance = segment.getDistanceM() != null ? segment.getDistanceM().doubleValue() : 0;
        return SegmentComparisonDto.builder().segmentId(segmentId).referenceEffortId(selectedReferenceId)
                .distanceM(distance).series(series).build();
    }

    private SegmentComparisonSeriesDto comparisonSeries(Segment segment, SegmentEffort effort, Activity activity, String name) {
        List<SegmentComparisonPointDto> points = new ArrayList<>();
        int start = effort.getStartIndex() != null ? Math.max(0, effort.getStartIndex()) : 0;
        int end = effort.getEndIndex() != null ? effort.getEndIndex() : start;
        int maxLength = maxStreamLength(activity) - 1;
        end = Math.max(start, Math.min(end, maxLength));
        double requestedDistance = segment.getDistanceM() != null ? segment.getDistanceM().doubleValue()
                : effort.getDistanceM() != null ? effort.getDistanceM().doubleValue() : 0;
        for (int step = 0; step <= 100; step++) {
            double fraction = step / 100.0;
            int index = indexAtDistance(activity.getDistanceStream(), start, end, fraction);
            points.add(SegmentComparisonPointDto.builder().distanceM(requestedDistance * fraction)
                    .timeSec(relative(activity.getTimeStream(), start, index))
                    .powerW(value(activity.getPowerStream(), index)).heartrate(value(activity.getHeartrateStream(), index))
                    .speedMs(value(activity.getVelocityStream(), index)).cadence(value(activity.getCadenceStream(), index))
                    .altitudeM(value(activity.getAltitudeStream(), index)).latitude(value(activity.getLatStream(), index))
                    .longitude(value(activity.getLngStream(), index)).build());
        }
        return SegmentComparisonSeriesDto.builder().effortId(effort.getId()).activityId(effort.getActivityId())
                .activityName(name).startedAt(effort.getStartedAt()).elapsedTimeSec(effort.getElapsedTimeSec()).points(points).build();
    }

    private int indexAtDistance(double[] distance, int start, int end, double fraction) {
        if (distance == null || start >= distance.length || end >= distance.length || end <= start) {
            return start + (int) Math.round((end - start) * fraction);
        }
        double target = distance[start] + (distance[end] - distance[start]) * fraction;
        for (int i = start; i <= end; i++) if (distance[i] >= target) return i;
        return end;
    }

    private int maxStreamLength(Activity activity) {
        return java.util.stream.IntStream.of(length(activity.getTimeStream()), length(activity.getDistanceStream()),
                length(activity.getPowerStream()), length(activity.getHeartrateStream()), length(activity.getCadenceStream()),
                length(activity.getAltitudeStream()), length(activity.getVelocityStream()), length(activity.getLatStream()),
                length(activity.getLngStream())).max().orElse(1);
    }
    private int length(int[] value) { return value != null ? value.length : 0; }
    private int length(double[] value) { return value != null ? value.length : 0; }
    private Double relative(int[] values, int start, int index) {
        return values != null && start < values.length && index < values.length ? (double) (values[index] - values[start]) : null;
    }
    private Double value(int[] values, int index) { return values != null && index < values.length ? (double) values[index] : null; }
    private Double value(double[] values, int index) { return values != null && index < values.length ? values[index] : null; }

    private SegmentEffort requireEffort(Map<UUID, SegmentEffort> available, UUID id) {
        SegmentEffort effort = available.get(id);
        if (effort == null) throw new IllegalArgumentException("Effort does not belong to segment: " + id);
        return effort;
    }
    private Segment requireSegment(long id) {
        return segmentRepository.findSegment(id).orElseThrow(() -> new SegmentNotFoundException("Segment not found: " + id));
    }
    private SegmentEffortDto toEffort(SegmentEffort effort, Segment segment, String activityName,
                                      Map<UUID, Integer> ranks, boolean complete) {
        int rank = ranks.getOrDefault(effort.getId(), 0);
        Integer difference = effort.getElapsedTimeSec() != null && segment.getBestElapsedTimeSec() != null
                ? effort.getElapsedTimeSec() - segment.getBestElapsedTimeSec() : null;
        String label = effort.isRecordAtTime() ? (complete ? "Nowy PR" : "Najlepszy w dostępnych danych")
                : rank > 0 && rank <= 3 ? rank + ". wynik" : null;
        return SegmentEffortDto.builder().id(effort.getId()).externalId(effort.getExternalId())
                .segmentId(effort.getSegmentId()).segmentName(segment.getName()).activityId(effort.getActivityId())
                .activityName(activityName).startedAt(effort.getStartedAt()).sequence(effort.getSequence())
                .startIndex(effort.getStartIndex()).endIndex(effort.getEndIndex()).elapsedTimeSec(effort.getElapsedTimeSec())
                .movingTimeSec(effort.getMovingTimeSec()).distanceM(effort.getDistanceM())
                .averagePowerW(effort.getAveragePowerW()).averageHeartrate(effort.getAverageHeartrate())
                .averageSpeedMs(effort.getAverageSpeedMs()).averageCadence(effort.getAverageCadence())
                .elevationGainM(effort.getElevationGainM()).deviceWatts(effort.getDeviceWatts())
                .personalRank(rank).differenceToBestSec(difference).recordAtTime(effort.isRecordAtTime())
                .previousBestElapsedTimeSec(effort.getPreviousBestElapsedTimeSec()).achievementLabel(label)
                .routePolyline(segment.getRoutePolyline()).build();
    }
    private SegmentSummaryDto toSummary(Segment value) {
        return SegmentSummaryDto.builder().id(value.getId()).name(value.getName()).activityType(value.getActivityType())
                .distanceM(value.getDistanceM()).averageGrade(value.getAverageGrade()).maximumGrade(value.getMaximumGrade())
                .elevationHighM(value.getElevationHighM()).elevationLowM(value.getElevationLowM())
                .startLatitude(value.getStartLatitude()).startLongitude(value.getStartLongitude())
                .endLatitude(value.getEndLatitude()).endLongitude(value.getEndLongitude())
                .city(value.getCity()).country(value.getCountry()).localFavorite(value.isLocalFavorite())
                .routePolyline(value.getRoutePolyline()).effortCount(value.getEffortCount())
                .bestElapsedTimeSec(value.getBestElapsedTimeSec()).latestEffortAt(value.getLatestEffortAt()).build();
    }
    private boolean isSegmentBackfillComplete() { return "COMPLETED".equals(segmentBackfillStatus()); }
    private String segmentBackfillStatus() {
        return backfillRepository.find("SEGMENTS").map(AnalysisBackfillState::getStatus).orElse("IDLE");
    }
}
