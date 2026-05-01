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
public class PerformancePredictionRequest {
    private TrainingLoadStateDto trainingLoad;
    private RecentTrendsDto recentTrends;
    private PerformanceIndicatorsDto performanceIndicators;
    private RecoverySignalsDto recoverySignals;
    private List<RecentWorkoutDto> recentWorkouts;

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
    public static class RecentTrendsDto {
        private String ctlTrend;
        private String fatigueTrend;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceIndicatorsDto {
        private BigDecimal ftp;
        private String ftpTrend;
        private Integer tte;
        private String durability;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecoverySignalsDto {
        private String hrvTrend;
        private String restingHrTrend;
        private String sleepQuality;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentWorkoutDto {
        private String outcome;
    }
}
