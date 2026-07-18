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

    List<ActivityEntity> findByStartedAtBetweenOrderByStartedAtDesc(OffsetDateTime from, OffsetDateTime to);

    List<ActivityEntity> findBySportTypeAndStartedAtBetweenOrderByStartedAtDesc(
            String sportType, OffsetDateTime from, OffsetDateTime to);

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
                   a.avgPowerW AS avgPowerW, a.maxPowerW AS maxPowerW,
                   a.avgCadence AS avgCadence, a.maxCadence AS maxCadence,
                   a.calories AS calories, a.avgTempC AS avgTempC,
                   a.summaryPolyline AS summaryPolyline, a.createdAt AS createdAt,
                   a.updatedAt AS updatedAt
            FROM ActivityEntity a
            WHERE (:sportType IS NULL OR a.sportType = :sportType)
              AND a.startedAt >= :fromDate
              AND a.startedAt <= :toDate
            ORDER BY a.startedAt DESC
            """,
            countQuery = """
            SELECT COUNT(a) FROM ActivityEntity a
            WHERE (:sportType IS NULL OR a.sportType = :sportType)
              AND a.startedAt >= :fromDate
              AND a.startedAt <= :toDate
            """)
    Page<ActivityCoreProjection> findV2Summaries(
            @Param("sportType") String sportType,
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
                   a.avgPowerW AS avgPowerW, a.maxPowerW AS maxPowerW,
                   a.avgCadence AS avgCadence, a.maxCadence AS maxCadence,
                   a.calories AS calories, a.avgTempC AS avgTempC,
                   a.summaryPolyline AS summaryPolyline, a.createdAt AS createdAt,
                   a.updatedAt AS updatedAt
            FROM ActivityEntity a WHERE a.id = :id
            """)
    Optional<ActivityCoreProjection> findV2CoreById(@Param("id") UUID id);
}
