package pl.strava.analizator.infrastructure.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Logs important AI and Garmin configuration flags at startup to aid debugging when scheduled jobs
 * or integrations appear not to be running.
 */
@Component
public class StartupStatusLogger {

    private static final Logger log = LoggerFactory.getLogger(StartupStatusLogger.class);

    public StartupStatusLogger(
            @Value("${ai.enabled:false}") boolean aiEnabled,
            @Value("${ai.batch.enabled:false}") boolean aiBatchEnabled,
            @Value("${ai.batch.cron:0 0 3 * * *}") String aiBatchCron,
            @Value("${ai.note-queue.interval-ms:30000}") long aiNoteQueueIntervalMs,
            @Value("${garmin.enabled:false}") boolean garminEnabled,
            @Value("${garmin.sync-interval-hours:6}") int garminSyncIntervalHours
    ) {
        log.info("AI module enabled: {} | AI batch enabled: {} | AI batch cron: {} | AI note-queue interval-ms: {}",
                aiEnabled, aiBatchEnabled, aiBatchCron, aiNoteQueueIntervalMs);

        log.info("Garmin integration enabled: {} | Garmin sync interval hours: {}",
                garminEnabled, garminSyncIntervalHours);
    }
}
