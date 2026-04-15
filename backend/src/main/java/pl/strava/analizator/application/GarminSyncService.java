package pl.strava.analizator.application;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.port.HealthDataSource;

@Service
public class GarminSyncService {

    private static final Logger log = LoggerFactory.getLogger(GarminSyncService.class);

    private final HealthDataSource healthDataSource;
    private final DailySummaryRepository dailySummaryRepository;
    private final AthleteProfileRepository profileRepository;
    // Holds the last terminal error message encountered during Garmin sync operations.
    private volatile String lastGarminError;

    public GarminSyncService(@Qualifier("garmin") HealthDataSource healthDataSource,
                             DailySummaryRepository dailySummaryRepository,
                             AthleteProfileRepository profileRepository) {
        this.healthDataSource = healthDataSource;
        this.dailySummaryRepository = dailySummaryRepository;
        this.profileRepository = profileRepository;
        this.lastGarminError = null;
    }

    /**
     * Sync health data for a date range.
     */
    public SyncResult syncHealthData(LocalDate from, LocalDate to) {
        log.info("Starting Garmin health sync from {} to {}", from, to);
        int synced = 0;
        int skipped = 0;
        int failed = 0;
        java.util.List<String> errors = new java.util.ArrayList<>();

        LocalDate current = from;
        while (!current.isAfter(to)) {
            try {
                DailySummary healthData = healthDataSource.fetchDailyHealth(current);
                if (healthData == null) {
                    skipped++;
                    current = current.plusDays(1);
                    continue;
                }

                Optional<DailySummary> existing = dailySummaryRepository.findByDate(current);
                if (existing.isPresent()) {
                    DailySummary merged = mergeHealthIntoExisting(existing.get(), healthData);
                    dailySummaryRepository.save(merged);
                } else {
                    DailySummary toSave = healthData.toBuilder()
                            .id(UUID.randomUUID())
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                    dailySummaryRepository.save(toSave);
                }
                synced++;

            } catch (Exception e) {
                log.error("Failed to sync health data for {}: {}", current, e.getMessage(), e);
                failed++;
                errors.add(current + ": " + e.getMessage());
                // Record last terminal error to surface in admin UI
                lastGarminError = e.getMessage();
                if (isTerminalGarminFailure(e.getMessage())) {
                    log.warn("Terminal Garmin login failure detected — skipping remaining dates");
                    long remaining = java.time.temporal.ChronoUnit.DAYS.between(current.plusDays(1), to.plusDays(1));
                    if (remaining > 0) {
                        errors.add("Przerwano pozostałe " + remaining
                                + " dni po krytycznym błędzie logowania Garmin.");
                    }
                    failed += (int) Math.max(0, remaining);
                    break;
                }
            }

            current = current.plusDays(1);
        }

        log.info("Garmin health sync completed: synced={}, skipped={}, failed={}", synced, skipped, failed);
        return new SyncResult(synced, skipped, failed, errors);
    }

    /**
     * Convenience: sync today.
     */
    public SyncResult syncToday() {
        LocalDate today = LocalDate.now();
        return syncHealthData(today, today);
    }

    /**
     * Convenience: sync last N days (today included).
     */
    public SyncResult syncLastNDays(int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);
        return syncHealthData(from, to);
    }

    /**
     * Check whether Garmin credentials are configured.
     */
    public boolean hasCredentials() {
        return profileRepository.findFirst()
                .map(p -> p.getGarminUserId() != null && p.getGarminToken() != null)
                .orElse(false);
    }

    /**
     * Get the Garmin email from the athlete profile.
     */
    public Optional<String> getGarminEmail() {
        return profileRepository.findFirst()
                .map(AthleteProfile::getGarminUserId);
    }

    /**
     * Get the timestamp of the most recent Garmin sync.
     */
    public Optional<Instant> getLastSyncTimestamp() {
        return dailySummaryRepository.findMostRecentGarminSync();
    }

    /**
     * Save Garmin credentials to the athlete profile.
     * The password must be pre-encrypted by the caller.
     */
    public void saveCredentials(String email, String encryptedPassword) {
        AthleteProfile profile = profileRepository.findFirst()
                .orElseThrow(() -> new ProfileNotFoundException("No athlete profile found"));

        AthleteProfile updated = AthleteProfile.builder()
                .id(profile.getId())
                .name(profile.getName())
                .email(profile.getEmail())
                .ftpWatts(profile.getFtpWatts())
                .lthrBpm(profile.getLthrBpm())
                .maxHrBpm(profile.getMaxHrBpm())
                .restingHrBpm(profile.getRestingHrBpm())
                .weightKg(profile.getWeightKg())
                .dateOfBirth(profile.getDateOfBirth())
                .stravaAthleteId(profile.getStravaAthleteId())
                .stravaAccessToken(profile.getStravaAccessToken())
                .stravaRefreshToken(profile.getStravaRefreshToken())
                .stravaTokenExpires(profile.getStravaTokenExpires())
                .garminUserId(email)
                .garminToken(encryptedPassword)
                .createdAt(profile.getCreatedAt())
                .updatedAt(Instant.now())
                .build();

        profileRepository.save(updated);
        log.info("Garmin credentials saved for {}", email);
    }

    /**
     * Clear Garmin credentials from the athlete profile.
     */
    public void clearCredentials() {
        AthleteProfile profile = profileRepository.findFirst()
                .orElseThrow(() -> new ProfileNotFoundException("No athlete profile found"));

        AthleteProfile updated = AthleteProfile.builder()
                .id(profile.getId())
                .name(profile.getName())
                .email(profile.getEmail())
                .ftpWatts(profile.getFtpWatts())
                .lthrBpm(profile.getLthrBpm())
                .maxHrBpm(profile.getMaxHrBpm())
                .restingHrBpm(profile.getRestingHrBpm())
                .weightKg(profile.getWeightKg())
                .dateOfBirth(profile.getDateOfBirth())
                .stravaAthleteId(profile.getStravaAthleteId())
                .stravaAccessToken(profile.getStravaAccessToken())
                .stravaRefreshToken(profile.getStravaRefreshToken())
                .stravaTokenExpires(profile.getStravaTokenExpires())
                .garminUserId(null)
                .garminToken(null)
                .createdAt(profile.getCreatedAt())
                .updatedAt(Instant.now())
                .build();

        profileRepository.save(updated);
        log.info("Garmin credentials cleared");
    }

    /**
     * Get the health data for a specific date.
     */
    public Optional<DailySummary> getHealthData(LocalDate date) {
        return dailySummaryRepository.findByDate(date);
    }

    private DailySummary mergeHealthIntoExisting(DailySummary existing, DailySummary healthData) {
        return existing.toBuilder()
                .restingHrBpm(coalesce(healthData.getRestingHrBpm(), existing.getRestingHrBpm()))
                .hrvRmssd(coalesce(healthData.getHrvRmssd(), existing.getHrvRmssd()))
                .sleepScore(coalesce(healthData.getSleepScore(), existing.getSleepScore()))
                .bodyBattery(coalesce(healthData.getBodyBattery(), existing.getBodyBattery()))
                .stressAvg(coalesce(healthData.getStressAvg(), existing.getStressAvg()))
                .sleepDurationSeconds(coalesce(healthData.getSleepDurationSeconds(), existing.getSleepDurationSeconds()))
                .steps(coalesce(healthData.getSteps(), existing.getSteps()))
                .activeCalories(coalesce(healthData.getActiveCalories(), existing.getActiveCalories()))
                .deepSleepSeconds(coalesce(healthData.getDeepSleepSeconds(), existing.getDeepSleepSeconds()))
                .lightSleepSeconds(coalesce(healthData.getLightSleepSeconds(), existing.getLightSleepSeconds()))
                .remSleepSeconds(coalesce(healthData.getRemSleepSeconds(), existing.getRemSleepSeconds()))
                .awakeSleepSeconds(coalesce(healthData.getAwakeSleepSeconds(), existing.getAwakeSleepSeconds()))
                .garminSyncedAt(healthData.getGarminSyncedAt())
                .updatedAt(Instant.now())
                .build();
    }

    private <T> T coalesce(T primary, T fallback) {
        return primary != null ? primary : fallback;
    }

    private boolean isTerminalGarminFailure(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String normalized = message.toLowerCase();
        return normalized.contains("cloudflare")
                || normalized.contains("garmin authentication failed")
                || normalized.contains("service ticket")
                || normalized.contains("http 401")
                || normalized.contains("http 403");
    }

    public Optional<String> getLastGarminError() {
        return Optional.ofNullable(lastGarminError);
    }

    public record SyncResult(int synced, int skipped, int failed, java.util.List<String> errors) {
    }
}
