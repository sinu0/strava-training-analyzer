package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.ActivityDataQuality;

public interface ActivityDataQualityRepository {
    ActivityDataQuality save(ActivityDataQuality quality);
    Optional<ActivityDataQuality> findByActivityId(UUID activityId);
    List<ActivityDataQuality> findAll();
}
