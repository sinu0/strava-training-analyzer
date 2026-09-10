package pl.strava.analizator.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ProcessingJobRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(ProcessingJobRetryScheduler.class);

    private final ImportJobService importJobService;

    @Scheduled(fixedDelayString = "${processing-jobs.retry-poll-ms:30000}")
    public void resumeDueImports() {
        try {
            if (importJobService.retryDueJobs() > 0) {
                log.info("Resumed a rate-limited import after its provider reset time");
            }
        } catch (Exception e) {
            log.warn("Could not resume a due import: {}", e.getMessage());
        }
    }
}
