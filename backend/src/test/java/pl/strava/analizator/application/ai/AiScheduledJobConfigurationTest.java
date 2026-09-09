package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import pl.strava.analizator.application.ai.knowledge.KnowledgeBaseBuilder;
import pl.strava.analizator.application.ai.knowledge.KnowledgeRefreshJob;

class AiScheduledJobConfigurationTest {

    @Test
    void batchJobRequiresMasterAndBatchSwitches() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(AiPredictionService.class, () -> mock(AiPredictionService.class))
                .withUserConfiguration(AiBatchPredictionJob.class);

        runner.withPropertyValues("ai.enabled=false", "ai.batch.enabled=true")
                .run(context -> assertThat(context).doesNotHaveBean(AiBatchPredictionJob.class));
        runner.withPropertyValues("ai.enabled=true", "ai.batch.enabled=true")
                .run(context -> assertThat(context).hasSingleBean(AiBatchPredictionJob.class));
    }

    @Test
    void knowledgeRefreshRequiresMasterAndKnowledgeSwitches() {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(KnowledgeBaseBuilder.class, () -> mock(KnowledgeBaseBuilder.class))
                .withUserConfiguration(KnowledgeRefreshJob.class);

        runner.withPropertyValues("ai.enabled=false", "ai.knowledge.enabled=true")
                .run(context -> assertThat(context).doesNotHaveBean(KnowledgeRefreshJob.class));
        runner.withPropertyValues("ai.enabled=true", "ai.knowledge.enabled=true")
                .run(context -> assertThat(context).hasSingleBean(KnowledgeRefreshJob.class));
    }
}
