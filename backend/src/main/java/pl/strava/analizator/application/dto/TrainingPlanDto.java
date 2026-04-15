package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import pl.strava.analizator.domain.model.TrainingPlan;

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
    private String workoutTemplateName;
    private Integer targetPowerLowW;
    private Integer targetPowerHighW;
    private String status;
    private String notes;
    private OffsetDateTime createdAt;

    public static TrainingPlanDto fromDomain(TrainingPlan plan, String workoutTemplateName) {
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
                .workoutTemplateName(workoutTemplateName)
                .targetPowerLowW(plan.getTargetPowerLowW())
                .targetPowerHighW(plan.getTargetPowerHighW())
                .status(plan.getStatus().name())
                .notes(plan.getNotes())
                .createdAt(plan.getCreatedAt())
                .build();
    }
}
