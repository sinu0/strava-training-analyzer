package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.WorkoutStep;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingPlanDto {
    private UUID id;
    private LocalDate date;
    private String plannedType;
    private BigDecimal plannedTss;
    private Integer plannedDurationMin;
    private String plannedDescription;
    private UUID actualActivityId;
    private BigDecimal compliancePct;
    private UUID programId;
    private UUID workoutTemplateId;
    private UUID workoutTemplateRevisionId;
    private Integer workoutTemplateRevision;
    private String workoutTemplateName;
    private List<WorkoutStep> workoutStepsSnapshot;
    private Integer ftpWatts;
    private Integer lthrBpm;
    private Integer maxHrBpm;
    private Integer restingHrBpm;
    private String deliveryMethod;
    private String deliveryStatus;
    private String activityMatchStatus;
    private Integer targetPowerLowW;
    private Integer targetPowerHighW;
    private String sessionRole;
    private String status;
    private String notes;
    private OffsetDateTime createdAt;

    public static TrainingPlanDto fromDomain(TrainingPlan plan, String workoutTemplateName, String sessionRole) {
        return TrainingPlanDto.builder()
                .id(plan.getId())
                .date(plan.getDate())
                .plannedType(plan.getPlannedType())
                .plannedTss(plan.getPlannedTss())
                .plannedDurationMin(plan.getPlannedDurationMin())
                .plannedDescription(plan.getPlannedDescription())
                .actualActivityId(plan.getActualActivityId())
                .compliancePct(plan.getCompliancePct())
                .programId(plan.getProgramId())
                .workoutTemplateId(plan.getWorkoutTemplateId())
                .workoutTemplateRevisionId(plan.getWorkoutTemplateRevisionId())
                .workoutTemplateRevision(plan.getWorkoutTemplateRevision())
                .workoutTemplateName(workoutTemplateName)
                .workoutStepsSnapshot(plan.getWorkoutStepsSnapshot())
                .ftpWatts(plan.getFtpWatts())
                .lthrBpm(plan.getLthrBpm())
                .maxHrBpm(plan.getMaxHrBpm())
                .restingHrBpm(plan.getRestingHrBpm())
                .deliveryMethod(plan.getDeliveryMethod())
                .deliveryStatus(plan.getDeliveryStatus())
                .activityMatchStatus(plan.getActivityMatchStatus())
                .targetPowerLowW(plan.getTargetPowerLowW())
                .targetPowerHighW(plan.getTargetPowerHighW())
                .sessionRole(sessionRole)
                .status(plan.getStatus().name())
                .notes(plan.getNotes())
                .createdAt(plan.getCreatedAt())
                .build();
    }
}
