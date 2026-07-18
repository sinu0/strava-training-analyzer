package pl.strava.analizator.application;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ProcessingJob;
import pl.strava.analizator.domain.port.ProcessingJobRepository;

@Service
@RequiredArgsConstructor
public class ImportJobService {

    private final ProcessingJobRepository jobRepository;
    private final ImportJobRunner jobRunner;

    public synchronized ProcessingJob create(String requestedMode) {
        if (jobRepository.existsActive("IMPORT")) {
            throw new IllegalStateException("An import job is already running");
        }

        String mode = normalizeMode(requestedMode);
        Instant now = Instant.now();
        ProcessingJob job = jobRepository.save(ProcessingJob.builder()
                .jobType("IMPORT")
                .mode(mode)
                .stage(SyncService.SyncStage.FETCH_SUMMARY.name())
                .status("QUEUED")
                .attempt(0)
                .createdAt(now)
                .updatedAt(now)
                .build());
        jobRunner.start(job.getId());
        return job;
    }

    public ProcessingJob get(UUID id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ProcessingJobNotFoundException("Processing job not found: " + id));
    }

    public synchronized ProcessingJob retry(UUID id) {
        ProcessingJob current = get(id);
        if (!"FAILED".equals(current.getStatus()) && !"RETRYABLE".equals(current.getStatus())) {
            throw new IllegalStateException("Only failed or retryable jobs can be retried");
        }
        if (jobRepository.existsActive(current.getJobType())) {
            throw new IllegalStateException("Another import job is already running");
        }

        ProcessingJob queued = jobRepository.save(current.toBuilder()
                .status("QUEUED")
                .errorMessage(null)
                .completedAt(null)
                .updatedAt(Instant.now())
                .build());
        jobRunner.start(queued.getId());
        return queued;
    }

    private String normalizeMode(String requestedMode) {
        String mode = requestedMode == null || requestedMode.isBlank()
                ? "RECENT"
                : requestedMode.trim().toUpperCase(Locale.ROOT);
        if (!"RECENT".equals(mode) && !"FULL".equals(mode)) {
            throw new IllegalArgumentException("Import mode must be RECENT or FULL");
        }
        return mode;
    }
}
