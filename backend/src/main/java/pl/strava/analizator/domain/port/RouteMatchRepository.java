package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.MatchedRoute;
import pl.strava.analizator.domain.model.RouteFingerprint;
import pl.strava.analizator.domain.model.RouteGroup;

public interface RouteMatchRepository {

    RouteFingerprint saveFingerprint(RouteFingerprint fingerprint);
    Optional<RouteFingerprint> findFingerprint(UUID activityId, int version);
    List<RouteFingerprint> findExactCandidates(String exactHash, String reverseHash, int version, UUID excludedActivityId);
    List<RouteFingerprint> findNearbyCandidates(double latitude, double longitude, double distanceM,
                                                int version, UUID excludedActivityId, int limit);
    RouteGroup saveGroup(RouteGroup group);
    Optional<RouteGroup> findGroup(UUID id);
    Optional<RouteGroup> findGroupByFamilyAndDirection(UUID familyId, String directionKey, int version);
    MatchedRoute saveMatch(MatchedRoute match);
    Optional<MatchedRoute> findMatchByActivity(UUID activityId, int version);
    List<MatchedRoute> findMatchesByGroup(UUID groupId);
    List<UUID> findActivityIdsNeedingFingerprint(int version, int limit);
    long countActivitiesNeedingFingerprint(int version);
}
