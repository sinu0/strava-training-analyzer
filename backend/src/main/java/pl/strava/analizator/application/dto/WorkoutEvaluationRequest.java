package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutEvaluationRequest {
    private String trainingIntent;
    private PlannedWorkout planned;
    private ExecutedWorkout actual;
    private DerivedMetrics derived;
    private HistoricalContext historical;
    private RecoveryContext recovery;
    private Short athleteFtpWatts;
    private Integer athleteHrMaxBpm;
    private Short athleteRestingHrBpm;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlannedWorkout {
        private Double targetPowerW;
        private Double targetPowerPctFtp;
        private Integer targetDurationSec;
        private Integer plannedIntervals;
        private Integer intervalDurationSec;
        private Integer intervalPowerW;
        private Double intervalPowerPctFtp;
        private Map<String, Double> targetZoneDistribution;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutedWorkout {
        private Double avgPowerW;
        private Double normalizedPowerW;
        private Integer actualDurationSec;
        private Integer completedIntervals;
        private Map<String, Double> timeInZones;
        private Integer avgHeartRateBpm;
        private Integer maxHeartRateBpm;
        private Integer avgCadence;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DerivedMetrics {
        private Double tss;
        private Double intensityFactor;
        private Double decouplingPwHr;
        private Double variabilityIndex;
        private List<Double> intervalPowerValues;
        private List<Integer> intervalHeartRateValues;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoricalContext {
        private BigDecimal last7DaysTss;
        private BigDecimal last28DaysTss;
        private Double ctl;
        private Double atl;
        private Double tsb;
        private List<String> recentWorkoutOutcomes;
        private Double recentIntensityFactor;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecoveryContext {
        private Double hrvTrend;
        private Integer restingHrBpm;
        private Double sleepQuality;
        private Double subjectiveReadinessScore;
    }
}
