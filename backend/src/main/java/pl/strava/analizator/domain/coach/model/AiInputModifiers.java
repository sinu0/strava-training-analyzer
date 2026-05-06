package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AiInputModifiers {
    private final double readinessAdjustment;
    private final double intensityBias;
    private final double fatigueSensitivity;
    private final Integer maxDurationMinutes;
    private final String preferredType;
    private final String interpretedIntent;
    private final String rawInput;
}
