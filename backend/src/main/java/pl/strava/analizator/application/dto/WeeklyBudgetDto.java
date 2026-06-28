package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyBudgetDto {
    private long optimalTss;
    private long completedTss;
    private long remainingTss;
    private long percentComplete;
    private String status; // OPTIMAL, UNDER, OVER, LOW
    private String weekStart;
    private String weekEnd;
}
