package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdaptiveTrainingResponse {
    private List<WorkoutAdjustmentDto> adjustments;
    private StrategyDto strategy;
    private List<String> warnings;
    private String insight;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkoutAdjustmentDto {
        private String day;
        private String action;
        private String reason;
        private NewWorkoutDto newWorkout;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NewWorkoutDto {
        private String type;
        private String intensityAdjustment;
        private String volumeAdjustment;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StrategyDto {
        private String fatigueState;
        private String performanceTrend;
        private String progressionAction;
    }
}
