package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.UUID;

public interface ActivitySegmentStatsProjection {
    UUID getActivityId();
    int getSegmentCount();
    int getNewRecordCount();
}
