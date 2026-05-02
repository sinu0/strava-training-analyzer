package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AlternativeOption {
    private final String label;         // "Shorter version", "Easier version", "Indoor version"
    private final DecisionType type;    // MODIFY, INDOOR
    private final WorkoutSuggestion workout;
    private final String rationale;
}
