package pl.strava.analizator.domain.port;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.vo.ActivityFilter;
import pl.strava.analizator.domain.vo.ActivityPage;
import pl.strava.analizator.domain.vo.ActivityTimelineEntry;

public interface ActivityRepository {

    Activity save(Activity activity);

    Optional<Activity> findById(UUID id);

    Optional<Activity> findByExternalIdAndSource(String externalId, String source);

    List<Activity> findByStartedAtBetween(OffsetDateTime from, OffsetDateTime to);

    List<Activity> findBySportTypeAndStartedAtBetween(String sportType, OffsetDateTime from, OffsetDateTime to);

    List<Activity> findRecentActivities(int limit);

    List<Activity> findAll();

    List<Activity> findBySource(String source);

    List<Activity> findWithSummaryPolylines();

    boolean existsByExternalIdAndSource(String externalId, String source);

    long count();

    void deleteById(UUID id);

    void deleteAll();

    ActivityPage findPaged(String sportType, int page, int size);

    ActivityPage findFiltered(ActivityFilter filter);

    List<ActivityTimelineEntry> getTimeline();

    int countActivitiesWithPolylines();

    double sumDistanceMetersForActivitiesWithPolylines();
}
