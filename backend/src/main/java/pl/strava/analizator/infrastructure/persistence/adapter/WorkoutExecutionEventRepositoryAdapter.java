package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutExecutionEvent;
import pl.strava.analizator.domain.port.WorkoutExecutionEventRepository;
import pl.strava.analizator.infrastructure.persistence.entity.WorkoutExecutionEventEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.WorkoutExecutionEventJpaRepository;

@Component
@RequiredArgsConstructor
public class WorkoutExecutionEventRepositoryAdapter implements WorkoutExecutionEventRepository {
    private final WorkoutExecutionEventJpaRepository repository;

    public boolean hasTimelineChanges(UUID executionId) {
        return repository.existsByExecutionIdAndEventTypeIn(executionId,
                java.util.List.of("PAUSE", "INTENSITY", "SKIP_STEP", "PREVIOUS_STEP", "REPEAT_STEP", "LAP"));
    }

    public Optional<WorkoutExecutionEvent> findByExecutionIdAndIdempotencyKey(UUID executionId, String key) {
        return repository.findByExecutionIdAndIdempotencyKey(executionId, key).map(this::toDomain);
    }
    public int nextSequence(UUID executionId) { return repository.nextSequence(executionId); }
    public WorkoutExecutionEvent save(WorkoutExecutionEvent event) {
        return toDomain(repository.save(WorkoutExecutionEventEntity.builder()
                .id(event.getId()).executionId(event.getExecutionId()).sequenceNo(event.getSequenceNo())
                .eventType(event.getEventType()).occurredAt(event.getOccurredAt())
                .workoutElapsedMs(event.getWorkoutElapsedMs()).stepIndex(event.getStepIndex())
                .payload(event.getPayload() != null ? event.getPayload() : "{}")
                .idempotencyKey(event.getIdempotencyKey()).createdAt(event.getCreatedAt()).build()));
    }
    private WorkoutExecutionEvent toDomain(WorkoutExecutionEventEntity entity) {
        return WorkoutExecutionEvent.builder().id(entity.getId()).executionId(entity.getExecutionId())
                .sequenceNo(entity.getSequenceNo()).eventType(entity.getEventType())
                .occurredAt(entity.getOccurredAt()).workoutElapsedMs(entity.getWorkoutElapsedMs())
                .stepIndex(entity.getStepIndex()).payload(entity.getPayload())
                .idempotencyKey(entity.getIdempotencyKey()).createdAt(entity.getCreatedAt()).build();
    }
}
