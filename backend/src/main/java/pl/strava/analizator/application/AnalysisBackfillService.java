package pl.strava.analizator.application;

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

    private final AnalysisBackfillRepository states;
    private final SegmentRepository segments;
    private final RouteMatchRepository routes;
    private final ActivityRepository activities;
    private final AthleteProfileRepository profiles;
    private final SyncStateRepository syncStates;
    private final SyncDataSource syncDataSource;
    private final SegmentAnalysisService segmentAnalysisService;
    private final RouteMatchingService routeMatchingService;

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
        Instant now = Instant.now();
        AnalysisBackfillState started = current.toBuilder().status(remaining == 0 ? "COMPLETED" : "RUNNING")
                .processed(remaining == 0 ? total : processed).total(total)
                .capability(type.equals(SEGMENTS) ? "UNKNOWN" : "LOCAL")
                .rateLimitResetsAt(null).errorMessage(null)
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
                && syncState.getRateLimitResetsAt() != null && Instant.now().isBefore(syncState.getRateLimitResetsAt())) {
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
                activities.save(local.toBuilder().relativeEffort(fetched.getRelativeEffort()).updatedAt(Instant.now()).build());
            }
            segmentAnalysisService.importActivity(fetched, fetched.getSegmentEfforts(), fetched.getSegmentDataAvailability());
            if (!"AVAILABLE".equals(fetched.getSegmentDataAvailability())) {
                save(current.toBuilder().status("UNAVAILABLE").capability("UNAVAILABLE")
                        .processed(current.getProcessed() + 1)
                        .errorMessage("Strava did not expose segment efforts for detailed activities").completedAt(Instant.now()).build());
                return;
            }
            save(current.toBuilder().status("RUNNING").capability("AVAILABLE")
                    .processed(current.getProcessed() + 1).build());
        } catch (RateLimitException exception) {
            save(current.toBuilder().status("RATE_LIMITED").rateLimitResetsAt(exception.getResetsAt())
                    .errorMessage("Strava rate limit reached; backfill will resume automatically").build());
        } catch (Exception exception) {
            log.warn("Segment backfill failed for activity {}: {}", local.getId(), exception.getMessage());
            save(current.toBuilder().status("FAILED").errorMessage(abbreviate(exception.getMessage())).build());
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
                    .processed(Math.min(current.getTotal(), current.getProcessed() + processed)).build());
        } catch (Exception exception) {
            log.warn("Route fingerprint backfill failed: {}", exception.getMessage());
            save(current.toBuilder().status("FAILED").processed(current.getProcessed() + processed)
                    .errorMessage(abbreviate(exception.getMessage())).build());
        }
    }

    private boolean canRun(AnalysisBackfillState state) {
        if ("RUNNING".equals(state.getStatus())) return true;
        if ("RATE_LIMITED".equals(state.getStatus()) && !activeRateLimit(state)) {
            save(state.toBuilder().status("RUNNING").rateLimitResetsAt(null).build());
            return true;
        }
        return false;
    }
    private boolean activeRateLimit(AnalysisBackfillState state) {
        return "RATE_LIMITED".equals(state.getStatus()) && state.getRateLimitResetsAt() != null
                && Instant.now().isBefore(state.getRateLimitResetsAt());
    }
    private void complete(AnalysisBackfillState state, String capability) {
        save(state.toBuilder().status("COMPLETED").capability(capability).processed(state.getTotal())
                .completedAt(Instant.now()).rateLimitResetsAt(null).errorMessage(null).build());
    }
    private AnalysisBackfillState save(AnalysisBackfillState state) {
        return states.save(state.toBuilder().updatedAt(Instant.now()).build());
    }
    private AnalysisBackfillState state(String type) {
        return states.find(type).orElseGet(() -> AnalysisBackfillState.builder().jobType(type).status("IDLE")
                .capability(type.equals(ROUTES) ? "LOCAL" : "UNKNOWN").updatedAt(Instant.now()).build());
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
                .rateLimitResetsAt(state.getRateLimitResetsAt()).errorMessage(state.getErrorMessage())
                .updatedAt(state.getUpdatedAt()).build();
    }
    private String abbreviate(String message) {
        if (message == null) return "Unknown error";
        return message.length() <= 1000 ? message : message.substring(0, 1000);
    }
}
