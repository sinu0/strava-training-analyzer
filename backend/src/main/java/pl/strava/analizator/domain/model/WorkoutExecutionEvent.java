package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WorkoutExecutionEvent {
    private final UUID id;
    private final UUID executionId;
    private final int sequenceNo;
    private final String eventType;
    private final Instant occurredAt;
    private final long workoutElapsedMs;
    private final Integer stepIndex;
    private final String payload;
    private final String idempotencyKey;
    private final Instant createdAt;
}
