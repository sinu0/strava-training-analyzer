package pl.strava.analizator.domain.ai;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Domain model for a background job that generates an AI activity note.
 */
@Getter
@Builder
@AllArgsConstructor
public class AiNoteJob {

    private UUID id;
    private UUID activityId;
    private String status;
    private Instant createdAt;
    private Instant startedAt;
    private Instant completedAt;
    private String errorMessage;
    private int retryCount;

    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_PROCESSING = "processing";
    public static final String STATUS_COMPLETED = "completed";
    public static final String STATUS_FAILED = "failed";
    public static final int MAX_RETRIES = 3;
}
