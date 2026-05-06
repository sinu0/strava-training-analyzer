package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AdaptationComponent {
    private final String name;
    private final double weight;
    private final double currentLevel;
    private final double targetLevel;
    private final String description;
}
