package pl.strava.analizator.application;

import java.time.Instant;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ProcessingJob;
import pl.strava.analizator.domain.port.ProcessingJobRepository;

@Service
@RequiredArgsConstructor
public class RecalculationJobService {
    private final ProcessingJobRepository jobRepository;
    private final RecalculationJobRunner jobRunner;

    public synchronized ProcessingJob create() {
        if (jobRepository.existsActive("RECALCULATION")) {
            throw new IllegalStateException("A recalculation job is already running");
        }
        Instant now = Instant.now();
        ProcessingJob job = jobRepository.save(ProcessingJob.builder()
                .jobType("RECALCULATION").mode("ALL")
                .stage(SyncService.SyncStage.CALCULATE_METRICS.name())
                .status("QUEUED").createdAt(now).updatedAt(now).build());
        jobRunner.start(job.getId());
        return job;
    }
}
