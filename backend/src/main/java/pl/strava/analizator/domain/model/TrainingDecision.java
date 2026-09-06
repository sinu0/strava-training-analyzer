package pl.strava.analizator.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class TrainingDecision {
    private final LocalDate asOf;
    private final String decision;
    private final String sessionType;
    private final Integer durationMinutes;
    private final Double targetTss;
    private final String confidence;
    private final String description;
    private final UUID plannedWorkoutId;
    private final List<String> reasons;
    @Builder.Default private final String algorithmVersion = TrainingDecisionEngine.VERSION;
}
