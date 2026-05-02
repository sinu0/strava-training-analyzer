package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class WorkoutSuggestion {
    private final String type;          // ENDURANCE, RECOVERY, TEMPO, THRESHOLD, VO2MAX, etc.
    private final int durationMin;
    private final int targetTss;
    private final String difficulty;    // EASY, MODERATE, HARD
    private final String intensityDescription;
    private final String description;
    private final boolean isIndoor;
}
