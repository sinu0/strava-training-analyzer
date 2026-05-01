package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import pl.strava.analizator.application.dto.WorkoutEvaluationRequest;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.DerivedMetrics;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.ExecutedWorkout;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.HistoricalContext;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.PlannedWorkout;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest.RecoveryContext;
import pl.strava.analizator.application.dto.WorkoutEvaluationResponse;

class WorkoutEvaluationServiceTest {

    private WorkoutEvaluationService service;

    @BeforeEach
    void setUp() {
        service = new WorkoutEvaluationService();
    }

    @Test
    void shouldClassifyPerfectThresholdWorkoutAsSuccessWithFreshAthlete() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("THRESHOLD")
                .athleteFtpWatts((short) 280)
                .athleteHrMaxBpm(190)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(100.0)
                        .targetDurationSec(2700)
                        .plannedIntervals(3)
                        .intervalDurationSec(480)
                        .targetZoneDistribution(Map.of("Z4", 65.0, "Z3", 25.0, "Z2", 10.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(278.0)
                        .normalizedPowerW(281.0)
                        .actualDurationSec(2710)
                        .completedIntervals(3)
                        .timeInZones(Map.of("Z4", 63.0, "Z3", 27.0, "Z2", 10.0))
                        .avgHeartRateBpm(158)
                        .maxHeartRateBpm(172)
                        .avgCadence(88)
                        .build())
                .derived(DerivedMetrics.builder()
                        .tss(72.0)
                        .intensityFactor(1.0)
                        .decouplingPwHr(2.0)
                        .variabilityIndex(1.04)
                        .intervalPowerValues(List.of(280.0, 279.0, 281.0))
                        .intervalHeartRateValues(List.of(155, 159, 162))
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(350))
                        .last28DaysTss(BigDecimal.valueOf(1200))
                        .ctl(65.0)
                        .atl(58.0)
                        .tsb(7.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED", "WELL_EXECUTED", "WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(8.0)
                        .subjectiveReadinessScore(8.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getScore()).isGreaterThanOrEqualTo(80);
        assertThat(result.getConfidence()).isGreaterThan(0.6);
        assertThat(result.getAnalysis().getHrResponse()).isEqualTo("HIGH");
        assertThat(result.getAnalysis().getExecutionStability()).isEqualTo("HIGH");
    }

    @Test
    void shouldClassifyUnderpoweredThresholdWorkoutAsFail() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("THRESHOLD")
                .athleteFtpWatts((short) 280)
                .athleteHrMaxBpm(190)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(100.0)
                        .plannedIntervals(4)
                        .targetZoneDistribution(Map.of("Z4", 70.0, "Z3", 20.0, "Z2", 10.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(220.0)
                        .normalizedPowerW(225.0)
                        .completedIntervals(1)
                        .timeInZones(Map.of("Z4", 15.0, "Z3", 60.0, "Z2", 25.0))
                        .avgHeartRateBpm(110)
                        .maxHeartRateBpm(135)
                        .build())
                .derived(DerivedMetrics.builder()
                        .decouplingPwHr(1.0)
                        .variabilityIndex(1.12)
                        .intervalPowerValues(List.of(250.0, 210.0, 200.0, 180.0))
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(300))
                        .last28DaysTss(BigDecimal.valueOf(1100))
                        .ctl(55.0)
                        .atl(50.0)
                        .tsb(5.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED", "WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(7.0)
                        .subjectiveReadinessScore(7.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getOutcome()).isEqualTo("FAIL");
        assertThat(result.getScore()).isLessThan(65);
        assertThat(result.getAnalysis().getHrResponse()).isEqualTo("LOW");
        assertThat(result.getAnalysis().getIntervalCompletion()).isLessThan(60);
    }

    @Test
    void shouldReducePenaltyForUnderperformanceInHighFatigue() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("THRESHOLD")
                .athleteFtpWatts((short) 280)
                .athleteHrMaxBpm(190)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(100.0)
                        .plannedIntervals(3)
                        .targetZoneDistribution(Map.of("Z4", 65.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(255.0)
                        .normalizedPowerW(260.0)
                        .completedIntervals(2)
                        .timeInZones(Map.of("Z4", 40.0, "Z3", 45.0, "Z2", 15.0))
                        .avgHeartRateBpm(150)
                        .maxHeartRateBpm(170)
                        .build())
                .derived(DerivedMetrics.builder()
                        .decouplingPwHr(4.0)
                        .variabilityIndex(1.08)
                        .intervalPowerValues(List.of(270.0, 250.0, 235.0))
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(750))
                        .last28DaysTss(BigDecimal.valueOf(2200))
                        .ctl(70.0)
                        .atl(105.0)
                        .tsb(-35.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(3.0)
                        .subjectiveReadinessScore(2.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getContextualFactors().getFatigueState()).isEqualTo("HIGH");
        assertThat(result.getOutcome()).isNotEqualTo("FAIL");
    }

    @Test
    void shouldFlagOverachievementUnderFatigueAsRisk() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("THRESHOLD")
                .athleteFtpWatts((short) 280)
                .athleteHrMaxBpm(190)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(100.0)
                        .plannedIntervals(3)
                        .targetZoneDistribution(Map.of("Z4", 65.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(305.0)
                        .normalizedPowerW(310.0)
                        .completedIntervals(3)
                        .timeInZones(Map.of("Z4", 50.0, "Z5", 35.0, "Z3", 15.0))
                        .avgHeartRateBpm(170)
                        .maxHeartRateBpm(183)
                        .build())
                .derived(DerivedMetrics.builder()
                        .decouplingPwHr(2.0)
                        .variabilityIndex(1.08)
                        .intervalPowerValues(List.of(310.0, 305.0, 312.0))
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(650))
                        .last28DaysTss(BigDecimal.valueOf(2200))
                        .ctl(72.0)
                        .atl(98.0)
                        .tsb(-35.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED", "WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(3.0)
                        .subjectiveReadinessScore(3.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getOutcome()).isEqualTo("OVERACHIEVE");
        assertThat(result.getContextualFactors().getFatigueState()).isEqualTo("HIGH");
    }

    @ParameterizedTest
    @CsvSource({
            "VO2_MAX, 172, 182, HIGH",
            "THRESHOLD, 160, 172, HIGH",
            "ENDURANCE, 115, 130, OK",
            "RECOVERY, 80, 95, LOW",
    })
    void shouldEvaluateHrResponseBasedOnIntent(String intent, int avgHr, int maxHr, String expectedHrResponse) {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent(intent)
                .athleteFtpWatts((short) 280)
                .athleteHrMaxBpm(190)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(targetPowerPctForIntent(intent))
                        .targetZoneDistribution(Map.of(getTargetZoneForIntent(intent), 80.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW((double) (int) (280 * targetPowerPctForIntent(intent) / 100.0))
                        .normalizedPowerW((double) (int) (280 * targetPowerPctForIntent(intent) / 100.0) + 2)
                        .completedIntervals(1)
                        .timeInZones(Map.of(getTargetZoneForIntent(intent), 78.0))
                        .avgHeartRateBpm(avgHr)
                        .maxHeartRateBpm(maxHr)
                        .build())
                .derived(DerivedMetrics.builder()
                        .variabilityIndex(1.04)
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(300))
                        .last28DaysTss(BigDecimal.valueOf(1200))
                        .ctl(55.0)
                        .atl(50.0)
                        .tsb(5.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(7.0)
                        .subjectiveReadinessScore(7.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getAnalysis().getHrResponse()).isEqualTo(expectedHrResponse);
    }

    @Test
    void shouldDetectHighFatigueDriftFromDecouplingAndPowerFade() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("ENDURANCE")
                .athleteFtpWatts((short) 280)
                .athleteHrMaxBpm(190)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(70.0)
                        .targetZoneDistribution(Map.of("Z2", 80.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(196.0)
                        .normalizedPowerW(200.0)
                        .completedIntervals(1)
                        .timeInZones(Map.of("Z2", 75.0))
                        .avgHeartRateBpm(145)
                        .maxHeartRateBpm(168)
                        .build())
                .derived(DerivedMetrics.builder()
                        .decouplingPwHr(7.0)
                        .variabilityIndex(1.08)
                        .intervalPowerValues(List.of(210.0, 205.0, 195.0, 185.0, 178.0, 170.0))
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(400))
                        .last28DaysTss(BigDecimal.valueOf(1400))
                        .ctl(58.0)
                        .atl(55.0)
                        .tsb(3.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(6.0)
                        .subjectiveReadinessScore(6.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getAnalysis().getFatigueDrift()).isEqualTo("HIGH");
    }

    @Test
    void shouldDetectRecentFailures() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("THRESHOLD")
                .athleteFtpWatts((short) 280)
                .athleteHrMaxBpm(190)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(100.0)
                        .plannedIntervals(3)
                        .targetZoneDistribution(Map.of("Z4", 65.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(265.0)
                        .normalizedPowerW(270.0)
                        .completedIntervals(2)
                        .timeInZones(Map.of("Z4", 40.0, "Z3", 50.0, "Z2", 10.0))
                        .avgHeartRateBpm(150)
                        .maxHeartRateBpm(168)
                        .build())
                .derived(DerivedMetrics.builder()
                        .decouplingPwHr(3.0)
                        .variabilityIndex(1.09)
                        .intervalPowerValues(List.of(275.0, 260.0, 248.0))
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(350))
                        .last28DaysTss(BigDecimal.valueOf(1300))
                        .ctl(55.0)
                        .atl(52.0)
                        .tsb(3.0)
                        .recentWorkoutOutcomes(List.of("FAIL", "MISSED_STIMULUS", "WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(6.0)
                        .subjectiveReadinessScore(5.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getContextualFactors().isRecentFailures()).isTrue();
    }

    @Test
    void shouldReturnConfidenceBelowOneWhenHrDataMissing() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("ENDURANCE")
                .athleteFtpWatts((short) 250)
                .athleteHrMaxBpm(185)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(68.0)
                        .targetZoneDistribution(Map.of("Z2", 85.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(170.0)
                        .normalizedPowerW(173.0)
                        .completedIntervals(1)
                        .timeInZones(Map.of("Z2", 82.0))
                        .build())
                .derived(DerivedMetrics.builder()
                        .decouplingPwHr(null)
                        .variabilityIndex(1.03)
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(300))
                        .last28DaysTss(BigDecimal.valueOf(1200))
                        .ctl(50.0)
                        .atl(45.0)
                        .tsb(5.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(7.0)
                        .subjectiveReadinessScore(7.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getConfidence()).isLessThan(0.7);
    }

    @Test
    void shouldEvaluateStableEnduranceWorkoutCorrectly() {
        WorkoutEvaluationRequest request = WorkoutEvaluationRequest.builder()
                .trainingIntent("ENDURANCE")
                .athleteFtpWatts((short) 250)
                .athleteHrMaxBpm(185)
                .planned(PlannedWorkout.builder()
                        .targetPowerPctFtp(65.0)
                        .targetDurationSec(7200)
                        .targetZoneDistribution(Map.of("Z2", 85.0, "Z1", 15.0))
                        .build())
                .actual(ExecutedWorkout.builder()
                        .avgPowerW(162.0)
                        .normalizedPowerW(164.0)
                        .actualDurationSec(7180)
                        .completedIntervals(1)
                        .timeInZones(Map.of("Z2", 83.0, "Z1", 17.0))
                        .avgHeartRateBpm(130)
                        .maxHeartRateBpm(142)
                        .build())
                .derived(DerivedMetrics.builder()
                        .decouplingPwHr(2.0)
                        .variabilityIndex(1.03)
                        .intervalPowerValues(List.of(163.0, 162.0, 161.0, 164.0))
                        .build())
                .historical(HistoricalContext.builder()
                        .last7DaysTss(BigDecimal.valueOf(400))
                        .last28DaysTss(BigDecimal.valueOf(1400))
                        .ctl(58.0)
                        .atl(52.0)
                        .tsb(6.0)
                        .recentWorkoutOutcomes(List.of("WELL_EXECUTED", "WELL_EXECUTED"))
                        .build())
                .recovery(RecoveryContext.builder()
                        .sleepQuality(8.0)
                        .subjectiveReadinessScore(8.0)
                        .build())
                .build();

        WorkoutEvaluationResponse result = service.evaluate(request);

        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getAnalysis().getExecutionStability()).isEqualTo("HIGH");
        assertThat(result.getAnalysis().getFatigueDrift()).isEqualTo("LOW");
    }

    private double targetPowerPctForIntent(String intent) {
        return switch (intent) {
            case "VO2_MAX" -> 115.0;
            case "THRESHOLD" -> 100.0;
            case "ENDURANCE" -> 68.0;
            case "RECOVERY" -> 50.0;
            default -> 70.0;
        };
    }

    private String getTargetZoneForIntent(String intent) {
        return switch (intent) {
            case "VO2_MAX" -> "Z5";
            case "THRESHOLD" -> "Z4";
            case "ENDURANCE" -> "Z2";
            case "RECOVERY" -> "Z1";
            default -> "Z2";
        };
    }
}
