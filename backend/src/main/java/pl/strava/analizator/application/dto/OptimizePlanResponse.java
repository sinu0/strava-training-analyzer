package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizePlanResponse {
    private List<PlanResultDto> plans;
    private List<String> loadSummary;
    private List<String> constraintViolations;
    private PlanStrategyDto strategy;
    private int confidence;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanResultDto {
        private String type;
        private double score;
        private double adaptationGain;
        private double fatigueCost;
        private BigDecimal estimatedTss;
        private IntensityDistributionDto intensityDistribution;
        private List<OptimizedSessionDto> sessions;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptimizedSessionDto {
        private LocalDate day;
        private String type;
        private int durationMinutes;
        private String intensity;
        private BigDecimal tss;
        private String goal;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntensityDistributionDto {
        private double low;
        private double moderate;
        private double high;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanStrategyDto {
        private String focus;
        private String reasoning;
    }
}
