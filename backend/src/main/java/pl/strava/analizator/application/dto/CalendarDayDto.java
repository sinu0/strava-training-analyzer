package pl.strava.analizator.application.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarDayDto {
    private LocalDate date;
    private TrainingPlanDto planned;
    private CalendarActivitySummaryDto actual;
    private Double compliance;
    private TrainingExecutionAssessmentDto execution;
    private TrainingDayProjectionDto projection;
    private TrainingAdjustmentSuggestionDto adjustment;
}
