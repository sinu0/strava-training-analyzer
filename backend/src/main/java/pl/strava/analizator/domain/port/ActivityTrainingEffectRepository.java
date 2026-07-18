package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.ActivityTrainingEffect;

public interface ActivityTrainingEffectRepository {

    Optional<ActivityTrainingEffect> findByActivityId(UUID activityId);

    Map<UUID, ActivityTrainingEffect> findByActivityIds(List<UUID> activityIds);

    void save(ActivityTrainingEffect effect);

    void deleteByActivityId(UUID activityId);
}
