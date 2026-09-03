package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.MatchedRidePointDto;
import pl.strava.analizator.application.dto.MatchedRideSummaryDto;
import pl.strava.analizator.application.dto.RouteGroupDetailDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.MatchedRoute;
import pl.strava.analizator.domain.model.RouteFingerprint;
import pl.strava.analizator.domain.model.RouteGroup;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.RouteMatchRepository;

@Service
@RequiredArgsConstructor
public class RouteMatchingService {

    private static final double GROUP_THRESHOLD_PERCENT = 82;
    private static final int CANDIDATE_LIMIT = 40;

    private final RouteMatchRepository repository;
    private final ActivityRepository activityRepository;
    private final RouteMatchingAlgorithm algorithm;

    @Transactional
    public Optional<MatchedRoute> matchActivity(Activity activity) {
        if (activity == null || activity.getId() == null || activity.getSummaryPolyline() == null) return Optional.empty();
        Optional<MatchedRoute> existing = repository.findMatchByActivity(activity.getId(), RouteMatchingAlgorithm.VERSION);
        if (existing.isPresent()) return existing;

        RouteFingerprint fingerprint = repository.findFingerprint(activity.getId(), RouteMatchingAlgorithm.VERSION)
                .orElseGet(() -> createFingerprint(activity));
        if (!"AVAILABLE".equals(fingerprint.getCapability())) return Optional.empty();

        List<RouteFingerprint> exact = repository.findExactCandidates(fingerprint.getExactHash(), fingerprint.getReverseHash(),
                RouteMatchingAlgorithm.VERSION, activity.getId());
        List<RouteFingerprint> candidates = exact.isEmpty()
                ? repository.findNearbyCandidates(fingerprint.getCenterLatitude(), fingerprint.getCenterLongitude(),
                        fingerprint.getDistanceM(), RouteMatchingAlgorithm.VERSION, activity.getId(), CANDIDATE_LIMIT)
                : exact;
        Candidate best = candidates.stream().map(candidate -> compare(fingerprint, candidate))
                .max(Comparator.comparingDouble(value -> value.comparison().similarityPercent())).orElse(null);

        RouteGroup group;
        UUID matchedTo = null;
        BigDecimal similarity = BigDecimal.valueOf(100).setScale(2);
        boolean exactMatch = false;
        String direction = "SAME";
        if (best != null && best.comparison().similarityPercent() >= GROUP_THRESHOLD_PERCENT) {
            matchedTo = best.fingerprint().getActivityId();
            similarity = BigDecimal.valueOf(best.comparison().similarityPercent()).setScale(2, RoundingMode.HALF_UP);
            exactMatch = fingerprint.getExactHash().equals(best.fingerprint().getExactHash())
                    || fingerprint.getExactHash().equals(best.fingerprint().getReverseHash());
            direction = best.comparison().direction();
            MatchedRoute candidateMatch = repository.findMatchByActivity(matchedTo, RouteMatchingAlgorithm.VERSION)
                    .orElseThrow(() -> new IllegalStateException("Matched route candidate has no group"));
            RouteGroup candidateGroup = repository.findGroup(candidateMatch.getRouteGroupId())
                    .orElseThrow(() -> new IllegalStateException("Route group not found"));
            if ("SAME".equals(direction)) {
                group = candidateGroup;
            } else {
                group = repository.findGroupByFamilyAndDirection(candidateGroup.getFamilyId(), fingerprint.getExactHash(),
                                RouteMatchingAlgorithm.VERSION)
                        .orElseGet(() -> createGroup(activity.getId(), candidateGroup.getFamilyId(), fingerprint.getExactHash()));
            }
        } else {
            group = createGroup(activity.getId(), UUID.randomUUID(), fingerprint.getExactHash());
        }
        return Optional.of(repository.saveMatch(MatchedRoute.builder().routeGroupId(group.getId())
                .activityId(activity.getId()).matchedToActivityId(matchedTo).similarityPercent(similarity)
                .exactMatch(exactMatch).directionVariant(direction).algorithmVersion(RouteMatchingAlgorithm.VERSION)
                .createdAt(Instant.now()).build()));
    }

    private RouteFingerprint createFingerprint(Activity activity) {
        RouteMatchingAlgorithm.Draft draft = algorithm.fingerprint(
                PolylineCodec.decodeToLatLng(activity.getSummaryPolyline()));
        if (draft == null) {
            return repository.saveFingerprint(RouteFingerprint.builder().activityId(activity.getId())
                    .algorithmVersion(RouteMatchingAlgorithm.VERSION).capability("UNAVAILABLE")
                    .computedAt(Instant.now()).build());
        }
        return repository.saveFingerprint(RouteFingerprint.builder()
                .activityId(activity.getId()).algorithmVersion(RouteMatchingAlgorithm.VERSION).capability("AVAILABLE")
                .exactHash(draft.exactHash()).reverseHash(draft.reverseHash()).fuzzyKey(draft.fuzzyKey())
                .normalizedPolyline(draft.normalizedPolyline()).distanceM(draft.distanceM())
                .centerLatitude(draft.centerLatitude()).centerLongitude(draft.centerLongitude())
                .computedAt(Instant.now()).build());
    }

    public Optional<MatchedRideSummaryDto> findForActivity(UUID activityId) {
        MatchedRoute current = repository.findMatchByActivity(activityId, RouteMatchingAlgorithm.VERSION).orElse(null);
        if (current == null) return Optional.empty();
        RouteGroup group = repository.findGroup(current.getRouteGroupId()).orElse(null);
        if (group == null) return Optional.empty();
        List<MatchedRoute> matches = repository.findMatchesByGroup(group.getId());
        List<MatchedRidePointDto> rides = ridePoints(matches);
        return Optional.of(summary(group, current, rides));
    }

    public RouteGroupDetailDto findGroup(UUID groupId) {
        RouteGroup group = repository.findGroup(groupId)
                .orElseThrow(() -> new ActivityNotFoundException("Matched route group not found: " + groupId));
        List<MatchedRidePointDto> rides = ridePoints(repository.findMatchesByGroup(groupId));
        var speeds = rides.stream().map(MatchedRidePointDto::getAverageSpeedKmh).filter(java.util.Objects::nonNull).toList();
        return RouteGroupDetailDto.builder().routeGroupId(groupId).routeFamilyId(group.getFamilyId())
                .algorithmVersion(group.getAlgorithmVersion()).directionKey(group.getDirectionKey()).rideCount(rides.size())
                .bestSpeedKmh(speeds.stream().max(Double::compareTo).orElse(null))
                .averageSpeedKmh(speeds.isEmpty() ? null : speeds.stream().mapToDouble(Double::doubleValue).average().orElse(0))
                .slowestSpeedKmh(speeds.stream().min(Double::compareTo).orElse(null)).rides(rides).build();
    }

    private Candidate compare(RouteFingerprint current, RouteFingerprint candidate) {
        return new Candidate(candidate, algorithm.compare(
                PolylineCodec.decodeToLatLng(current.getNormalizedPolyline()),
                PolylineCodec.decodeToLatLng(candidate.getNormalizedPolyline())));
    }

    private RouteGroup createGroup(UUID activityId, UUID familyId, String directionKey) {
        Instant now = Instant.now();
        return repository.saveGroup(RouteGroup.builder().familyId(familyId).canonicalActivityId(activityId)
                .directionKey(directionKey).algorithmVersion(RouteMatchingAlgorithm.VERSION)
                .createdAt(now).updatedAt(now).build());
    }

    private List<MatchedRidePointDto> ridePoints(List<MatchedRoute> matches) {
        Map<UUID, MatchedRoute> matchByActivity = new LinkedHashMap<>();
        matches.forEach(match -> matchByActivity.put(match.getActivityId(), match));
        List<Activity> activities = activityRepository.findByIds(new ArrayList<>(matchByActivity.keySet())).stream()
                .sorted(Comparator.comparing(Activity::getStartedAt)).toList();
        List<Double> speeds = activities.stream().map(this::speedKmh).toList();
        List<MatchedRidePointDto> result = new ArrayList<>();
        for (int i = 0; i < activities.size(); i++) {
            Activity activity = activities.get(i);
            Double speed = speeds.get(i);
            result.add(MatchedRidePointDto.builder().activityId(activity.getId()).activityName(activity.getName())
                    .startedAt(activity.getStartedAt()).averageSpeedKmh(speed).movingTimeSec(activity.getMovingTimeSec())
                    .averagePowerW(activity.getAvgPowerW()).averageHeartrate(activity.getAvgHeartrate())
                    .relativeEffort(activity.getRelativeEffort())
                    .similarityPercent(matchByActivity.get(activity.getId()).getSimilarityPercent().doubleValue())
                    .smoothedSpeedKmh(smoothed(speeds, i)).build());
        }
        return result;
    }

    private MatchedRideSummaryDto summary(RouteGroup group, MatchedRoute current, List<MatchedRidePointDto> rides) {
        MatchedRidePointDto currentRide = rides.stream().filter(ride -> ride.getActivityId().equals(current.getActivityId()))
                .findFirst().orElse(null);
        if (currentRide == null) return MatchedRideSummaryDto.builder().routeGroupId(group.getId())
                .routeFamilyId(group.getFamilyId()).rideCount(rides.size()).trend(rides).build();
        int index = rides.indexOf(currentRide);
        Double speed = currentRide.getAverageSpeedKmh();
        Double previous = index > 0 ? rides.get(index - 1).getAverageSpeedKmh() : null;
        List<Double> allSpeeds = rides.stream().map(MatchedRidePointDto::getAverageSpeedKmh).filter(java.util.Objects::nonNull).toList();
        List<Double> priorSpeeds = rides.subList(0, index).stream().map(MatchedRidePointDto::getAverageSpeedKmh)
                .filter(java.util.Objects::nonNull).toList();
        Double average = allSpeeds.isEmpty() ? null : allSpeeds.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        Double record = allSpeeds.stream().max(Double::compareTo).orElse(null);
        Double previousBest = priorSpeeds.stream().max(Double::compareTo).orElse(null);
        boolean newRecord = speed != null && (previousBest == null || speed > previousBest);
        int rank = speed == null ? 0 : 1 + (int) allSpeeds.stream().filter(value -> value > speed).count();
        return MatchedRideSummaryDto.builder().routeGroupId(group.getId()).routeFamilyId(group.getFamilyId())
                .rideCount(rides.size()).currentRank(rank).similarityPercent(current.getSimilarityPercent().doubleValue())
                .currentSpeedKmh(speed).changeFromPreviousKmh(delta(speed, previous)).changeFromAverageKmh(delta(speed, average))
                .changeFromRecordKmh(delta(speed, record)).changeFromPreviousBestKmh(delta(speed, previousBest))
                .newRecord(newRecord).directionVariant(current.getDirectionVariant()).trend(rides).build();
    }

    private Double speedKmh(Activity activity) {
        if (activity.getAvgSpeedMs() != null) return activity.getAvgSpeedMs().doubleValue() * 3.6;
        if (activity.getDistanceM() == null || activity.getMovingTimeSec() == null || activity.getMovingTimeSec() <= 0) return null;
        return activity.getDistanceM().doubleValue() / activity.getMovingTimeSec() * 3.6;
    }
    private Double smoothed(List<Double> values, int index) {
        int start = Math.max(0, index - 2);
        List<Double> window = values.subList(start, index + 1).stream().filter(java.util.Objects::nonNull).toList();
        return window.isEmpty() ? null : window.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }
    private Double delta(Double first, Double second) { return first != null && second != null ? first - second : null; }
    private record Candidate(RouteFingerprint fingerprint, RouteMatchingAlgorithm.Comparison comparison) {}
}
