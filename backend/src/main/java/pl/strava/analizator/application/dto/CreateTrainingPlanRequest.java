package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTrainingPlanRequest {
    private LocalDate date;
    private UUID workoutTemplateId;
    private String plannedType;
    private BigDecimal plannedTss;
    private Integer plannedDurationMin;
    private String plannedDescription;
    private UUID programId;
    private String notes;
}
