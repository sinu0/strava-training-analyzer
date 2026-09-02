package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
        when(jobRepository.findActive("IMPORT")).thenReturn(Optional.empty());
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
        when(jobRepository.findActive("IMPORT")).thenReturn(Optional.of(active));

        assertThat(service.create("FULL")).isSameAs(active);
        verify(jobRepository, never()).save(any());
        verify(jobRunner, never()).start(any());
    }
}
