package pl.strava.analizator.application;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.AiActivityNoteService;
import pl.strava.analizator.domain.metrics.LapMetricsService;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityTrainingEffect;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.model.SyncState;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.ActivityTrainingEffectRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.port.SyncStateRepository;
import pl.strava.analizator.domain.vo.Lap;

@Service
public class SyncService {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);
    private static final int PER_PAGE = 200;

    private final AthleteProfileRepository profileRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository activityMetricRepository;
    private final DailyMetricRepository dailyMetricRepository;
    private final MetricRegistry metricRegistry;
    private final MetricPersistenceService metricPersistenceService;
    private final DailyMetricsService dailyMetricsService;
    private final SyncDataSource syncDataSource;
    private final SyncStateRepository syncStateRepository;
    private final AiActivityNoteService aiActivityNoteService;
    private final HeatmapBuildService heatmapBuildService;
    private final LapMetricsService lapMetricsService;
    private final WorkoutEvaluationService workoutEvaluationService;
    private final ActivityTrainingEffectRepository trainingEffectRepository;
    private final DailySummaryRepository dailySummaryRepository;
    private final AutoSyncConfigPort autoSyncConfigPort;
    private final PersonalRecordService personalRecordService;
    private final ChallengeService challengeService;

    public SyncService(AthleteProfileRepository profileRepository,
                       ActivityRepository activityRepository,
                       ActivityMetricRepository activityMetricRepository,
                       DailyMetricRepository dailyMetricRepository,
                       MetricRegistry metricRegistry,
                       MetricPersistenceService metricPersistenceService,
                       DailyMetricsService dailyMetricsService,
                       SyncDataSource syncDataSource,
                       SyncStateRepository syncStateRepository,
                       @org.springframework.lang.Nullable AiActivityNoteService aiActivityNoteService,
                       HeatmapBuildService heatmapBuildService,
                       LapMetricsService lapMetricsService,
                       WorkoutEvaluationService workoutEvaluationService,
                       ActivityTrainingEffectRepository trainingEffectRepository,
                       DailySummaryRepository dailySummaryRepository,
                       AutoSyncConfigPort autoSyncConfigPort,
                       PersonalRecordService personalRecordService,
                       ChallengeService challengeService) {
        this.profileRepository = profileRepository;
        this.activityRepository = activityRepository;
        this.activityMetricRepository = activityMetricRepository;
        this.dailyMetricRepository = dailyMetricRepository;
        this.metricRegistry = metricRegistry;
        this.metricPersistenceService = metricPersistenceService;
        this.dailyMetricsService = dailyMetricsService;
        this.syncDataSource = syncDataSource;
        this.syncStateRepository = syncStateRepository;
        this.aiActivityNoteService = aiActivityNoteService;
        this.heatmapBuildService = heatmapBuildService;
        this.lapMetricsService = lapMetricsService;
        this.workoutEvaluationService = workoutEvaluationService;
        this.trainingEffectRepository = trainingEffectRepository;
        this.dailySummaryRepository = dailySummaryRepository;
        this.autoSyncConfigPort = autoSyncConfigPort;
        this.personalRecordService = personalRecordService;
        this.challengeService = challengeService;
    }

    @Getter
    private volatile SyncStatus lastSyncStatus = new SyncStatus("idle", null, 0, 0, null);

    @PostConstruct
    public void loadSyncStateFromDb() {
        syncStateRepository.findFirst().ifPresent(state -> {
            lastSyncStatus = new SyncStatus(
                    state.getStatus(),
                    state.getLastSyncAt(),
                    state.getImportedTotal(),
                    state.getSkippedTotal(),
                    state.getRateLimitResetsAt()
            );
        });
    }

    public SyncStatus syncFull() {
        AthleteProfile profile = getProfile();
        log.info("Starting full Strava sync for athlete {}", profile.getStravaAthleteId());

        lastSyncStatus = new SyncStatus("in_progress", Instant.now(), 0, 0, null);
        persistSyncStatus(lastSyncStatus);

        int totalImported = 0;
        int totalSkipped = 0;
        int page = 1;

        try {
            while (true) {
                List<Activity> activities = syncDataSource.fetchActivitiesPage(profile, page, null);
                if (activities.isEmpty()) {
                    break;
                }

                for (Activity activity : activities) {
                    try {
                        boolean imported = importActivity(profile, activity);
                        if (imported) {
                            totalImported++;
                        } else {
                            totalSkipped++;
                        }
                    } catch (RateLimitException e) {
                        throw e;
                    } catch (Exception e) {
                        log.error("Error importing activity {}: {}", activity.getExternalId(), e.getMessage());
                        totalSkipped++;
                    }
                }

                if (activities.size() < PER_PAGE) {
                    break;
                }
                page++;
            }
        } catch (RateLimitException e) {
            log.warn("Full sync paused due to rate limit at page {} ({} imported, {} skipped). Resets at {}",
                    page, totalImported, totalSkipped, e.getResetsAt());
            recalculateDailyMetrics();
            lastSyncStatus = new SyncStatus("rate_limited", Instant.now(), totalImported, totalSkipped, e.getResetsAt());
            persistSyncStatus(lastSyncStatus);
            return lastSyncStatus;
        } catch (Exception e) {
            log.error("Sync failed at page {}: {}", page, e.getMessage());
            lastSyncStatus = new SyncStatus("failed", Instant.now(), totalImported, totalSkipped, null);
            persistSyncStatus(lastSyncStatus);
            throw e;
        }

        recalculateDailyMetrics();
        detectPersonalRecords();
        lastSyncStatus = new SyncStatus("completed", Instant.now(), totalImported, totalSkipped, null);
        persistSyncStatus(lastSyncStatus);
        log.info("Full sync completed: {} imported, {} skipped", totalImported, totalSkipped);
        return lastSyncStatus;
    }

    public SyncStatus syncRecent() {
        AthleteProfile profile = getProfile();
        log.info("Starting recent Strava sync for athlete {}", profile.getStravaAthleteId());

        lastSyncStatus = new SyncStatus("in_progress", Instant.now(), 0, 0, null);
        persistSyncStatus(lastSyncStatus);

        OffsetDateTime thirtyDaysAgo = OffsetDateTime.now(ZoneOffset.UTC).minusDays(30);
        OffsetDateTime latestActivity = activityRepository.findLatestStartedAtBySource("strava").orElse(null);
        long afterEpoch = latestActivity != null ? latestActivity.toEpochSecond() : thirtyDaysAgo.toEpochSecond();

        int totalImported = 0;
        int totalSkipped = 0;

        try {
            List<Activity> activities = syncDataSource.fetchActivitiesPage(profile, 1, afterEpoch);
            for (Activity activity : activities) {
                try {
                    boolean imported = importActivity(profile, activity);
                    if (imported) {
                        totalImported++;
                    } else {
                        totalSkipped++;
                    }
                } catch (RateLimitException e) {
                    throw e;
                } catch (Exception e) {
                    log.error("Error importing recent activity {}: {}", activity.getExternalId(), e.getMessage());
                    totalSkipped++;
                }
            }
        } catch (RateLimitException e) {
            log.warn("Recent sync paused due to rate limit ({} imported, {} skipped). Resets at {}",
                    totalImported, totalSkipped, e.getResetsAt());
            recalculateDailyMetrics();
            lastSyncStatus = new SyncStatus("rate_limited", Instant.now(), totalImported, totalSkipped, e.getResetsAt());
            persistSyncStatus(lastSyncStatus);
            return lastSyncStatus;
        } catch (Exception e) {
            log.error("Recent sync failed: {}", e.getMessage());
            lastSyncStatus = new SyncStatus("failed", Instant.now(), totalImported, totalSkipped, null);
            persistSyncStatus(lastSyncStatus);
            throw e;
        }

        recalculateDailyMetrics();
        detectPersonalRecords();
        lastSyncStatus = new SyncStatus("completed", Instant.now(), totalImported, totalSkipped, null);
        persistSyncStatus(lastSyncStatus);
        log.info("Recent sync completed: {} imported, {} skipped", totalImported, totalSkipped);
        return lastSyncStatus;
    }

    public SyncStatus syncActivityPhotos() {
        AthleteProfile profile = getProfile();
        log.info("Starting Strava photo sync for athlete {}", profile.getStravaAthleteId());

        lastSyncStatus = new SyncStatus("in_progress", Instant.now(), 0, 0, null);
        persistSyncStatus(lastSyncStatus);

        int totalUpdated = 0;
        int totalSkipped = 0;

        try {
            List<Activity> activities = activityRepository.findBySource("strava");
            for (Activity activity : activities) {
                String externalId = activity.getExternalId();
                if (externalId == null || externalId.isBlank()) {
                    totalSkipped++;
                    continue;
                }

                if (activity.getPhotoUrls() != null) {
                    totalSkipped++;
                    continue;
                }

                List<String> photoUrls = syncDataSource.fetchActivityPhotoUrls(profile, externalId);
                activityRepository.save(copyActivityWithPhotoUrls(activity, photoUrls));
                totalUpdated++;
            }
        } catch (RateLimitException e) {
            log.warn("Photo sync paused due to rate limit ({} updated, {} skipped). Resets at {}",
                    totalUpdated, totalSkipped, e.getResetsAt());
            lastSyncStatus = new SyncStatus("rate_limited", Instant.now(), totalUpdated, totalSkipped, e.getResetsAt());
            persistSyncStatus(lastSyncStatus);
            return lastSyncStatus;
        } catch (Exception e) {
            log.error("Photo sync failed: {}", e.getMessage());
            lastSyncStatus = new SyncStatus("failed", Instant.now(), totalUpdated, totalSkipped, null);
            persistSyncStatus(lastSyncStatus);
            throw e;
        }

        lastSyncStatus = new SyncStatus("completed", Instant.now(), totalUpdated, totalSkipped, null);
        persistSyncStatus(lastSyncStatus);
        log.info("Photo sync completed: {} updated, {} skipped", totalUpdated, totalSkipped);
        return lastSyncStatus;
    }

    private boolean importActivity(AthleteProfile profile, Activity summaryActivity) {
        // Skip activities already in the database to avoid unnecessary API calls (rate limiting)
        if (activityRepository.existsByExternalIdAndSource(summaryActivity.getExternalId(), "strava")) {
            log.debug("Activity {} already exists, skipping", summaryActivity.getExternalId());
            return false;
        }

        // Fetch full detail with streams only for new activities
        Activity fullActivity = syncDataSource.fetchActivityWithStreams(
                profile, summaryActivity.getExternalId());

        List<Lap> enrichedLaps = lapMetricsService.enrichLaps(fullActivity, profile.getFtpWatts());

        Activity.ActivityBuilder builder = Activity.builder()
                .externalId(fullActivity.getExternalId())
                .source("strava")
                .sportType(fullActivity.getSportType())
                .name(fullActivity.getName())
                .description(fullActivity.getDescription())
                .startedAt(fullActivity.getStartedAt())
                .elapsedTimeSec(fullActivity.getElapsedTimeSec())
                .movingTimeSec(fullActivity.getMovingTimeSec())
                .distanceM(fullActivity.getDistanceM())
                .elevationGainM(fullActivity.getElevationGainM())
                .elevationLossM(fullActivity.getElevationLossM())
                .avgSpeedMs(fullActivity.getAvgSpeedMs())
                .maxSpeedMs(fullActivity.getMaxSpeedMs())
                .avgHeartrate(fullActivity.getAvgHeartrate())
                .maxHeartrate(fullActivity.getMaxHeartrate())
                .avgPowerW(fullActivity.getAvgPowerW())
                .maxPowerW(fullActivity.getMaxPowerW())
                .avgCadence(fullActivity.getAvgCadence())
                .maxCadence(fullActivity.getMaxCadence())
                .calories(fullActivity.getCalories())
                .avgTempC(fullActivity.getAvgTempC())
                .summaryPolyline(fullActivity.getSummaryPolyline())
                .photoUrls(fullActivity.getPhotoUrls())
                .powerStream(fullActivity.getPowerStream())
                .heartrateStream(fullActivity.getHeartrateStream())
                .cadenceStream(fullActivity.getCadenceStream())
                .altitudeStream(fullActivity.getAltitudeStream())
                .timeStream(fullActivity.getTimeStream())
                .latStream(fullActivity.getLatStream())
                .lngStream(fullActivity.getLngStream())
                .distanceStream(fullActivity.getDistanceStream())
                .velocityStream(fullActivity.getVelocityStream())
                .laps(enrichedLaps)
                .createdAt(Instant.now())
                .updatedAt(Instant.now());

        Activity saved = activityRepository.save(builder.build());

        // Calculate and save metrics
        try {
            Map<String, MetricResult> metrics = metricRegistry.calculateAllActivityMetrics(saved, profile);
            if (!metrics.isEmpty()) {
                metricPersistenceService.saveActivityMetrics(saved.getId(), metrics);
            }
        } catch (Exception e) {
            log.warn("Failed to calculate metrics for activity {}: {}", saved.getExternalId(), e.getMessage(), e);
        }

        // Enqueue AI note generation (non-blocking, processed in background)
        try {
            if (aiActivityNoteService != null) {
                aiActivityNoteService.enqueueNoteGeneration(saved.getId());
            }
        } catch (Exception e) {
            log.debug("Could not enqueue AI note for activity {}: {}", saved.getExternalId(), e.getMessage());
        }

        // Update heatmap incrementally (non-blocking)
        try {
            heatmapBuildService.updateForActivity(saved.getSummaryPolyline());
        } catch (Exception e) {
            log.debug("Could not update heatmap for activity {}: {}", saved.getExternalId(), e.getMessage());
        }

        // Auto-calculate training effect for the newly imported activity
        try {
            DailySummary daySummary = dailySummaryRepository
                    .findByDate(saved.getStartedAt().toLocalDate()).orElse(null);
            ActivityTrainingEffect effect = workoutEvaluationService
                    .calculateTrainingEffect(saved, profile, daySummary);
            trainingEffectRepository.save(effect);
        } catch (Exception e) {
            log.warn("Failed to calculate training effect for activity {}: {}",
                    saved.getExternalId(), e.getMessage());
        }

        return true;
    }

    private AthleteProfile getProfile() {
        return profileRepository.findFirst()
                .orElseThrow(() -> new ProfileNotFoundException("No athlete profile found. Connect Strava first."));
    }

    private void recalculateDailyMetrics() {
        try {
            dailyMetricsService.recalculateAll();
        } catch (Exception e) {
            log.warn("Failed to recalculate daily metrics: {}", e.getMessage());
        }
    }

    public void clearAllData() {
        log.info("Clearing all synced data");
        dailyMetricRepository.deleteAll();
        activityMetricRepository.deleteAll();
        activityRepository.deleteAll();
        lastSyncStatus = new SyncStatus("idle", null, 0, 0, null);
        persistSyncStatus(lastSyncStatus);
        log.info("All synced data cleared");
    }

    public void recalculateActivityMetrics(UUID activityId) {
        AthleteProfile profile = getProfile();
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found: " + activityId));
        try {
            Map<String, MetricResult> metrics = metricRegistry.calculateAllActivityMetrics(activity, profile);
            if (!metrics.isEmpty()) {
                metricPersistenceService.saveActivityMetrics(activityId, metrics);
            }
            log.info("Recalculated {} metrics for activity {}", metrics.size(), activityId);
        } catch (Exception e) {
            log.warn("Failed to recalculate metrics for activity {}: {}", activityId, e.getMessage(), e);
        }
    }

    public void recalculateAllActivityMetrics() {
        AthleteProfile profile = getProfile();
        List<Activity> activities = activityRepository.findAll();
        log.info("Recalculating activity metrics for {} activities", activities.size());
        int success = 0;
        for (Activity activity : activities) {
            try {
                Map<String, MetricResult> metrics = metricRegistry.calculateAllActivityMetrics(activity, profile);
                if (!metrics.isEmpty()) {
                    metricPersistenceService.saveActivityMetrics(activity.getId(), metrics);
                }
                success++;
            } catch (Exception e) {
                log.warn("Failed to recalculate metrics for activity {}: {}", activity.getId(), e.getMessage());
            }
        }
        log.info("Recalculated activity metrics: {}/{} succeeded", success, activities.size());
    }

    private Activity copyActivityWithPhotoUrls(Activity activity, List<String> photoUrls) {
        return activity.toBuilder()
                .photoUrls(photoUrls != null ? List.copyOf(photoUrls) : List.of())
                .updatedAt(Instant.now())
                .build();
    }

    /**
     * Re-sync streams (GPS, distance, velocity), laps, and elevation for existing activities.
     * Respects Strava rate limits.
     */
    public SyncStatus resyncStreams() {
        AthleteProfile profile = getProfile();
        log.info("Starting stream re-sync for athlete {}", profile.getStravaAthleteId());

        lastSyncStatus = new SyncStatus("in_progress", Instant.now(), 0, 0, null);
        persistSyncStatus(lastSyncStatus);

        int totalUpdated = 0;
        int totalSkipped = 0;

        try {
            List<Activity> activities = activityRepository.findBySource("strava");
            for (Activity activity : activities) {
                if (hasFullData(activity)) {
                    totalSkipped++;
                    continue;
                }

                String externalId = activity.getExternalId();
                if (externalId == null || externalId.isBlank()) {
                    totalSkipped++;
                    continue;
                }

                try {
                    Activity fresh = syncDataSource.fetchActivityWithStreams(profile, externalId);
                    List<pl.strava.analizator.domain.vo.Lap> enrichedLaps =
                            lapMetricsService.enrichLaps(fresh, profile.getFtpWatts());
                    Activity updated = activity.toBuilder()
                            .latStream(fresh.getLatStream())
                            .lngStream(fresh.getLngStream())
                            .distanceStream(fresh.getDistanceStream())
                            .velocityStream(fresh.getVelocityStream())
                            .powerStream(fresh.getPowerStream())
                            .heartrateStream(fresh.getHeartrateStream())
                            .cadenceStream(fresh.getCadenceStream())
                            .altitudeStream(fresh.getAltitudeStream())
                            .timeStream(fresh.getTimeStream())
                            .laps(enrichedLaps)
                            .elevationGainM(fresh.getElevationGainM())
                            .elevationLossM(fresh.getElevationLossM())
                            .summaryPolyline(fresh.getSummaryPolyline())
                            .updatedAt(Instant.now())
                            .build();
                    activityRepository.save(updated);
                    totalUpdated++;
                    log.debug("Updated streams and elevation for activity {}", externalId);
                } catch (RateLimitException e) {
                    throw e;
                } catch (Exception e) {
                    log.warn("Failed to re-sync streams for activity {}: {}", externalId, e.getMessage());
                    totalSkipped++;
                }
            }
        } catch (RateLimitException e) {
            log.warn("Stream re-sync paused due to rate limit ({} updated, {} skipped). Resets at {}",
                    totalUpdated, totalSkipped, e.getResetsAt());
            lastSyncStatus = new SyncStatus("rate_limited", Instant.now(), totalUpdated, totalSkipped, e.getResetsAt());
            persistSyncStatus(lastSyncStatus);
            return lastSyncStatus;
        } catch (Exception e) {
            log.error("Stream re-sync failed: {}", e.getMessage());
            lastSyncStatus = new SyncStatus("failed", Instant.now(), totalUpdated, totalSkipped, null);
            persistSyncStatus(lastSyncStatus);
            throw e;
        }

        lastSyncStatus = new SyncStatus("completed", Instant.now(), totalUpdated, totalSkipped, null);
        persistSyncStatus(lastSyncStatus);
        log.info("Stream re-sync completed: {} updated, {} skipped", totalUpdated, totalSkipped);
        return lastSyncStatus;
    }

    private boolean hasFullData(Activity activity) {
        if (activity.getLatStream() == null) return false;
        if (activity.getAltitudeStream() == null) return false;
        if (activity.getPowerStream() == null) return false;
        if (activity.getSummaryPolyline() == null) return false;
        if (activity.getLaps() == null) return false;

        for (pl.strava.analizator.domain.vo.Lap lap : activity.getLaps()) {
            if (lap.getStartIndex() == null || lap.getEndIndex() == null
                    || lap.getTotalElevationGain() == null) {
                return false;
            }
        }
        return true;
    }

    private void persistSyncStatus(SyncStatus status) {
        syncStateRepository.findFirst().ifPresent(existing -> {
            SyncState updated = SyncState.builder()
                    .id(existing.getId())
                    .status(status.status())
                    .lastSyncAt(status.lastSyncAt())
                    .importedTotal(status.imported())
                    .skippedTotal(status.skipped())
                    .rateLimitResetsAt(status.rateLimitResetsAt())
                    .updatedAt(Instant.now())
                    .build();
            syncStateRepository.save(updated);
        });
    }

    public NewActivitiesCheck checkForNewActivities() {
        AthleteProfile profile = getProfile();
        OffsetDateTime latestActivity = activityRepository.findLatestStartedAtBySource("strava").orElse(null);
        long afterEpoch = latestActivity != null ? latestActivity.toEpochSecond() : 0;

        int count = 0;
        try {
            count = syncDataSource.countNewActivities(profile, afterEpoch);
        } catch (RateLimitException e) {
            log.warn("Check for new activities hit rate limit, resets at {}", e.getResetsAt());
        } catch (Exception e) {
            log.warn("Failed to check for new activities: {}", e.getMessage());
        }

        return new NewActivitiesCheck(count > 0, count, latestActivity != null ? latestActivity.toInstant() : null);
    }

    @Scheduled(fixedDelayString = "${strava.auto-sync.interval-ms:1800000}")
    public void autoSyncRecent() {
        SyncStatus current = lastSyncStatus;
        if ("in_progress".equals(current.status()) || "rate_limited".equals(current.status())) {
            log.debug("Skipping auto-sync: current status is {}", current.status());
            return;
        }

        try {
            AthleteProfile profile = profileRepository.findFirst().orElse(null);
            if (profile == null) {
                log.debug("Skipping auto-sync: no athlete profile");
                return;
            }

            OffsetDateTime latestActivity = activityRepository.findLatestStartedAtBySource("strava").orElse(null);
            if (latestActivity == null) {
                log.debug("Skipping auto-sync: no activities in DB yet, use manual sync first");
                return;
            }

            int count = syncDataSource.countNewActivities(profile, latestActivity.toEpochSecond());
            if (count == 0) {
                log.debug("Auto-sync: no new activities found");
                return;
            }

            log.info("Auto-sync: {} new activities found, starting sync", count);
            syncRecent();
        } catch (RateLimitException e) {
            log.warn("Auto-sync hit rate limit, resets at {}", e.getResetsAt());
        } catch (Exception e) {
            log.warn("Auto-sync failed: {}", e.getMessage());
        }
    }

    public AutoSyncConfig getAutoSyncConfig() {
        return new AutoSyncConfig(autoSyncConfigPort.getIntervalMinutes());
    }

    public AutoSyncConfig updateAutoSyncConfig(int intervalMinutes) {
        autoSyncConfigPort.setIntervalMinutes(intervalMinutes);
        return new AutoSyncConfig(intervalMinutes);
    }

    private void detectPersonalRecords() {
        try {
            personalRecordService.detectNewRecords();
        } catch (Exception e) {
            log.warn("Personal record detection failed (non-critical): {}", e.getMessage());
        }
        try {
            challengeService.updateAllProgress();
        } catch (Exception e) {
            log.warn("Challenge progress update failed (non-critical): {}", e.getMessage());
        }
    }

    public record SyncStatus(String status, Instant lastSyncAt, int imported, int skipped, Instant rateLimitResetsAt) {}
    public record NewActivitiesCheck(boolean hasNew, int count, Instant lastSyncedAt) {}
    public record AutoSyncConfig(int intervalMinutes) {}
}
