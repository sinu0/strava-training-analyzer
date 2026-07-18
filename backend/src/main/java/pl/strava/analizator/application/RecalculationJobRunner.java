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
public class RecalculationJobRunner {
    private final ProcessingJobRepository jobRepository;
    private final SyncService syncService;
    private final DailyMetricsService dailyMetricsService;

    @Async
    public void start(UUID jobId) {
        ProcessingJob current = jobRepository.findById(jobId)
                .orElseThrow(() -> new ProcessingJobNotFoundException("Processing job not found: " + jobId));
        current = jobRepository.save(current.toBuilder().status("RUNNING")
                .attempt(current.getAttempt() + 1).startedAt(Instant.now()).updatedAt(Instant.now()).build());
        try {
            syncService.recalculateAllActivityMetrics();
            current = jobRepository.save(current.toBuilder()
                    .stage(SyncService.SyncStage.UPDATE_DAILY.name()).updatedAt(Instant.now()).build());
            dailyMetricsService.recalculateAll();
            jobRepository.save(current.toBuilder().stage(SyncService.SyncStage.COMPLETE.name())
                    .status("COMPLETED").completedAt(Instant.now()).updatedAt(Instant.now()).build());
        } catch (Exception exception) {
            String message = exception.getMessage() != null ? exception.getMessage() : "Unknown recalculation error";
            jobRepository.save(current.toBuilder().status("FAILED")
                    .errorMessage(message.length() <= 4000 ? message : message.substring(0, 4000))
                    .completedAt(Instant.now()).updatedAt(Instant.now()).build());
        }
    }
}
