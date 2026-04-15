package pl.strava.analizator.application.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs nightly batch predictions for all 6 prediction types at 3 AM.
 * Skips types already generated today (idempotent).
 * Activated when ai.batch.enabled=true.
 */
@Component
@ConditionalOnProperty(name = "ai.batch.enabled", havingValue = "true", matchIfMissing = false)
public class AiBatchPredictionJob {

    private final AiPredictionService aiPredictionService;

    public AiBatchPredictionJob(AiPredictionService aiPredictionService) {
        this.aiPredictionService = aiPredictionService;
    }

    @Scheduled(cron = "${ai.batch.cron:0 0 3 * * *}")
    public void runDailyPredictions() {
        aiPredictionService.runBatch(true);
    }
}
