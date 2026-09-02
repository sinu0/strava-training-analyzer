package pl.strava.analizator.application.ai;

import java.time.Duration;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job that processes the AI note generation queue.
 * Runs every 30 seconds, processes one job at a time to avoid overloading LLM providers.
 */
@Component
public class AiNoteQueueProcessor {

    private static final Logger log = LoggerFactory.getLogger(AiNoteQueueProcessor.class);

    private final AiActivityNoteService noteService;
    private final boolean enabled;
    private final Duration providerCooldown;
    private final Duration staleAfter;
    private volatile Instant suspendedUntil;

    public AiNoteQueueProcessor(AiActivityNoteService noteService,
                                 @Value("${ai.enabled:false}") boolean enabled,
                                 @Value("${ai.note-queue.provider-cooldown:PT5M}") Duration providerCooldown,
                                 @Value("${ai.note-queue.stale-after:PT15M}") Duration staleAfter) {
        this.noteService = noteService;
        this.enabled = enabled;
        this.providerCooldown = providerCooldown;
        this.staleAfter = staleAfter;
    }

    @Scheduled(fixedDelayString = "${ai.note-queue.interval-ms:30000}")
    public void processQueue() {
        if (!enabled) {
            log.debug("AI note queue processing disabled via configuration (ai.enabled=false)");
            return;
        }

        Instant now = Instant.now();
        if (suspendedUntil != null && now.isBefore(suspendedUntil)) {
            return;
        }

        if (!noteService.isDefaultProviderAvailable()) {
            suspendedUntil = now.plus(providerCooldown);
            log.warn("AI note queue paused until {} because the configured provider/model is unavailable",
                    suspendedUntil);
            return;
        }
        suspendedUntil = null;

        try {
            noteService.recoverStaleJobs(staleAfter);
            boolean processed = noteService.processNextJob();
            if (processed) {
                log.debug("Processed one AI note job from queue");
            }
        } catch (Exception e) {
            suspendedUntil = Instant.now().plus(providerCooldown);
            log.error("AI note queue paused until {} after processor error: {}",
                    suspendedUntil, e.getMessage());
        }
    }
}
