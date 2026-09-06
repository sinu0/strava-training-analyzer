package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class CoachingFeedback {
    private final UUID id;
    private final String sourceKey;
    private final Instant occurredAt;
    private final String sessionType;
    private final Integer rpe;
    private final Double quality;
    private final boolean completed;
}
