package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
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
    private final Integer targetPowerLowW;
    private final Integer targetPowerHighW;
    private final TrainingPlanStatus status;
    private final String notes;
    private final OffsetDateTime createdAt;
}
