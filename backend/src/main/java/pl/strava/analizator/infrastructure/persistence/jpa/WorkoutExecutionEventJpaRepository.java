package pl.strava.analizator.infrastructure.persistence.jpa;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import pl.strava.analizator.infrastructure.persistence.entity.WorkoutExecutionEventEntity;

public interface WorkoutExecutionEventJpaRepository extends JpaRepository<WorkoutExecutionEventEntity, UUID> {
    boolean existsByExecutionIdAndEventTypeIn(UUID executionId, java.util.List<String> eventTypes);
    Optional<WorkoutExecutionEventEntity> findByExecutionIdAndIdempotencyKey(UUID executionId, String key);

    @Query("select coalesce(max(e.sequenceNo), 0) + 1 from WorkoutExecutionEventEntity e where e.executionId = :executionId")
    int nextSequence(UUID executionId);
}
