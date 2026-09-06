package pl.strava.analizator.domain.port;

import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.WorkoutExecutionEvent;

public interface WorkoutExecutionEventRepository {
    boolean hasTimelineChanges(UUID executionId);
    Optional<WorkoutExecutionEvent> findByExecutionIdAndIdempotencyKey(UUID executionId, String key);
    int nextSequence(UUID executionId);
    WorkoutExecutionEvent save(WorkoutExecutionEvent event);
}
