package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;

import pl.strava.analizator.application.dto.AdaptiveTrainingRequest;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.FatigueSignalsDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.PlannedWorkoutDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.ProgressionStateDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.RecentWorkoutDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest.TrainingLoadStateDto;
import pl.strava.analizator.application.dto.AdaptiveTrainingResponse;

class AdaptiveTrainingServiceTest {

    private AdaptiveTrainingService service;

    @BeforeEach
    void setUp() {
        service = new AdaptiveTrainingService();
    }

    @Test
    void shouldClassifyHighFatigueWhenAtlHighAndTsbNegativeAndHrvDown() {
        var request = AdaptiveTrainingRequest.builder()
                .trainingLoad(TrainingLoadStateDto.builder()
                        .atl(BigDecimal.valueOf(90))
                        .tsb(BigDecimal.valueOf(-20))
                        .build())
                .fatigueSignals(FatigueSignalsDto.builder()
                        .hrvTrend("DOWN")
                        .restingHrTrend("STABLE")
                        .sleepQuality("AVERAGE")
                        .subjectiveReadiness(50)
                        .build())
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getFatigueState()).isEqualTo("HIGH");
    }

    @Test
    void shouldClassifyLowFatigueWhenTsbPositiveAndHrvUp() {
        var request = AdaptiveTrainingRequest.builder()
                .trainingLoad(TrainingLoadStateDto.builder()
                        .atl(BigDecimal.valueOf(50))
                        .tsb(BigDecimal.valueOf(10))
                        .build())
                .fatigueSignals(FatigueSignalsDto.builder()
                        .hrvTrend("UP")
                        .restingHrTrend("UP")
                        .sleepQuality("GOOD")
                        .subjectiveReadiness(75)
                        .build())
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getFatigueState()).isEqualTo("LOW");
    }

    @Test
    void shouldClassifyFatigueAsModerateByDefault() {
        var request = AdaptiveTrainingRequest.builder()
                .trainingLoad(TrainingLoadStateDto.builder()
                        .atl(BigDecimal.valueOf(60))
                        .tsb(BigDecimal.valueOf(0))
                        .build())
                .fatigueSignals(FatigueSignalsDto.builder()
                        .hrvTrend("STABLE")
                        .restingHrTrend("STABLE")
                        .sleepQuality("AVERAGE")
                        .subjectiveReadiness(55)
                        .build())
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getFatigueState()).isEqualTo("MODERATE");
    }

    @Test
    void shouldAssessPerformanceAsSuccessWhenAllRecentAreSuccess() {
        var request = AdaptiveTrainingRequest.builder()
                .recentWorkouts(List.of(
                        recent("SUCCESS", 85, "THRESHOLD"),
                        recent("SUCCESS", 80, "ENDURANCE"),
                        recent("SUCCESS", 88, "VO2_MAX"),
                        recent("SUCCESS", 82, "THRESHOLD"),
                        recent("OVERACHIEVE", 95, "VO2_MAX")))
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getPerformanceTrend()).isEqualTo("SUCCESS");
    }

    @Test
    void shouldAssessPerformanceAsFailWhenMultipleFailures() {
        var request = AdaptiveTrainingRequest.builder()
                .recentWorkouts(List.of(
                        recent("FAIL", 30, "THRESHOLD"),
                        recent("FAIL", 35, "VO2_MAX"),
                        recent("PARTIAL", 55, "ENDURANCE"),
                        recent("SUCCESS", 80, "ENDURANCE"),
                        recent("PARTIAL", 60, "THRESHOLD")))
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getPerformanceTrend()).isEqualTo("FAIL");
    }

    @Test
    void shouldProgressionActionBeRegressWhenPerformanceFails() {
        var request = AdaptiveTrainingRequest.builder()
                .trainingLoad(TrainingLoadStateDto.builder()
                        .atl(BigDecimal.valueOf(50))
                        .tsb(BigDecimal.valueOf(5))
                        .build())
                .fatigueSignals(FatigueSignalsDto.builder()
                        .hrvTrend("STABLE")
                        .sleepQuality("AVERAGE")
                        .subjectiveReadiness(60)
                        .build())
                .recentWorkouts(List.of(
                        recent("FAIL", 30, "THRESHOLD"),
                        recent("FAIL", 35, "VO2_MAX"),
                        recent("PARTIAL", 55, "ENDURANCE")))
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getProgressionAction()).isEqualTo("REGRESS");
    }

    @Test
    void shouldProgressionActionBeProgressWhenConsistentSuccess() {
        var request = AdaptiveTrainingRequest.builder()
                .trainingLoad(TrainingLoadStateDto.builder()
                        .atl(BigDecimal.valueOf(50))
                        .tsb(BigDecimal.valueOf(5))
                        .build())
                .fatigueSignals(FatigueSignalsDto.builder()
                        .hrvTrend("UP")
                        .sleepQuality("GOOD")
                        .subjectiveReadiness(75)
                        .build())
                .recentWorkouts(List.of(
                        recent("SUCCESS", 85, "THRESHOLD"),
                        recent("SUCCESS", 80, "ENDURANCE"),
                        recent("SUCCESS", 88, "VO2_MAX")))
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getProgressionAction()).isEqualTo("PROGRESS");
    }

    @Test
    void shouldProgressionActionBeMaintainWhenOverachieveWithNotLowFatigue() {
        var request = AdaptiveTrainingRequest.builder()
                .trainingLoad(TrainingLoadStateDto.builder()
                        .atl(BigDecimal.valueOf(70))
                        .tsb(BigDecimal.valueOf(-5))
                        .build())
                .fatigueSignals(FatigueSignalsDto.builder()
                        .hrvTrend("STABLE")
                        .sleepQuality("AVERAGE")
                        .subjectiveReadiness(55)
                        .build())
                .recentWorkouts(List.of(
                        recent("OVERACHIEVE", 95, "VO2_MAX"),
                        recent("SUCCESS", 85, "THRESHOLD"),
                        recent("SUCCESS", 82, "ENDURANCE")))
                .build();

        var response = service.adapt(request);

        assertThat(response.getStrategy().getProgressionAction()).isEqualTo("MAINTAIN");
    }

    @Nested
    class Adjustments {

        @Test
        void shouldReplaceHardWorkoutsWithEnduranceWhenHighFatigue() {
            var request = AdaptiveTrainingRequest.builder()
                    .plannedWorkouts(List.of(
                            planned("THRESHOLD", 250, 75, 3),
                            planned("VO2_MAX", 270, 60, 5),
                            planned("ENDURANCE", 180, 90, 0)))
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(90))
                            .tsb(BigDecimal.valueOf(-20))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("DOWN")
                            .sleepQuality("POOR")
                            .subjectiveReadiness(30)
                            .build())
                    .recentWorkouts(List.of(
                            recent("PARTIAL", 55, "THRESHOLD"),
                            recent("FAIL", 40, "VO2_MAX"),
                            recent("PARTIAL", 50, "ENDURANCE")))
                    .build();

            var response = service.adapt(request);

            assertThat(response.getAdjustments()).hasSize(3);
            assertThat(response.getAdjustments().get(0).getAction()).isEqualTo("REPLACE");
            assertThat(response.getAdjustments().get(0).getNewWorkout().getType()).isIn("RECOVERY", "ENDURANCE");
            assertThat(response.getAdjustments().get(1).getAction()).isEqualTo("REPLACE");
        }

        @Test
        void shouldModifyHardWorkoutsWhenPerformanceFailWithReducedIntensity() {
            var request = AdaptiveTrainingRequest.builder()
                    .plannedWorkouts(List.of(
                            planned("THRESHOLD", 250, 75, 3),
                            planned("ENDURANCE", 180, 90, 0)))
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(60))
                            .tsb(BigDecimal.valueOf(0))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("STABLE")
                            .sleepQuality("AVERAGE")
                            .subjectiveReadiness(55)
                            .build())
                    .recentWorkouts(List.of(
                            recent("FAIL", 35, "THRESHOLD"),
                            recent("FAIL", 40, "VO2_MAX"),
                            recent("PARTIAL", 50, "ENDURANCE")))
                    .build();

            var response = service.adapt(request);

            assertThat(response.getAdjustments()).hasSize(2);
            var firstAdj = response.getAdjustments().get(0);
            assertThat(firstAdj.getAction()).isEqualTo("MODIFY");
            assertThat(firstAdj.getNewWorkout().getIntensityAdjustment()).isEqualTo("DOWN");
            assertThat(firstAdj.getNewWorkout().getVolumeAdjustment()).isEqualTo("DOWN");
        }

        @Test
        void shouldApplyProgressiveOverloadWhenConsistentSuccessWithLowFatigue() {
            var request = AdaptiveTrainingRequest.builder()
                    .plannedWorkouts(List.of(
                            planned("THRESHOLD", 250, 75, 3),
                            planned("ENDURANCE", 180, 90, 0),
                            planned("VO2_MAX", 270, 60, 5)))
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(50))
                            .tsb(BigDecimal.valueOf(8))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("UP")
                            .sleepQuality("GOOD")
                            .subjectiveReadiness(80)
                            .build())
                    .recentWorkouts(List.of(
                            recent("SUCCESS", 88, "THRESHOLD"),
                            recent("SUCCESS", 85, "ENDURANCE"),
                            recent("SUCCESS", 90, "VO2_MAX")))
                    .build();

            var response = service.adapt(request);

            var firstAdj = response.getAdjustments().get(0);
            assertThat(firstAdj.getNewWorkout().getIntensityAdjustment()).isEqualTo("UP");
        }

        @Test
        void shouldKeepEasyWorkoutsEvenWhenHighFatigue() {
            var request = AdaptiveTrainingRequest.builder()
                    .plannedWorkouts(List.of(
                            planned("RECOVERY", 130, 45, 0),
                            planned("ENDURANCE", 180, 60, 0)))
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(90))
                            .tsb(BigDecimal.valueOf(-25))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("DOWN")
                            .sleepQuality("POOR")
                            .subjectiveReadiness(25)
                            .build())
                    .recentWorkouts(List.of(
                            recent("FAIL", 30, "VO2_MAX"),
                            recent("FAIL", 35, "THRESHOLD")))
                    .build();

            var response = service.adapt(request);

            assertThat(response.getAdjustments().get(0).getAction()).isEqualTo("KEEP");
            assertThat(response.getAdjustments().get(1).getAction()).isEqualTo("KEEP");
        }
    }

    @Nested
    class Warnings {

        @Test
        void shouldWarnWhenTsbBelowMinus25() {
            var request = AdaptiveTrainingRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(95))
                            .tsb(BigDecimal.valueOf(-30))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("STABLE")
                            .sleepQuality("AVERAGE")
                            .subjectiveReadiness(50)
                            .build())
                    .build();

            var response = service.adapt(request);

            assertThat(response.getWarnings()).anyMatch(w -> w.contains("TSB") && w.contains("-25"));
        }

        @Test
        void shouldWarnWhenHighIntensitySessionsExceedLimit() {
            var request = AdaptiveTrainingRequest.builder()
                    .plannedWorkouts(List.of(
                            planned("THRESHOLD", 250, 60, 4),
                            planned("VO2_MAX", 270, 50, 5),
                            planned("ANAEROBIC", 300, 45, 8),
                            planned("THRESHOLD", 260, 55, 3)))
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(50))
                            .tsb(BigDecimal.valueOf(5))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("UP")
                            .sleepQuality("GOOD")
                            .subjectiveReadiness(80)
                            .build())
                    .build();

            var response = service.adapt(request);

            assertThat(response.getWarnings()).anyMatch(w -> w.contains("wysokiej intensywnosci"));
        }

        @Test
        void shouldWarnWhenAtlCtlRatioTooHigh() {
            var request = AdaptiveTrainingRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(50))
                            .atl(BigDecimal.valueOf(75))
                            .tsb(BigDecimal.valueOf(-15))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("STABLE")
                            .sleepQuality("AVERAGE")
                            .subjectiveReadiness(45)
                            .build())
                    .build();

            var response = service.adapt(request);

            assertThat(response.getWarnings()).anyMatch(w -> w.contains("ATL/CTL") && w.contains("1.35"));
        }
    }

    @Nested
    class SafetyConstraints {

        @Test
        void shouldLimitConsecutiveHardDaysToTwo() {
            var request = AdaptiveTrainingRequest.builder()
                    .plannedWorkouts(List.of(
                            planned("THRESHOLD", 250, 75, 4),
                            planned("VO2_MAX", 270, 60, 5),
                            planned("ANAEROBIC", 300, 45, 8)))
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(50))
                            .tsb(BigDecimal.valueOf(5))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("UP")
                            .sleepQuality("GOOD")
                            .subjectiveReadiness(80)
                            .build())
                    .recentWorkouts(List.of(
                            recent("SUCCESS", 85, "THRESHOLD"),
                            recent("SUCCESS", 82, "ENDURANCE")))
                    .build();

            var response = service.adapt(request);

            var thirdAdj = response.getAdjustments().get(2);
            assertThat(thirdAdj.getAction()).isEqualTo("REPLACE");
            assertThat(thirdAdj.getNewWorkout().getType()).isEqualTo("ENDURANCE");
        }
    }

    @Nested
    class EdgeCases {

        @Test
        void shouldHandleEmptyPlannedWorkouts() {
            var request = AdaptiveTrainingRequest.builder()
                    .plannedWorkouts(List.of())
                    .build();

            var response = service.adapt(request);

            assertThat(response.getAdjustments()).isEmpty();
            assertThat(response.getStrategy().getFatigueState()).isEqualTo("MODERATE");
        }

        @Test
        void shouldHandleNullFieldsGracefully() {
            var request = AdaptiveTrainingRequest.builder().build();

            var response = service.adapt(request);

            assertThat(response.getStrategy().getFatigueState()).isEqualTo("MODERATE");
            assertThat(response.getStrategy().getPerformanceTrend()).isEqualTo("MIXED");
            assertThat(response.getStrategy().getProgressionAction()).isEqualTo("MAINTAIN");
            assertThat(response.getAdjustments()).isEmpty();
        }

        @Test
        void shouldGenerateInsight() {
            var request = AdaptiveTrainingRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .atl(BigDecimal.valueOf(50))
                            .tsb(BigDecimal.valueOf(5))
                            .build())
                    .fatigueSignals(FatigueSignalsDto.builder()
                            .hrvTrend("UP")
                            .subjectiveReadiness(80)
                            .build())
                    .recentWorkouts(List.of(
                            recent("SUCCESS", 85, "THRESHOLD"),
                            recent("SUCCESS", 80, "ENDURANCE"),
                            recent("SUCCESS", 88, "VO2_MAX")))
                    .build();

            var response = service.adapt(request);

            assertThat(response.getInsight()).isNotBlank();
        }
    }

    private static PlannedWorkoutDto planned(String type, int targetPower, int duration, int intervals) {
        return PlannedWorkoutDto.builder()
                .type(type)
                .targetPower(targetPower)
                .duration(duration)
                .intervals(intervals)
                .build();
    }

    private static RecentWorkoutDto recent(String outcome, int score, String workoutType) {
        return RecentWorkoutDto.builder()
                .outcome(outcome)
                .score(score)
                .workoutType(workoutType)
                .build();
    }
}
