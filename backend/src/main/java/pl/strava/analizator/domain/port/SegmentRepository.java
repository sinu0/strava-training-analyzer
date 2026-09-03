package pl.strava.analizator.domain.port;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.ActivitySegmentStats;
import pl.strava.analizator.domain.model.Segment;
import pl.strava.analizator.domain.model.SegmentEffort;
import pl.strava.analizator.domain.model.SegmentPage;

public interface SegmentRepository {

    Segment saveSegment(Segment segment);
    Optional<Segment> findSegment(long id);
    SegmentPage findSegments(String query, Boolean favorite, BigDecimal minDistanceM, BigDecimal maxDistanceM,
                             BigDecimal minAverageGrade, String sort, int page, int size);
    SegmentEffort saveEffort(SegmentEffort effort);
    List<SegmentEffort> findEffortsBySegment(long segmentId);
    List<SegmentEffort> findEffortsBySegments(List<Long> segmentIds);
    List<SegmentEffort> findEffortsByActivity(UUID activityId);
    Map<UUID, ActivitySegmentStats> summarizeActivities(List<UUID> activityIds);
    void markActivityScanned(UUID activityId, String capability, int effortCount);
    boolean isActivityScanned(UUID activityId);
    Optional<String> findActivityScanCapability(UUID activityId);
    List<UUID> findActivityIdsNeedingSegmentScan(int limit);
    long countActivitiesNeedingSegmentScan();
}
