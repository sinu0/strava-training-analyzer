package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.util.List;

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
public class WeightOverviewDto {

    private BigDecimal currentWeightKg;
    private WeightGoalDto goal;
    private BigDecimal dailyCaloricNeed;
    private BigDecimal dailyDeficitOrSurplus;
    private BigDecimal weeksRemaining;
    private List<WeightRecordDto> history;
    private BigDecimal weeklyTrainingCalories;
    private BigDecimal adjustedDailyTdee;
    private BigDecimal recommendedDailyCalories;
    private BigDecimal weeklyWeightChange;
    private String dataConfidence;
}
