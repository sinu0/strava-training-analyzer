package pl.strava.analizator.domain.ai;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Domain model for an AI-generated coaching note attached to a single activity.
 */
@Getter
@Builder
@AllArgsConstructor
public class AiActivityNote {

    private UUID id;
    private UUID activityId;
    private String summary;
    private String detail;
    private String modelId;
    private String providerName;
    private Instant generatedAt;
}
