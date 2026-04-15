package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import pl.strava.analizator.infrastructure.persistence.entity.ActivityMetricEntity;

@Repository
public interface ActivityMetricJpaRepository extends JpaRepository<ActivityMetricEntity, UUID> {

    List<ActivityMetricEntity> findByActivityId(UUID activityId);

    Optional<ActivityMetricEntity> findByActivityIdAndMetricName(UUID activityId, String metricName);

    @Query("SELECT e FROM ActivityMetricEntity e WHERE e.activityId IN :activityIds AND e.metricName = :metricName")
    List<ActivityMetricEntity> findByActivityIdInAndMetricName(
            @Param("activityIds") List<UUID> activityIds,
            @Param("metricName") String metricName);

    void deleteByActivityIdAndMetricName(UUID activityId, String metricName);
}
