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
}
