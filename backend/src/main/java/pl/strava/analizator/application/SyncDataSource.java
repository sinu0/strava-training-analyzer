package pl.strava.analizator.application;

import java.util.List;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Application-level abstraction for sync data source.
 * Implemented by infrastructure adapters (e.g., StravaSyncAdapter).
 */
public interface SyncDataSource {

    List<Activity> fetchActivitiesPage(AthleteProfile profile, int page, Long afterEpoch);

    Activity fetchActivityWithStreams(AthleteProfile profile, String externalId);

    List<String> fetchActivityPhotoUrls(AthleteProfile profile, String externalId);

    int countNewActivities(AthleteProfile profile, long afterEpoch);
}
