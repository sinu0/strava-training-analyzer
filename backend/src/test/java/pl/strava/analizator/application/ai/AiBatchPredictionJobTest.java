package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.BatchRunResultDto;

@ExtendWith(MockitoExtension.class)
class AiBatchPredictionJobTest {

    @Mock private AiPredictionService aiPredictionService;

    private AiBatchPredictionJob job;

    @BeforeEach
    void setUp() {
        job = new AiBatchPredictionJob(aiPredictionService);
    }

    @Test
    void runDailyPredictions_delegatesToServiceWithSkipExisting() {
        when(aiPredictionService.runBatch(true)).thenReturn(
                BatchRunResultDto.builder().success(6).skipped(0).failed(0).message("ok").build());

        job.runDailyPredictions();

        verify(aiPredictionService).runBatch(true);
    }

    @Test
    void runDailyPredictions_doesNotPassForceFlag() {
        when(aiPredictionService.runBatch(true)).thenReturn(
                BatchRunResultDto.builder().success(0).skipped(6).failed(0).message("all skipped").build());

        job.runDailyPredictions();

        // Nightly job always uses skipExisting=true
        verify(aiPredictionService).runBatch(true);
    }

    @Test
    void jobClass_hasScheduledAnnotation() throws Exception {
        var method = AiBatchPredictionJob.class.getMethod("runDailyPredictions");
        var scheduled = method.getAnnotation(org.springframework.scheduling.annotation.Scheduled.class);

        assertThat(scheduled).isNotNull();
        assertThat(scheduled.cron()).contains("3");
    }
}
