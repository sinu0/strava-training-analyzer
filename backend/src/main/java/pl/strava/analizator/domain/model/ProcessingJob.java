package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
public class ProcessingJob {

    private UUID id;
    private String jobType;
    private String mode;
    private String stage;
    private String status;
    private int attempt;
    private String errorMessage;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
    private Instant updatedAt;
}
