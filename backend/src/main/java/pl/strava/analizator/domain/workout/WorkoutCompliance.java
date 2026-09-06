package pl.strava.analizator.domain.workout;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class WorkoutCompliance {
    private final String availability;
    private final Integer score;
    private final Double coverage;
    private final String reason;
    @Builder.Default private final String algorithmVersion = WorkoutComplianceEvaluator.VERSION;
}
