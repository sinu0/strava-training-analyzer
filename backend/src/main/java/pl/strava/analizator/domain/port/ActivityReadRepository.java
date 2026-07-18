package pl.strava.analizator.domain.port;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.ActivityCorePage;
import pl.strava.analizator.domain.model.ActivityCoreView;

public interface ActivityReadRepository {

    ActivityCorePage findSummaries(String sportType, OffsetDateTime from, OffsetDateTime to,
                                   int page, int size);

    Optional<ActivityCoreView> findCoreById(UUID id);
}
