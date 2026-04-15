package pl.strava.analizator.infrastructure.garmin;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.HealthDataSource;
import pl.strava.analizator.infrastructure.config.EncryptionUtil;
import pl.strava.analizator.infrastructure.garmin.dto.GarminDailySummaryDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminHeartRateDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminHrvDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminSleepDto;

/**
 * Adapter that implements the HealthDataSource port by fetching data from Garmin Connect.
 */
@Component("garmin")
@RequiredArgsConstructor
public class GarminHealthAdapter implements HealthDataSource {

    private static final Logger log = LoggerFactory.getLogger(GarminHealthAdapter.class);
    private static final int MAX_AUTH_RETRIES = 3;
    private static final long INITIAL_RETRY_DELAY_MS = 2000;

    private final GarminConnectClient garminClient;
    private final AthleteProfileRepository profileRepository;
    private final EncryptionUtil encryptionUtil;

    @Override
    public String sourceName() {
        return "garmin";
    }

    @Override
    public DailySummary fetchDailyHealth(LocalDate date) {
        AthleteProfile profile = profileRepository.findFirst().orElse(null);
        if (profile == null || profile.getGarminUserId() == null || profile.getGarminToken() == null) {
            log.debug("No Garmin credentials configured — skipping health fetch");
            return null;
        }

        String email = profile.getGarminUserId();
        String password = encryptionUtil.decrypt(profile.getGarminToken());

        if (!garminClient.isAuthenticated()) {
            authenticateWithRetry(email, password);
        }

        GarminDailySummaryDto summary = garminClient.fetchDailySummary(date);
        GarminHeartRateDto heartRate = garminClient.fetchHeartRate(date);
        GarminSleepDto sleep = garminClient.fetchSleep(date);
        GarminHrvDto hrv = garminClient.fetchHrv(date);

        if (summary == null && heartRate == null && sleep == null && hrv == null) {
            log.debug("No Garmin data available for {}", date);
            return null;
        }

        return mapToDailySummary(date, summary, heartRate, sleep, hrv);
    }

    private void authenticateWithRetry(String email, String password) {
        GarminConnectClient.AuthFailure lastFailure = null;
        for (int attempt = 1; attempt <= MAX_AUTH_RETRIES; attempt++) {
            log.debug("Garmin auth attempt {}/{}", attempt, MAX_AUTH_RETRIES);
            boolean ok = garminClient.authenticate(email, password);
            if (ok) {
                return;
            }

            lastFailure = garminClient.getLastAuthFailure();
            if (lastFailure != null && !lastFailure.retryable()) {
                log.error("Garmin auth failed without retry for {}: {}", email, lastFailure.message());
                throw new RuntimeException(lastFailure.message());
            }

            if (attempt < MAX_AUTH_RETRIES) {
                long delay = INITIAL_RETRY_DELAY_MS * (1L << (attempt - 1));
                String reason = lastFailure != null ? lastFailure.message() : "unknown error";
                log.info("Garmin auth attempt {} failed, retrying in {}ms: {}", attempt, delay, reason);
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Garmin authentication retry interrupted", e);
                }
            }
        }
        String message = lastFailure != null
                ? lastFailure.message()
                : "Garmin authentication failed for " + email + " after " + MAX_AUTH_RETRIES + " attempts";
        log.error("Garmin auth exhausted all {} retries for {}: {}", MAX_AUTH_RETRIES, email, message);
        throw new RuntimeException(message);
    }

    DailySummary mapToDailySummary(LocalDate date,
                                    GarminDailySummaryDto summary,
                                    GarminHeartRateDto heartRate,
                                    GarminSleepDto sleep,
                                    GarminHrvDto hrv) {
        DailySummary.DailySummaryBuilder builder = DailySummary.builder()
                .date(date)
                .garminSyncedAt(Instant.now());

        if (summary != null) {
            builder.steps(summary.getSteps());
            builder.activeCalories(summary.getActiveCalories());
            if (summary.getStressAvg() != null) {
                builder.stressAvg(summary.getStressAvg().shortValue());
            }
            if (summary.getRestingHeartRate() != null) {
                builder.restingHrBpm(summary.getRestingHeartRate().shortValue());
            }
            if (summary.getBodyBattery() != null) {
                builder.bodyBattery(summary.getBodyBattery().shortValue());
            }
        }

        if (heartRate != null && heartRate.getRestingHeartRate() != null) {
            builder.restingHrBpm(heartRate.getRestingHeartRate().shortValue());
        }

        if (sleep != null) {
            builder.sleepDurationSeconds(sleep.getSleepTimeSeconds());
            builder.deepSleepSeconds(sleep.getDeepSleepSeconds());
            builder.lightSleepSeconds(sleep.getLightSleepSeconds());
            builder.remSleepSeconds(sleep.getRemSleepSeconds());
            builder.awakeSleepSeconds(sleep.getAwakeSleepSeconds());
            Short sleepScore = extractSleepScore(sleep);
            if (sleepScore != null) {
                builder.sleepScore(sleepScore);
            }
        }

        if (hrv != null && hrv.getHrvSummary() != null && hrv.getHrvSummary().getLastNightAvg() != null) {
            builder.hrvRmssd(BigDecimal.valueOf(hrv.getHrvSummary().getLastNightAvg()));
        }

        return builder.build();
    }

    private Short extractSleepScore(GarminSleepDto sleep) {
        if (sleep.getSleepScores() != null
                && sleep.getSleepScores().getOverall() != null
                && sleep.getSleepScores().getOverall().getValue() != null) {
            return sleep.getSleepScores().getOverall().getValue().shortValue();
        }
        return null;
    }
}
