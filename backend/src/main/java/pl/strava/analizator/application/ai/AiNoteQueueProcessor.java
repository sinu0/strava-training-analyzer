package pl.strava.analizator.application.ai;

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

    public AiNoteQueueProcessor(AiActivityNoteService noteService,
                                 @Value("${ai.enabled:false}") boolean enabled) {
        this.noteService = noteService;
        this.enabled = enabled;
    }

    @Scheduled(fixedDelayString = "${ai.note-queue.interval-ms:30000}")
    public void processQueue() {
        if (!enabled) {
            log.debug("AI note queue processing disabled via configuration (ai.enabled=false)");
            return;
        }

        try {
            boolean processed = noteService.processNextJob();
            if (processed) {
                log.debug("Processed one AI note job from queue");
            }
        } catch (Exception e) {
            log.error("Error processing AI note queue: {}", e.getMessage());
        }
    }
}
