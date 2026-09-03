package pl.strava.analizator.infrastructure.persistence.adapter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ActivitySegmentStats;
import pl.strava.analizator.domain.model.Segment;
import pl.strava.analizator.domain.model.SegmentEffort;
import pl.strava.analizator.domain.model.SegmentPage;
import pl.strava.analizator.domain.port.SegmentRepository;
import pl.strava.analizator.infrastructure.persistence.entity.SegmentActivityImportEntity;
import pl.strava.analizator.infrastructure.persistence.entity.SegmentEffortEntity;
import pl.strava.analizator.infrastructure.persistence.entity.SegmentEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.SegmentActivityImportJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.SegmentEffortJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.SegmentJpaRepository;

@Component
@RequiredArgsConstructor
public class SegmentRepositoryAdapter implements SegmentRepository {

    private final SegmentJpaRepository segments;
    private final SegmentEffortJpaRepository efforts;
    private final SegmentActivityImportJpaRepository imports;
    private final ActivityJpaRepository activities;

    @Override
    public Segment saveSegment(Segment segment) {
        return toDomain(segments.save(toEntity(segment)));
    }

    @Override
    public Optional<Segment> findSegment(long id) {
        return segments.findById(id).map(this::toDomain);
    }

    @Override
    public SegmentPage findSegments(String query, Boolean favorite, BigDecimal minDistanceM, BigDecimal maxDistanceM,
                                    BigDecimal minAverageGrade, String sort, int page, int size) {
        Specification<SegmentEntity> spec = (root, ignored, criteria) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (query != null && !query.isBlank()) {
                predicates.add(criteria.like(criteria.lower(root.get("name")), "%" + query.trim().toLowerCase() + "%"));
            }
            if (favorite != null) predicates.add(criteria.equal(root.get("localFavorite"), favorite));
            if (minDistanceM != null) predicates.add(criteria.greaterThanOrEqualTo(root.get("distanceM"), minDistanceM));
            if (maxDistanceM != null) predicates.add(criteria.lessThanOrEqualTo(root.get("distanceM"), maxDistanceM));
            if (minAverageGrade != null) predicates.add(criteria.greaterThanOrEqualTo(root.get("averageGrade"), minAverageGrade));
            return criteria.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        Sort order = switch (sort == null ? "recent" : sort) {
            case "name" -> Sort.by("name").ascending();
            case "distance" -> Sort.by("distanceM").descending();
            case "attempts" -> Sort.by("effortCount").descending();
            case "best" -> Sort.by("bestElapsedTimeSec").ascending();
            default -> Sort.by("latestEffortAt").descending();
        };
        var result = segments.findAll(spec, PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), order));
        return new SegmentPage(result.getContent().stream().map(this::toDomain).toList(),
                result.getTotalElements(), result.getNumber(), result.getSize(), result.getTotalPages());
    }

    @Override
    public SegmentEffort saveEffort(SegmentEffort effort) {
        Optional<SegmentEffortEntity> existing = effort.getExternalId() != null
                ? efforts.findByExternalId(effort.getExternalId())
                : efforts.findByActivityIdAndSegmentIdAndStartIndex(
                        effort.getActivityId(), effort.getSegmentId(), effort.getStartIndex());
        SegmentEffort merged = effort.toBuilder()
                .id(existing.map(SegmentEffortEntity::getId).orElse(effort.getId()))
                .createdAt(existing.map(SegmentEffortEntity::getCreatedAt)
                        .orElse(effort.getCreatedAt() != null ? effort.getCreatedAt() : Instant.now()))
                .updatedAt(Instant.now())
                .build();
        return toDomain(efforts.save(toEntity(merged)));
    }

    @Override
    public List<SegmentEffort> findEffortsBySegment(long segmentId) {
        return efforts.findBySegmentIdOrderByStartedAtAsc(segmentId).stream().map(this::toDomain).toList();
    }

    @Override
    public List<SegmentEffort> findEffortsBySegments(List<Long> segmentIds) {
        if (segmentIds == null || segmentIds.isEmpty()) return List.of();
        return efforts.findBySegmentIdInOrderBySegmentIdAscStartedAtAsc(segmentIds).stream()
                .map(this::toDomain).toList();
    }

    @Override
    public List<SegmentEffort> findEffortsByActivity(UUID activityId) {
        return efforts.findByActivityIdOrderBySequenceAsc(activityId).stream().map(this::toDomain).toList();
    }

    @Override
    public Map<UUID, ActivitySegmentStats> summarizeActivities(List<UUID> activityIds) {
        if (activityIds == null || activityIds.isEmpty()) return Map.of();
        return activities.summarizeSegments(activityIds).stream()
                .map(value -> new ActivitySegmentStats(value.getActivityId(), value.getSegmentCount(), value.getNewRecordCount()))
                .collect(Collectors.toMap(ActivitySegmentStats::activityId, Function.identity()));
    }

    @Override
    public void markActivityScanned(UUID activityId, String capability, int effortCount) {
        imports.save(SegmentActivityImportEntity.builder().activityId(activityId).capability(capability)
                .effortCount(effortCount).checkedAt(Instant.now()).build());
    }

    @Override
    public boolean isActivityScanned(UUID activityId) {
        return imports.existsById(activityId);
    }

    @Override
    public Optional<String> findActivityScanCapability(UUID activityId) {
        return imports.findById(activityId).map(SegmentActivityImportEntity::getCapability);
    }

    @Override
    public List<UUID> findActivityIdsNeedingSegmentScan(int limit) {
        return activities.findActivitiesNeedingSegmentScan(PageRequest.of(0, Math.max(1, limit)));
    }

    @Override
    public long countActivitiesNeedingSegmentScan() {
        return activities.countActivitiesNeedingSegmentScan();
    }

    private SegmentEntity toEntity(Segment value) {
        return SegmentEntity.builder().id(value.getId()).name(value.getName()).activityType(value.getActivityType())
                .distanceM(value.getDistanceM()).averageGrade(value.getAverageGrade()).maximumGrade(value.getMaximumGrade())
                .elevationHighM(value.getElevationHighM()).elevationLowM(value.getElevationLowM())
                .startLatitude(value.getStartLatitude()).startLongitude(value.getStartLongitude())
                .endLatitude(value.getEndLatitude()).endLongitude(value.getEndLongitude())
                .city(value.getCity()).state(value.getState()).country(value.getCountry())
                .privateSegment(value.isPrivateSegment()).localFavorite(value.isLocalFavorite())
                .routePolyline(value.getRoutePolyline()).effortCount(value.getEffortCount())
                .bestElapsedTimeSec(value.getBestElapsedTimeSec()).latestEffortAt(value.getLatestEffortAt())
                .createdAt(value.getCreatedAt()).updatedAt(value.getUpdatedAt()).build();
    }

    private Segment toDomain(SegmentEntity value) {
        return Segment.builder().id(value.getId()).name(value.getName()).activityType(value.getActivityType())
                .distanceM(value.getDistanceM()).averageGrade(value.getAverageGrade()).maximumGrade(value.getMaximumGrade())
                .elevationHighM(value.getElevationHighM()).elevationLowM(value.getElevationLowM())
                .startLatitude(value.getStartLatitude()).startLongitude(value.getStartLongitude())
                .endLatitude(value.getEndLatitude()).endLongitude(value.getEndLongitude())
                .city(value.getCity()).state(value.getState()).country(value.getCountry())
                .privateSegment(value.isPrivateSegment()).localFavorite(value.isLocalFavorite())
                .routePolyline(value.getRoutePolyline()).effortCount(value.getEffortCount())
                .bestElapsedTimeSec(value.getBestElapsedTimeSec()).latestEffortAt(value.getLatestEffortAt())
                .createdAt(value.getCreatedAt()).updatedAt(value.getUpdatedAt()).build();
    }

    private SegmentEffortEntity toEntity(SegmentEffort value) {
        return SegmentEffortEntity.builder().id(value.getId()).externalId(value.getExternalId())
                .segmentId(value.getSegmentId()).activityId(value.getActivityId()).startedAt(value.getStartedAt())
                .sequence(value.getSequence()).startIndex(value.getStartIndex()).endIndex(value.getEndIndex())
                .elapsedTimeSec(value.getElapsedTimeSec()).movingTimeSec(value.getMovingTimeSec()).distanceM(value.getDistanceM())
                .averagePowerW(value.getAveragePowerW()).averageHeartrate(value.getAverageHeartrate())
                .maxHeartrate(value.getMaxHeartrate()).averageSpeedMs(value.getAverageSpeedMs())
                .averageCadence(value.getAverageCadence()).elevationGainM(value.getElevationGainM())
                .deviceWatts(value.getDeviceWatts()).stravaPrRank(value.getStravaPrRank())
                .recordAtTime(value.isRecordAtTime()).previousBestElapsedTimeSec(value.getPreviousBestElapsedTimeSec())
                .createdAt(value.getCreatedAt()).updatedAt(value.getUpdatedAt()).build();
    }

    private SegmentEffort toDomain(SegmentEffortEntity value) {
        return SegmentEffort.builder().id(value.getId()).externalId(value.getExternalId())
                .segmentId(value.getSegmentId()).activityId(value.getActivityId()).startedAt(value.getStartedAt())
                .sequence(value.getSequence()).startIndex(value.getStartIndex()).endIndex(value.getEndIndex())
                .elapsedTimeSec(value.getElapsedTimeSec()).movingTimeSec(value.getMovingTimeSec()).distanceM(value.getDistanceM())
                .averagePowerW(value.getAveragePowerW()).averageHeartrate(value.getAverageHeartrate())
                .maxHeartrate(value.getMaxHeartrate()).averageSpeedMs(value.getAverageSpeedMs())
                .averageCadence(value.getAverageCadence()).elevationGainM(value.getElevationGainM())
                .deviceWatts(value.getDeviceWatts()).stravaPrRank(value.getStravaPrRank())
                .recordAtTime(value.isRecordAtTime()).previousBestElapsedTimeSec(value.getPreviousBestElapsedTimeSec())
                .createdAt(value.getCreatedAt()).updatedAt(value.getUpdatedAt()).build();
    }
}
