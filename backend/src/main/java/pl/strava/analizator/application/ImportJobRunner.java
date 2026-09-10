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
                .retryAt(null)
                .errorMessage(null)
                .updatedAt(now)
                .build());

        try {
            SyncService.SyncProgressListener progress = stage -> updateStage(jobId, stage);
            SyncService.SyncStatus result = switch (job.getMode()) {
                case "FULL" -> syncService.syncFull(progress);
                case "POWER_PROVENANCE" -> syncService.resyncPowerProvenance(progress);
                default -> syncService.syncRecent(progress);
            };
            boolean retryable = "rate_limited".equals(result.status());
            Instant retryAt = retryable && result.rateLimitResetsAt() != null
                    ? result.rateLimitResetsAt()
                    : retryable ? Instant.now().plusSeconds(900) : null;
            updateTerminal(
                    jobId,
                    retryable ? "RETRYABLE" : "COMPLETED",
                    null,
                    retryAt);
        } catch (Exception exception) {
            updateTerminal(jobId, "FAILED", abbreviate(exception.getMessage()), null);
        }
    }

    private void updateStage(UUID jobId, SyncService.SyncStage stage) {
        jobRepository.findById(jobId).ifPresent(current -> jobRepository.save(current.toBuilder()
                .stage(stage.name())
                .updatedAt(Instant.now())
                .build()));
    }

    private void updateTerminal(UUID jobId, String status, String errorMessage, Instant retryAt) {
        jobRepository.findById(jobId).ifPresent(current -> jobRepository.save(current.toBuilder()
                .status(status)
                .errorMessage(errorMessage)
                .retryAt(retryAt)
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
