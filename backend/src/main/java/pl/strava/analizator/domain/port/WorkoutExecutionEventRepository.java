package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.WorkoutExecutionEvent;

public interface WorkoutExecutionEventRepository {
    boolean hasTimelineChanges(UUID executionId);
    List<WorkoutExecutionEvent> findByExecutionIdOrderBySequenceNo(UUID executionId);
    Optional<WorkoutExecutionEvent> findByExecutionIdAndIdempotencyKey(UUID executionId, String key);
    int nextSequence(UUID executionId);
    WorkoutExecutionEvent save(WorkoutExecutionEvent event);
}
