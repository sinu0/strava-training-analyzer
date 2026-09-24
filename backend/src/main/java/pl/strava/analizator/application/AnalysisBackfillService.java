package pl.strava.analizator.application;

import java.io.InterruptedIOException;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.net.http.HttpTimeoutException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.BackfillStatusDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AnalysisBackfillState;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.SyncState;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AnalysisBackfillRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.RouteMatchRepository;
import pl.strava.analizator.domain.port.SegmentRepository;
import pl.strava.analizator.domain.port.SyncStateRepository;

@Service
@RequiredArgsConstructor
public class AnalysisBackfillService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisBackfillService.class);
    private static final String SEGMENTS = "SEGMENTS";
    private static final String ROUTES = "ROUTES";
    private static final String RETRYING = "RETRYING";
    static final int MAX_ATTEMPTS = 8;
    private static final Duration FIRST_RETRY_DELAY = Duration.ofMinutes(1);
    private static final Duration MAX_RETRY_DELAY = Duration.ofMinutes(30);

    private final AnalysisBackfillRepository states;
    private final SegmentRepository segments;
    private final RouteMatchRepository routes;
    private final ActivityRepository activities;
    private final AthleteProfileRepository profiles;
    private final SyncStateRepository syncStates;
    private final SyncDataSource syncDataSource;
    private final SegmentAnalysisService segmentAnalysisService;
    private final RouteMatchingService routeMatchingService;
    private final Clock clock;

    public BackfillStatusDto start(String requestedType) {
        String type = normalizeType(requestedType);
        AnalysisBackfillState current = state(type);
        if ("RUNNING".equals(current.getStatus()) || activeRateLimit(current)) return toDto(current);
        int remaining = Math.toIntExact(type.equals(SEGMENTS)
                ? segments.countActivitiesNeedingSegmentScan()
                : routes.countActivitiesNeedingFingerprint(RouteMatchingAlgorithm.VERSION));
        boolean resuming = !"IDLE".equals(current.getStatus()) && !"COMPLETED".equals(current.getStatus())
                && current.getProcessed() > 0;
        int processed = resuming ? current.getProcessed() : 0;
        int total = resuming ? Math.max(current.getTotal(), processed + remaining) : remaining;
        Instant now = clock.instant();
        AnalysisBackfillState started = current.toBuilder().status(remaining == 0 ? "COMPLETED" : "RUNNING")
                .processed(remaining == 0 ? total : processed).total(total)
                .capability(type.equals(SEGMENTS) ? "UNKNOWN" : "LOCAL")
                .rateLimitResetsAt(null).retryAt(null).attemptCount(0).errorMessage(null)
                .startedAt(resuming && current.getStartedAt() != null ? current.getStartedAt() : now).updatedAt(now)
                .completedAt(remaining == 0 ? now : null).build();
        return toDto(states.save(started));
    }

    public BackfillStatusDto status(String requestedType) {
        return toDto(state(normalizeType(requestedType)));
    }

    @Scheduled(fixedDelayString = "${analysis.backfill.tick-ms:3000}")
    public void processNextBatch() {
        processSegments();
        processRoutes();
    }

    void processSegments() {
        AnalysisBackfillState current = state(SEGMENTS);
        if (!canRun(current)) return;
        SyncState syncState = syncStates.findFirst().orElse(null);
        if (syncState != null && "rate_limited".equals(syncState.getStatus())
                && syncState.getRateLimitResetsAt() != null && clock.instant().isBefore(syncState.getRateLimitResetsAt())) {
            save(current.toBuilder().status("RATE_LIMITED").rateLimitResetsAt(syncState.getRateLimitResetsAt()).build());
            return;
        }
        List<UUID> ids = segments.findActivityIdsNeedingSegmentScan(1);
        if (ids.isEmpty()) { complete(current, "AVAILABLE"); return; }
        Activity local = activities.findById(ids.getFirst()).orElse(null);
        if (local == null || local.getExternalId() == null) {
            save(current.toBuilder().processed(current.getProcessed() + 1).build());
            return;
        }
        try {
            AthleteProfile profile = profiles.findFirst()
                    .orElseThrow(() -> new ProfileNotFoundException("No athlete profile found"));
            Activity fetched = syncDataSource.fetchActivityForSegmentBackfill(profile, local.getExternalId())
                    .toBuilder().id(local.getId()).createdAt(local.getCreatedAt()).updatedAt(local.getUpdatedAt()).build();
            if (fetched.getRelativeEffort() != null && !fetched.getRelativeEffort().equals(local.getRelativeEffort())) {
                activities.save(local.toBuilder().relativeEffort(fetched.getRelativeEffort()).updatedAt(clock.instant()).build());
            }
            segmentAnalysisService.importActivity(fetched, fetched.getSegmentEfforts(), fetched.getSegmentDataAvailability());
            if (!"AVAILABLE".equals(fetched.getSegmentDataAvailability())) {
                save(current.toBuilder().status("UNAVAILABLE").capability("UNAVAILABLE")
                        .processed(current.getProcessed() + 1)
                        .errorMessage("Strava did not expose segment efforts for detailed activities").completedAt(clock.instant()).build());
                return;
            }
            save(current.toBuilder().status("RUNNING").capability("AVAILABLE")
                    .processed(current.getProcessed() + 1).retryAt(null).attemptCount(0).errorMessage(null).build());
        } catch (RateLimitException exception) {
            save(current.toBuilder().status("RATE_LIMITED").rateLimitResetsAt(exception.getResetsAt())
                    .errorMessage("Strava rate limit reached; backfill will resume automatically").build());
        } catch (Exception exception) {
            log.warn("Segment backfill failed for activity {}: {}", local.getId(), exception.getMessage());
            save(failure(current, exception, current.getProcessed()));
        }
    }

    void processRoutes() {
        AnalysisBackfillState current = state(ROUTES);
        if (!canRun(current)) return;
        List<UUID> ids = routes.findActivityIdsNeedingFingerprint(RouteMatchingAlgorithm.VERSION, 20);
        if (ids.isEmpty()) { complete(current, "LOCAL"); return; }
        int processed = 0;
        try {
            for (Activity activity : activities.findByIds(ids)) {
                routeMatchingService.matchActivity(activity);
                processed++;
            }
            save(current.toBuilder().status("RUNNING")
                    .processed(Math.min(current.getTotal(), current.getProcessed() + processed))
                    .retryAt(null).attemptCount(0).errorMessage(null).build());
        } catch (Exception exception) {
            log.warn("Route fingerprint backfill failed: {}", exception.getMessage());
            save(failure(current, exception, current.getProcessed() + processed));
        }
    }

    private boolean canRun(AnalysisBackfillState state) {
        if ("RUNNING".equals(state.getStatus())) return true;
        if (RETRYING.equals(state.getStatus())) {
            return state.getRetryAt() == null || !clock.instant().isBefore(state.getRetryAt());
        }
        if ("RATE_LIMITED".equals(state.getStatus()) && !activeRateLimit(state)) {
            save(state.toBuilder().status("RUNNING").rateLimitResetsAt(null).build());
            return true;
        }
        return false;
    }
    private boolean activeRateLimit(AnalysisBackfillState state) {
        return "RATE_LIMITED".equals(state.getStatus()) && state.getRateLimitResetsAt() != null
                && clock.instant().isBefore(state.getRateLimitResetsAt());
    }
    /** Transient failures are retried with exponential backoff; anything else, or exhausted retries, fails. */
    private AnalysisBackfillState failure(AnalysisBackfillState current, Exception exception, int processed) {
        String message = abbreviate(exception.getMessage());
        int attempt = current.getAttemptCount() + 1;
        if (!isTransient(exception) || attempt >= MAX_ATTEMPTS) {
            return current.toBuilder().status("FAILED").processed(processed).retryAt(null).attemptCount(attempt)
                    .errorMessage(message).build();
        }
        return current.toBuilder().status(RETRYING).processed(processed).attemptCount(attempt)
                .retryAt(clock.instant().plus(retryDelay(attempt))).errorMessage(message).build();
    }

    static Duration retryDelay(int attempt) {
        Duration delay = FIRST_RETRY_DELAY.multipliedBy(1L << Math.min(attempt - 1, 10));
        return delay.compareTo(MAX_RETRY_DELAY) > 0 ? MAX_RETRY_DELAY : delay;
    }

    static boolean isTransient(Throwable failure) {
        for (Throwable current = failure; current != null; current = current.getCause()) {
            if (current instanceof TransientSourceException || current instanceof SocketException
                    || current instanceof UnknownHostException || current instanceof InterruptedIOException
                    || current instanceof HttpTimeoutException) {
                return true;
            }
            if (current.getCause() == current) break;
        }
        return false;
    }

    private void complete(AnalysisBackfillState state, String capability) {
        save(state.toBuilder().status("COMPLETED").capability(capability).processed(state.getTotal())
                .completedAt(clock.instant()).rateLimitResetsAt(null).retryAt(null).attemptCount(0).errorMessage(null).build());
    }
    private AnalysisBackfillState save(AnalysisBackfillState state) {
        return states.save(state.toBuilder().updatedAt(clock.instant()).build());
    }
    private AnalysisBackfillState state(String type) {
        return states.find(type).orElseGet(() -> AnalysisBackfillState.builder().jobType(type).status("IDLE")
                .capability(type.equals(ROUTES) ? "LOCAL" : "UNKNOWN").updatedAt(clock.instant()).build());
    }
    private String normalizeType(String type) {
        String normalized = type == null ? "" : type.trim().toUpperCase();
        if (!SEGMENTS.equals(normalized) && !ROUTES.equals(normalized))
            throw new IllegalArgumentException("Backfill type must be segments or routes");
        return normalized;
    }
    private BackfillStatusDto toDto(AnalysisBackfillState state) {
        return BackfillStatusDto.builder().jobType(state.getJobType()).status(state.getStatus())
                .processed(state.getProcessed()).total(state.getTotal()).capability(state.getCapability())
                .rateLimitResetsAt(state.getRateLimitResetsAt()).retryAt(state.getRetryAt()).attemptCount(state.getAttemptCount())
                .errorMessage(state.getErrorMessage())
                .updatedAt(state.getUpdatedAt()).build();
    }
    private String abbreviate(String message) {
        if (message == null) return "Unknown error";
        return message.length() <= 1000 ? message : message.substring(0, 1000);
    }
}
