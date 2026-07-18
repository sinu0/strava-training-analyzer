package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.ActivityTrainingEffectEntity;

public interface ActivityTrainingEffectJpaRepository extends JpaRepository<ActivityTrainingEffectEntity, UUID> {

    Optional<ActivityTrainingEffectEntity> findByActivityId(UUID activityId);

    List<ActivityTrainingEffectEntity> findByActivityIdIn(List<UUID> activityIds);

    void deleteByActivityId(UUID activityId);
}
