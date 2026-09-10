package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.ProcessingJob;
import pl.strava.analizator.domain.port.ProcessingJobRepository;

@ExtendWith(MockitoExtension.class)
class ImportJobServiceTest {

    @Mock private ProcessingJobRepository jobRepository;
    @Mock private ImportJobRunner jobRunner;

    private ImportJobService service;

    @BeforeEach
    void setUp() {
        service = new ImportJobService(jobRepository, jobRunner);
    }

    @Test
    void createPersistsObservableJobAndStartsIt() {
        UUID id = UUID.randomUUID();
        when(jobRepository.findUnfinished("IMPORT")).thenReturn(Optional.empty());
        when(jobRepository.save(any())).thenAnswer(invocation -> {
            ProcessingJob job = invocation.getArgument(0);
            return job.toBuilder().id(id).build();
        });

        ProcessingJob job = service.create("recent");

        assertThat(job.getStatus()).isEqualTo("QUEUED");
        assertThat(job.getStage()).isEqualTo("FETCH_SUMMARY");
        assertThat(job.getMode()).isEqualTo("RECENT");
        verify(jobRunner).start(id);
    }

    @Test
    void createReturnsTheAlreadyRunningImportInsteadOfStartingASecondOne() {
        UUID id = UUID.randomUUID();
        ProcessingJob active = ProcessingJob.builder()
                .id(id)
                .jobType("IMPORT")
                .mode("RECENT")
                .stage("FETCH_DETAIL")
                .status("RUNNING")
                .attempt(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        when(jobRepository.findUnfinished("IMPORT")).thenReturn(Optional.of(active));

        assertThat(service.create("FULL")).isSameAs(active);
        verify(jobRepository, never()).save(any());
        verify(jobRunner, never()).start(any());
    }

    @Test
    void createReturnsTheScheduledRetryableImportInsteadOfStartingADuplicate() {
        UUID id = UUID.randomUUID();
        ProcessingJob retryable = ProcessingJob.builder()
                .id(id)
                .jobType("IMPORT")
                .mode("POWER_PROVENANCE")
                .stage("REFRESH_PROVENANCE")
                .status("RETRYABLE")
                .attempt(2)
                .retryAt(Instant.now().plusSeconds(300))
                .createdAt(Instant.now().minusSeconds(600))
                .updatedAt(Instant.now())
                .build();
        when(jobRepository.findUnfinished("IMPORT")).thenReturn(Optional.of(retryable));

        assertThat(service.create("FULL")).isSameAs(retryable);
        verify(jobRepository, never()).save(any());
        verify(jobRunner, never()).start(any());
    }

    @Test
    void latestJobCanBeRediscoveredAfterTheClientReloads() {
        ProcessingJob latest = ProcessingJob.builder()
                .id(UUID.randomUUID())
                .jobType("IMPORT")
                .mode("RECENT")
                .stage("COMPLETE")
                .status("COMPLETED")
                .attempt(1)
                .createdAt(Instant.now().minusSeconds(60))
                .updatedAt(Instant.now())
                .build();
        when(jobRepository.findLatest()).thenReturn(Optional.of(latest));

        assertThat(service.latest()).containsSame(latest);
    }

    @Test
    void createsPowerProvenanceBackfillAsAnObservableImportJob() {
        UUID id = UUID.randomUUID();
        when(jobRepository.findUnfinished("IMPORT")).thenReturn(Optional.empty());
        when(jobRepository.save(any())).thenAnswer(invocation ->
                ((ProcessingJob) invocation.getArgument(0)).toBuilder().id(id).build());

        ProcessingJob job = service.create("power_provenance");

        assertThat(job.getMode()).isEqualTo("POWER_PROVENANCE");
        assertThat(job.getStage()).isEqualTo("REFRESH_PROVENANCE");
        verify(jobRunner).start(id);
    }

    @Test
    void resumesDueRateLimitedJobWithoutUserInteraction() {
        UUID id = UUID.randomUUID();
        ProcessingJob retryable = ProcessingJob.builder()
                .id(id)
                .jobType("IMPORT")
                .mode("POWER_PROVENANCE")
                .stage("REFRESH_PROVENANCE")
                .status("RETRYABLE")
                .attempt(1)
                .retryAt(Instant.now().minusSeconds(1))
                .createdAt(Instant.now().minusSeconds(600))
                .updatedAt(Instant.now().minusSeconds(300))
                .build();
        when(jobRepository.findFirstRetryableDue(eq("IMPORT"), any(Instant.class)))
                .thenReturn(Optional.of(retryable));
        when(jobRepository.existsActive("IMPORT")).thenReturn(false);
        when(jobRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        int resumed = service.retryDueJobs();

        assertThat(resumed).isEqualTo(1);
        verify(jobRepository).save(org.mockito.ArgumentMatchers.argThat(job ->
                "QUEUED".equals(job.getStatus()) && job.getRetryAt() == null));
        verify(jobRunner).start(id);
    }
}
