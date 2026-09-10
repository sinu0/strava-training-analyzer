package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
class ImportJobRunnerTest {

    @Mock private ProcessingJobRepository jobRepository;
    @Mock private SyncService syncService;

    private ImportJobRunner runner;
    private ProcessingJob current;
    private List<ProcessingJob> saved;

    @BeforeEach
    void setUp() {
        runner = new ImportJobRunner(jobRepository, syncService);
        current = ProcessingJob.builder()
                .id(UUID.randomUUID())
                .jobType("IMPORT")
                .mode("RECENT")
                .stage("FETCH_SUMMARY")
                .status("QUEUED")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        saved = new ArrayList<>();
        when(jobRepository.findById(current.getId())).thenAnswer(invocation -> Optional.of(current));
        when(jobRepository.save(any())).thenAnswer(invocation -> {
            current = invocation.getArgument(0);
            saved.add(current);
            return current;
        });
    }

    @Test
    void runnerPersistsStagesAndCompletion() {
        when(syncService.syncRecent(any())).thenAnswer(invocation -> {
            SyncService.SyncProgressListener listener = invocation.getArgument(0);
            listener.onStage(SyncService.SyncStage.FETCH_DETAIL);
            listener.onStage(SyncService.SyncStage.COMPLETE);
            return new SyncService.SyncStatus("completed", Instant.now(), 1, 0, null);
        });

        runner.start(current.getId());

        assertThat(saved).extracting(ProcessingJob::getStage)
                .contains("FETCH_DETAIL", "COMPLETE");
        assertThat(current.getStatus()).isEqualTo("COMPLETED");
        assertThat(current.getAttempt()).isEqualTo(1);
    }

    @Test
    void runnerDispatchesPowerProvenanceBackfill() {
        current = current.toBuilder().mode("POWER_PROVENANCE").stage("REFRESH_PROVENANCE").build();
        when(syncService.resyncPowerProvenance(any())).thenReturn(
                new SyncService.SyncStatus("completed", Instant.now(), 7, 3, null));

        runner.start(current.getId());

        assertThat(current.getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    void runnerPersistsProviderResetAsAutomaticRetryTime() {
        Instant retryAt = Instant.now().plusSeconds(900);
        when(syncService.syncRecent(any())).thenReturn(
                new SyncService.SyncStatus("rate_limited", Instant.now(), 99, 1, retryAt));

        runner.start(current.getId());

        assertThat(current.getStatus()).isEqualTo("RETRYABLE");
        assertThat(current.getRetryAt()).isEqualTo(retryAt);
    }
}
