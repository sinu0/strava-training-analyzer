package pl.strava.analizator.domain.port;

import java.time.OffsetDateTime;
import java.util.List;

import pl.strava.analizator.domain.model.Activity;

/**
 * Abstraction over external activity data sources (Strava, Garmin, etc.).
 */
public interface ActivityDataSource {

    String sourceName();

    List<Activity> fetchActivities(OffsetDateTime after, int perPage);

    Activity fetchActivityDetail(String externalId);

    int[] fetchPowerStream(String externalId);

    int[] fetchHeartrateStream(String externalId);
}
