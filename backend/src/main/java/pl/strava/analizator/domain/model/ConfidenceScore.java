package pl.strava.analizator.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ConfidenceScore {
    private final double score;      // 0.0 - 1.0
    private final String label;      // "HIGH", "MEDIUM", "LOW", "VERY_HIGH", "VERY_LOW"
    private final String description;
}
