package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
        when(jobRepository.existsActive("IMPORT")).thenReturn(false);
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
    void createRejectsConcurrentImportJob() {
        when(jobRepository.existsActive("IMPORT")).thenReturn(true);

        assertThatThrownBy(() -> service.create("FULL"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already running");
    }
}
