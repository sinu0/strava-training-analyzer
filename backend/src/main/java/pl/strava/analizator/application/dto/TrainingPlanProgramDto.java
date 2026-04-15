package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import pl.strava.analizator.domain.model.TrainingPlanProgram;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingPlanProgramDto {
    private UUID id;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal targetWeeklyTss;
    private BigDecimal targetWeeklyHours;
    private String generatedBy;
    private OffsetDateTime createdAt;

    public static TrainingPlanProgramDto fromDomain(TrainingPlanProgram p) {
        return TrainingPlanProgramDto.builder()
                .id(p.getId())
                .name(p.getName())
                .goal(p.getGoal().name())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .targetWeeklyTss(p.getTargetWeeklyTss())
                .targetWeeklyHours(p.getTargetWeeklyHours())
                .generatedBy(p.getGeneratedBy())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
