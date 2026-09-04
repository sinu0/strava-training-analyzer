package pl.strava.analizator.application.dto;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FinishWorkoutExecutionRequest {
    private String idempotencyKey;
    private Instant occurredAt;
}
