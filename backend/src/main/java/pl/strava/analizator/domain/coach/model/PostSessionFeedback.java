package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PostSessionFeedback {
    private final int rpe;
    private final String subjectiveFeedback;
    private final double executionQuality;
    private final boolean completed;
    private final double actualTss;
    private final double actualDurationMinutes;
    private final String plannedType;
}
