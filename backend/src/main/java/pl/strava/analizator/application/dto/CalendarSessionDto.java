package pl.strava.analizator.application.dto;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class CalendarSessionDto {
    private TrainingPlanDto planned;
    private CalendarActivitySummaryDto actual;
    private Double compliance;
    private TrainingExecutionAssessmentDto execution;
}
