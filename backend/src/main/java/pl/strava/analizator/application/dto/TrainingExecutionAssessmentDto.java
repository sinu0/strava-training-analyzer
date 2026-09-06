package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingExecutionAssessmentDto {
    private String outcome;
    private String label;
    private String description;
    private Integer score;
    private String availability;
    private String algorithmVersion;
    private Double tssCompliance;
    private Double durationCompliance;
    private Double intervalCompliance;
    private Double zoneCompliance;
    private boolean stimulusMatch;
    private String primaryLimiter;
    private String nextDayAdvice;
}
