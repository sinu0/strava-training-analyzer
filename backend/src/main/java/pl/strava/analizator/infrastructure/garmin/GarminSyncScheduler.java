package pl.strava.analizator.infrastructure.garmin;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.GarminSyncService;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "garmin.enabled", havingValue = "true")
public class GarminSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(GarminSyncScheduler.class);

    private final GarminSyncService garminSyncService;

    @Scheduled(cron = "0 0 */6 * * *")
    public void scheduledSync() {
        if (!garminSyncService.hasCredentials()) {
            log.debug("Garmin scheduled sync skipped — no credentials configured");
            return;
        }

        log.info("Starting scheduled Garmin health data sync");
        try {
            GarminSyncService.SyncResult result = garminSyncService.syncLastNDays(2);
            log.info("Scheduled Garmin sync completed: synced={}, skipped={}, failed={}",
                    result.synced(), result.skipped(), result.failed());
        } catch (Exception e) {
            log.error("Scheduled Garmin sync failed: {}", e.getMessage(), e);
        }
    }
}
