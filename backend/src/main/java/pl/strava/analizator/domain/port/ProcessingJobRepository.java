package pl.strava.analizator.domain.port;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.ProcessingJob;

public interface ProcessingJobRepository {

    ProcessingJob save(ProcessingJob job);

    Optional<ProcessingJob> findById(UUID id);

    Optional<ProcessingJob> findActive(String jobType);

    Optional<ProcessingJob> findUnfinished(String jobType);

    Optional<ProcessingJob> findLatest();

    Optional<ProcessingJob> findFirstRetryableDue(String jobType, Instant now);

    boolean existsActive(String jobType);
}
