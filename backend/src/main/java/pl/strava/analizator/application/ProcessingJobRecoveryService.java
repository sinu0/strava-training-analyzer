package pl.strava.analizator.application;

import java.time.Instant;
import java.util.List;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ProcessingJob;
import pl.strava.analizator.domain.port.ProcessingJobRepository;

@Component
@RequiredArgsConstructor
public class ProcessingJobRecoveryService {

    private static final Logger log = LoggerFactory.getLogger(ProcessingJobRecoveryService.class);
    private static final List<String> JOB_TYPES = List.of("IMPORT", "RECALCULATION");

    private final ProcessingJobRepository jobRepository;

    @PostConstruct
    public void recoverInterruptedJobs() {
        JOB_TYPES.forEach(jobType -> jobRepository.findActive(jobType).ifPresent(this::markInterrupted));
    }

    private void markInterrupted(ProcessingJob job) {
        Instant now = Instant.now();
        jobRepository.save(job.toBuilder()
                .status("FAILED")
                .errorMessage("Job interrupted by application restart; it can be safely retried")
                .completedAt(now)
                .updatedAt(now)
                .build());
        log.warn("Recovered interrupted {} job {} from stage {}", job.getJobType(), job.getId(), job.getStage());
    }
}
