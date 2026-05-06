package pl.strava.analizator.domain.port;

import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.ActivityTrainingEffect;

public interface ActivityTrainingEffectRepository {

    Optional<ActivityTrainingEffect> findByActivityId(UUID activityId);

    void save(ActivityTrainingEffect effect);

    void deleteByActivityId(UUID activityId);
}
