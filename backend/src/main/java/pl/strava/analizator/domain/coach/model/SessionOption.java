package pl.strava.analizator.domain.coach.model;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SessionOption {
    private final String type;
    private final int durationMinutes;
    private final double targetTss;
    private final double intensityFactor;
    private final String difficulty;
    private final String description;
    private final boolean indoor;
    private final double score;
    private final Map<String, Double> scoreBreakdown;
}
