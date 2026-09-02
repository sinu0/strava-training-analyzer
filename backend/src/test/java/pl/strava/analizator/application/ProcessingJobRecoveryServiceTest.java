package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.ProcessingJob;
import pl.strava.analizator.domain.port.ProcessingJobRepository;

@ExtendWith(MockitoExtension.class)
class ProcessingJobRecoveryServiceTest {

    @Mock private ProcessingJobRepository jobRepository;

    @Test
    void startupMarksInterruptedImportAsFailedSoItCannotBlockFutureSyncs() {
        ProcessingJob interrupted = ProcessingJob.builder()
                .id(UUID.randomUUID()).jobType("IMPORT").mode("RECENT")
                .stage("FETCH_DETAIL").status("RUNNING").attempt(1)
                .createdAt(Instant.now().minusSeconds(300)).updatedAt(Instant.now().minusSeconds(300))
                .build();
        when(jobRepository.findActive("IMPORT")).thenReturn(Optional.of(interrupted));
        when(jobRepository.findActive("RECALCULATION")).thenReturn(Optional.empty());
        ProcessingJobRecoveryService service = new ProcessingJobRecoveryService(jobRepository);

        service.recoverInterruptedJobs();

        ArgumentCaptor<ProcessingJob> recovered = ArgumentCaptor.forClass(ProcessingJob.class);
        verify(jobRepository).save(recovered.capture());
        assertThat(recovered.getValue().getStatus()).isEqualTo("FAILED");
        assertThat(recovered.getValue().getErrorMessage()).contains("restart");
        assertThat(recovered.getValue().getCompletedAt()).isNotNull();
    }
}
