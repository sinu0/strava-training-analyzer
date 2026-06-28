package pl.strava.analizator.application.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponseV2Dto {

    private String id;
    private String type;
    private String modelId;
    private String providerName;
    private String summary;
    private String insight;
    private String action;
    private Map<String, String> metrics;
    private double confidence;
    private ConfidenceBreakdownDto confidenceBreakdown;
    private String reasoning;
    private List<String> warnings;
    private List<AlternativeScenarioDto> alternatives;
    private List<String> references;
    private StructuredWorkoutDto structuredWorkout;
    private List<ToolCallLogDto> toolCallLog;
    private long tokensUsed;
    private long durationMs;
    private OffsetDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfidenceBreakdownDto {
        private double dataQuality;
        private double trendClarity;
        private double modelCertainty;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlternativeScenarioDto {
        private String scenario;
        private String action;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolCallLogDto {
        private String toolName;
        private Map<String, Object> arguments;
        private String resultSummary;
        private long durationMs;
        private boolean error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StructuredWorkoutDto {
        private String type;
        private int totalDurationMin;
        private List<WorkoutIntervalDto> intervals;
        private String warmupDescription;
        private String cooldownDescription;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkoutIntervalDto {
        private int durationSec;
        private String powerTarget;
        private String cadence;
        private String description;
    }
}
