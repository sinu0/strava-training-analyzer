package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class TrainingPlan {
    private final UUID id;
    private final LocalDate date;
    private final String plannedType;
    private final BigDecimal plannedTss;
    private final Integer plannedDurationMin;
    private final String plannedDescription;
    private final UUID actualActivityId;
    private final BigDecimal compliancePct;
    private final UUID programId;
    private final UUID workoutTemplateId;
    private final UUID workoutTemplateRevisionId;
    private final Integer workoutTemplateRevision;
    private final String workoutNameSnapshot;
    private final List<WorkoutStep> workoutStepsSnapshot;
    private final Integer ftpWatts;
    private final Integer lthrBpm;
    private final Integer maxHrBpm;
    private final Integer restingHrBpm;
    private final String deliveryMethod;
    private final String deliveryStatus;
    private final String activityMatchStatus;
    private final Integer targetPowerLowW;
    private final Integer targetPowerHighW;
    private final TrainingPlanStatus status;
    private final String notes;
    private final OffsetDateTime createdAt;
}
