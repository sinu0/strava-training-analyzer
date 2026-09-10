package pl.strava.analizator.application;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;

class ProcessingJobRetrySchedulerTest {

    @Test
    void scheduledTickResumesDueImports() {
        ImportJobService importJobs = mock(ImportJobService.class);

        new ProcessingJobRetryScheduler(importJobs).resumeDueImports();

        verify(importJobs).retryDueJobs();
    }
}
