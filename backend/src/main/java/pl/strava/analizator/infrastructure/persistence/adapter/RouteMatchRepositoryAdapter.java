package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.MatchedRoute;
import pl.strava.analizator.domain.model.RouteFingerprint;
import pl.strava.analizator.domain.model.RouteGroup;
import pl.strava.analizator.domain.port.RouteMatchRepository;
import pl.strava.analizator.infrastructure.persistence.entity.MatchedRouteEntity;
import pl.strava.analizator.infrastructure.persistence.entity.RouteFingerprintEntity;
import pl.strava.analizator.infrastructure.persistence.entity.RouteGroupEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.MatchedRouteJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.RouteFingerprintJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.RouteGroupJpaRepository;

@Component
@RequiredArgsConstructor
public class RouteMatchRepositoryAdapter implements RouteMatchRepository {
    private final RouteFingerprintJpaRepository fingerprints;
    private final RouteGroupJpaRepository groups;
    private final MatchedRouteJpaRepository matches;

    @Override public RouteFingerprint saveFingerprint(RouteFingerprint value) { return toDomain(fingerprints.save(toEntity(value))); }
    @Override public Optional<RouteFingerprint> findFingerprint(UUID id, int version) {
        return fingerprints.findById(id).filter(value -> value.getAlgorithmVersion() == version).map(this::toDomain);
    }
    @Override public List<RouteFingerprint> findExactCandidates(String exact, String reverse, int version, UUID excluded) {
        return fingerprints.findExact(exact, reverse, version, excluded).stream().map(this::toDomain).toList();
    }
    @Override public List<RouteFingerprint> findNearbyCandidates(double lat, double lng, double distance, int version, UUID excluded, int limit) {
        return fingerprints.findNearby(lat, lng, distance, distance * 0.65, distance * 1.35,
                Math.max(1000, distance * 0.35), version, excluded, limit).stream().map(this::toDomain).toList();
    }
    @Override public RouteGroup saveGroup(RouteGroup value) { return toDomain(groups.save(toEntity(value))); }
    @Override public Optional<RouteGroup> findGroup(UUID id) { return groups.findById(id).map(this::toDomain); }
    @Override public Optional<RouteGroup> findGroupByFamilyAndDirection(UUID family, String direction, int version) {
        return groups.findByFamilyIdAndDirectionKeyAndAlgorithmVersion(family, direction, version).map(this::toDomain);
    }
    @Override public MatchedRoute saveMatch(MatchedRoute value) {
        MatchedRoute merged = matches.findByActivityIdAndAlgorithmVersion(value.getActivityId(), value.getAlgorithmVersion())
                .map(existing -> value.toBuilder().id(existing.getId()).createdAt(existing.getCreatedAt()).build())
                .orElse(value);
        return toDomain(matches.save(toEntity(merged)));
    }
    @Override public Optional<MatchedRoute> findMatchByActivity(UUID id, int version) {
        return matches.findByActivityIdAndAlgorithmVersion(id, version).map(this::toDomain);
    }
    @Override public List<MatchedRoute> findMatchesByGroup(UUID id) {
        return matches.findByRouteGroupIdOrderByCreatedAtAsc(id).stream().map(this::toDomain).toList();
    }
    @Override public List<UUID> findActivityIdsNeedingFingerprint(int version, int limit) {
        return fingerprints.findMissingActivityIds(version, PageRequest.of(0, Math.max(1, limit)));
    }
    @Override public long countActivitiesNeedingFingerprint(int version) { return fingerprints.countMissing(version); }

    private RouteFingerprintEntity toEntity(RouteFingerprint v) {
        return RouteFingerprintEntity.builder().activityId(v.getActivityId()).algorithmVersion(v.getAlgorithmVersion())
                .capability(v.getCapability())
                .exactHash(v.getExactHash()).reverseHash(v.getReverseHash()).fuzzyKey(v.getFuzzyKey())
                .normalizedPolyline(v.getNormalizedPolyline()).distanceM(v.getDistanceM())
                .centerLatitude(v.getCenterLatitude()).centerLongitude(v.getCenterLongitude()).computedAt(v.getComputedAt()).build();
    }
    private RouteFingerprint toDomain(RouteFingerprintEntity v) {
        return RouteFingerprint.builder().activityId(v.getActivityId()).algorithmVersion(v.getAlgorithmVersion())
                .capability(v.getCapability())
                .exactHash(v.getExactHash()).reverseHash(v.getReverseHash()).fuzzyKey(v.getFuzzyKey())
                .normalizedPolyline(v.getNormalizedPolyline()).distanceM(v.getDistanceM())
                .centerLatitude(v.getCenterLatitude()).centerLongitude(v.getCenterLongitude()).computedAt(v.getComputedAt()).build();
    }
    private RouteGroupEntity toEntity(RouteGroup v) {
        return RouteGroupEntity.builder().id(v.getId()).familyId(v.getFamilyId()).canonicalActivityId(v.getCanonicalActivityId())
                .directionKey(v.getDirectionKey()).algorithmVersion(v.getAlgorithmVersion())
                .createdAt(v.getCreatedAt()).updatedAt(v.getUpdatedAt()).build();
    }
    private RouteGroup toDomain(RouteGroupEntity v) {
        return RouteGroup.builder().id(v.getId()).familyId(v.getFamilyId()).canonicalActivityId(v.getCanonicalActivityId())
                .directionKey(v.getDirectionKey()).algorithmVersion(v.getAlgorithmVersion())
                .createdAt(v.getCreatedAt()).updatedAt(v.getUpdatedAt()).build();
    }
    private MatchedRouteEntity toEntity(MatchedRoute v) {
        return MatchedRouteEntity.builder().id(v.getId()).routeGroupId(v.getRouteGroupId()).activityId(v.getActivityId())
                .matchedToActivityId(v.getMatchedToActivityId()).similarityPercent(v.getSimilarityPercent())
                .exactMatch(v.isExactMatch()).directionVariant(v.getDirectionVariant())
                .algorithmVersion(v.getAlgorithmVersion()).createdAt(v.getCreatedAt()).build();
    }
    private MatchedRoute toDomain(MatchedRouteEntity v) {
        return MatchedRoute.builder().id(v.getId()).routeGroupId(v.getRouteGroupId()).activityId(v.getActivityId())
                .matchedToActivityId(v.getMatchedToActivityId()).similarityPercent(v.getSimilarityPercent())
                .exactMatch(v.isExactMatch()).directionVariant(v.getDirectionVariant())
                .algorithmVersion(v.getAlgorithmVersion()).createdAt(v.getCreatedAt()).build();
    }
}
