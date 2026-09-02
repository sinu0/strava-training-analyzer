package pl.strava.analizator.domain.port;

import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.ProcessingJob;

public interface ProcessingJobRepository {

    ProcessingJob save(ProcessingJob job);

    Optional<ProcessingJob> findById(UUID id);

    Optional<ProcessingJob> findActive(String jobType);

    boolean existsActive(String jobType);
}
