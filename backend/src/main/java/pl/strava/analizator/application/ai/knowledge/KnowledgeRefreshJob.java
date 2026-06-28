package pl.strava.analizator.application.ai.knowledge;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "ai.knowledge.enabled", havingValue = "true", matchIfMissing = false)
public class KnowledgeRefreshJob {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeRefreshJob.class);

    private final KnowledgeBaseBuilder knowledgeBaseBuilder;

    public KnowledgeRefreshJob(KnowledgeBaseBuilder knowledgeBaseBuilder) {
        this.knowledgeBaseBuilder = knowledgeBaseBuilder;
    }

    @Scheduled(cron = "${ai.knowledge.cron:0 0 2 * * 0}")
    public void refresh() {
        log.info("Scheduled knowledge base refresh starting...");
        try {
            int count = knowledgeBaseBuilder.rebuild();
            log.info("Scheduled knowledge base refresh complete: {} documents", count);
        } catch (Exception e) {
            log.error("Knowledge base refresh failed", e);
        }
    }
}
