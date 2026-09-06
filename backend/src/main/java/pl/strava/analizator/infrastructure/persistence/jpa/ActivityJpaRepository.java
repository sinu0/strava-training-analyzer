package pl.strava.analizator.infrastructure.persistence.jpa;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.domain.vo.ActivityTimelineEntry;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityEntity;

@Repository
public interface ActivityJpaRepository extends JpaRepository<ActivityEntity, UUID>, JpaSpecificationExecutor<ActivityEntity> {

    Optional<ActivityEntity> findByExternalIdAndSource(String externalId, String source);

    boolean existsByExternalIdAndSource(String externalId, String source);

    @Query("SELECT a FROM ActivityEntity a WHERE a.startedAt >= :from AND a.startedAt < :to ORDER BY a.startedAt DESC")
    List<ActivityEntity> findByStartedAtBetweenOrderByStartedAtDesc(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("SELECT a FROM ActivityEntity a WHERE a.sportType = :sportType AND a.startedAt >= :from AND a.startedAt < :to ORDER BY a.startedAt DESC")
    List<ActivityEntity> findBySportTypeAndStartedAtBetweenOrderByStartedAtDesc(
            @Param("sportType") String sportType, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    Page<ActivityEntity> findAllByOrderByStartedAtDesc(Pageable pageable);

    Page<ActivityEntity> findBySportTypeOrderByStartedAtDesc(String sportType, Pageable pageable);

    List<ActivityEntity> findBySourceOrderByStartedAtDesc(String source);

    List<ActivityEntity> findBySummaryPolylineIsNotNullOrderByStartedAtDesc();

    long countBySummaryPolylineIsNotNull();

    @Query("SELECT COALESCE(SUM(a.distanceM), 0.0) FROM ActivityEntity a WHERE a.summaryPolyline IS NOT NULL")
    java.util.Optional<Double> sumDistanceMForActivitiesWithPolylines();

    @Query("SELECT NEW pl.strava.analizator.domain.vo.ActivityTimelineEntry(YEAR(a.startedAt), MONTH(a.startedAt), COUNT(a)) FROM ActivityEntity a GROUP BY YEAR(a.startedAt), MONTH(a.startedAt) ORDER BY YEAR(a.startedAt) DESC, MONTH(a.startedAt) DESC")
    List<ActivityTimelineEntry> findTimeline();

    @Query("SELECT MAX(a.startedAt) FROM ActivityEntity a WHERE a.source = :source")
    Optional<OffsetDateTime> findLatestStartedAtBySource(String source);

    @Query(value = """
            SELECT a.id AS id, a.externalId AS externalId, a.source AS source,
                   a.sportType AS sportType, a.name AS name, a.description AS description,
                   a.startedAt AS startedAt, a.elapsedTimeSec AS elapsedTimeSec,
                   a.movingTimeSec AS movingTimeSec, a.distanceM AS distanceM,
                   a.elevationGainM AS elevationGainM, a.elevationLossM AS elevationLossM,
                   a.avgSpeedMs AS avgSpeedMs, a.maxSpeedMs AS maxSpeedMs,
                   a.avgHeartrate AS avgHeartrate, a.maxHeartrate AS maxHeartrate,
                   a.avgPowerW AS avgPowerW, a.deviceWatts AS deviceWatts, a.maxPowerW AS maxPowerW,
                   a.avgCadence AS avgCadence, a.maxCadence AS maxCadence,
                   a.calories AS calories, a.avgTempC AS avgTempC,
                   a.summaryPolyline AS summaryPolyline, a.createdAt AS createdAt,
                   a.updatedAt AS updatedAt
            FROM ActivityEntity a
            WHERE (:sportType IS NULL OR a.sportType = :sportType)
              AND (:searchQuery IS NULL
                   OR LOWER(COALESCE(a.name, '')) LIKE CONCAT('%', :searchQuery, '%')
                   OR LOWER(COALESCE(a.description, '')) LIKE CONCAT('%', :searchQuery, '%')
                   OR LOWER(COALESCE(a.sportType, '')) LIKE CONCAT('%', :searchQuery, '%'))
              AND a.startedAt >= :fromDate
              AND a.startedAt <= :toDate
            ORDER BY a.startedAt DESC
            """,
            countQuery = """
            SELECT COUNT(a) FROM ActivityEntity a
            WHERE (:sportType IS NULL OR a.sportType = :sportType)
              AND (:searchQuery IS NULL
                   OR LOWER(COALESCE(a.name, '')) LIKE CONCAT('%', :searchQuery, '%')
                   OR LOWER(COALESCE(a.description, '')) LIKE CONCAT('%', :searchQuery, '%')
                   OR LOWER(COALESCE(a.sportType, '')) LIKE CONCAT('%', :searchQuery, '%'))
              AND a.startedAt >= :fromDate
              AND a.startedAt <= :toDate
            """)
    Page<ActivityCoreProjection> findV2Summaries(
            @Param("sportType") String sportType,
            @Param("searchQuery") String searchQuery,
            @Param("fromDate") OffsetDateTime from,
            @Param("toDate") OffsetDateTime to,
            Pageable pageable);

    @Query("""
            SELECT a.id AS id, a.externalId AS externalId, a.source AS source,
                   a.sportType AS sportType, a.name AS name, a.description AS description,
                   a.startedAt AS startedAt, a.elapsedTimeSec AS elapsedTimeSec,
                   a.movingTimeSec AS movingTimeSec, a.distanceM AS distanceM,
                   a.elevationGainM AS elevationGainM, a.elevationLossM AS elevationLossM,
                   a.avgSpeedMs AS avgSpeedMs, a.maxSpeedMs AS maxSpeedMs,
                   a.avgHeartrate AS avgHeartrate, a.maxHeartrate AS maxHeartrate,
                   a.avgPowerW AS avgPowerW, a.deviceWatts AS deviceWatts, a.maxPowerW AS maxPowerW,
                   a.avgCadence AS avgCadence, a.maxCadence AS maxCadence,
                   a.calories AS calories, a.avgTempC AS avgTempC,
                   a.summaryPolyline AS summaryPolyline, a.createdAt AS createdAt,
                   a.updatedAt AS updatedAt
            FROM ActivityEntity a WHERE a.id = :id
            """)
    Optional<ActivityCoreProjection> findV2CoreById(@Param("id") UUID id);

    @Query(value = """
            SELECT a.id FROM activities a
            WHERE a.source = 'strava'
              AND NOT EXISTS (SELECT 1 FROM segment_activity_imports sai WHERE sai.activity_id = a.id)
            ORDER BY a.started_at DESC
            """, nativeQuery = true)
    List<UUID> findActivitiesNeedingSegmentScan(Pageable pageable);

    @Query(value = """
            SELECT COUNT(*) FROM activities a
            WHERE a.source = 'strava'
              AND NOT EXISTS (SELECT 1 FROM segment_activity_imports sai WHERE sai.activity_id = a.id)
            """, nativeQuery = true)
    long countActivitiesNeedingSegmentScan();

    @Query(value = """
            SELECT se.activity_id AS activityId,
                   COUNT(*)::integer AS segmentCount,
                   COUNT(*) FILTER (WHERE se.record_at_time)::integer AS newRecordCount
            FROM segment_efforts se
            WHERE se.activity_id IN (:activityIds)
            GROUP BY se.activity_id
            """, nativeQuery = true)
    List<ActivitySegmentStatsProjection> summarizeSegments(@Param("activityIds") List<UUID> activityIds);

    @Query("SELECT a.id, a.name FROM ActivityEntity a WHERE a.id IN :ids")
    List<Object[]> findNamesByIds(@Param("ids") List<UUID> ids);
}
