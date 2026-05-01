package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdaptiveTrainingRequest {
    private List<PlannedWorkoutDto> plannedWorkouts;
    private List<RecentWorkoutDto> recentWorkouts;
    private TrainingLoadStateDto trainingLoad;
    private FatigueSignalsDto fatigueSignals;
    private ProgressionStateDto progressionState;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlannedWorkoutDto {
        private String type;
        private Integer targetPower;
        private Integer duration;
        private Integer intervals;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentWorkoutDto {
        private String outcome;
        private int score;
        private String workoutType;
        private String fatigueDrift;
        private String hrResponse;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrainingLoadStateDto {
        private BigDecimal ctl;
        private BigDecimal atl;
        private BigDecimal tsb;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FatigueSignalsDto {
        private String hrvTrend;
        private String restingHrTrend;
        private String sleepQuality;
        private int subjectiveReadiness;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgressionStateDto {
        private int vo2Level;
        private int thresholdLevel;
        private int enduranceLevel;
        private String recentIntensityDistribution;
    }
}
