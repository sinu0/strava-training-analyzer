package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingPriorityDto {
    private int rank;
    private String title;
    private String subsystem;
    private int weeklyHours;
    private int impactScore;
    private String rationale;
    private String action;
    private String metricsSummary;
}
