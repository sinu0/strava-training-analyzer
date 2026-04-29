package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingGoalScorecardDto {
    private LocalDate weekStart;
    private LocalDate weekEnd;
    private String label;
    private BigDecimal plannedTss;
    private BigDecimal actualTss;
    private int plannedQualityDays;
    private int completedQualityDays;
    private String goalFocusLabel;
    private String goalFocusRole;
    private int plannedGoalSessions;
    private int completedGoalSessions;
    private Integer goalExecutionScore;
    private String goalExecutionStatus;
    private Integer avgExecutionScore;
    private boolean onTrack;
}
