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
public class DailyDecisionDto {

    private String decision;        // RIDE, MODIFY, SKIP, INDOOR
    private WorkoutSuggestionDto workout;
    private ConfidenceScoreDto confidence;
    private String risk;            // LOW, MODERATE, HIGH, CRITICAL
    private List<DecisionReasonDto> reasons;
    private List<AlternativeOptionDto> alternatives;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkoutSuggestionDto {
        private String type;
        private int durationMin;
        private int targetTss;
        private String difficulty;
        private String intensityDescription;
        private String description;
        private boolean indoor;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfidenceScoreDto {
        private double score;
        private String label;
        private String description;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionReasonDto {
        private String priority;
        private String signal;
        private String message;
        private String evidence;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlternativeOptionDto {
        private String label;
        private String type;
        private WorkoutSuggestionDto workout;
        private String rationale;
    }
}
