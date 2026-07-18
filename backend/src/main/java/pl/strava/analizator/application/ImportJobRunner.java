package pl.strava.analizator.application;

import java.time.Instant;
import java.util.UUID;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ProcessingJob;
import pl.strava.analizator.domain.port.ProcessingJobRepository;

@Service
@RequiredArgsConstructor
public class ImportJobRunner {

    private final ProcessingJobRepository jobRepository;
    private final SyncService syncService;

    @Async
    public void start(UUID jobId) {
        ProcessingJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ProcessingJobNotFoundException("Processing job not found: " + jobId));
        Instant now = Instant.now();
        job = jobRepository.save(job.toBuilder()
                .status("RUNNING")
                .attempt(job.getAttempt() + 1)
                .startedAt(now)
                .completedAt(null)
                .errorMessage(null)
                .updatedAt(now)
                .build());

        try {
            SyncService.SyncStatus result = "FULL".equals(job.getMode())
                    ? syncService.syncFull(stage -> updateStage(jobId, stage))
                    : syncService.syncRecent(stage -> updateStage(jobId, stage));
            boolean retryable = "rate_limited".equals(result.status());
            updateTerminal(jobId, retryable ? "RETRYABLE" : "COMPLETED", null);
        } catch (Exception exception) {
            updateTerminal(jobId, "FAILED", abbreviate(exception.getMessage()));
        }
    }

    private void updateStage(UUID jobId, SyncService.SyncStage stage) {
        jobRepository.findById(jobId).ifPresent(current -> jobRepository.save(current.toBuilder()
                .stage(stage.name())
                .updatedAt(Instant.now())
                .build()));
    }

    private void updateTerminal(UUID jobId, String status, String errorMessage) {
        jobRepository.findById(jobId).ifPresent(current -> jobRepository.save(current.toBuilder()
                .status(status)
                .errorMessage(errorMessage)
                .completedAt(Instant.now())
                .updatedAt(Instant.now())
                .build()));
    }

    private String abbreviate(String message) {
        if (message == null || message.isBlank()) {
            return "Unknown import error";
        }
        return message.length() <= 4000 ? message : message.substring(0, 4000);
    }
}
