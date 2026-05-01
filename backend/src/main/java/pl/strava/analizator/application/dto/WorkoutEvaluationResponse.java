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
public class WorkoutEvaluationResponse {
    private String outcome;
    private int score;
    private double confidence;
    private List<String> reasons;
    private WorkoutAnalysis analysis;
    private ContextualFactors contextualFactors;
    private String insight;
    private String recommendation;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkoutAnalysis {
        private int powerCompliance;
        private int intervalCompletion;
        private int timeInZoneAccuracy;
        private String hrResponse;
        private String fatigueDrift;
        private String executionStability;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContextualFactors {
        private String fatigueState;
        private boolean recentFailures;
        private String trainingLoadTrend;
    }
}
