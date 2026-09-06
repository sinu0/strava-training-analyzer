package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.WorkoutExecution;

public interface WorkoutExecutionRepository {
    Optional<WorkoutExecution> findById(UUID id);
    Optional<WorkoutExecution> findByStartIdempotencyKey(String key);
    Optional<WorkoutExecution> findByFinishIdempotencyKey(String key);
    Optional<WorkoutExecution> findActive();
    Optional<WorkoutExecution> findLatestByScheduledWorkoutId(UUID id);
    List<WorkoutExecution> findCompletedWithoutActivity();
    WorkoutExecution save(WorkoutExecution execution);
}
