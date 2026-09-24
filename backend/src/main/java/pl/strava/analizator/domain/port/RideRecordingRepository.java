package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.UUID;

import pl.strava.analizator.domain.model.RideSample;

public interface RideRecordingRepository {
    /** Stores or replaces one chunk; retries with the same index are idempotent. */
    void saveChunk(UUID executionId, int chunkIndex, List<RideSample> samples);

    /** All samples of an execution in recording order. */
    List<RideSample> findByExecution(UUID executionId);
}
