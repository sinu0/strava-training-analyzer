package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import pl.strava.analizator.infrastructure.persistence.entity.ActivityTrainingEffectEntity;

public interface ActivityTrainingEffectJpaRepository extends JpaRepository<ActivityTrainingEffectEntity, UUID> {

    Optional<ActivityTrainingEffectEntity> findByActivityId(UUID activityId);

    void deleteByActivityId(UUID activityId);
}
