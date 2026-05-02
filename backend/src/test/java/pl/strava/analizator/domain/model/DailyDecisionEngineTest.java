package pl.strava.analizator.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class DailyDecisionEngineTest {

    private final DailyDecisionEngine engine = new DailyDecisionEngine();

    @Nested
    class DecisionTypeTests {

        @Test
        void shouldReturnRideWhenAllConditionsGood() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(80))
                    .ctl(BigDecimal.valueOf(70))
                    .atl(BigDecimal.valueOf(65))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(80)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.8))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isEqualTo(DecisionType.RIDE);
            assertThat(decision.getRisk()).isIn(RiskLevel.LOW);
            assertThat(decision.getConfidence().getScore()).isGreaterThan(0.5);
        }

        @Test
        void shouldReturnSkipWhenHighFatigueAndLowHrv() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(25))
                    .ctl(BigDecimal.valueOf(60))
                    .atl(BigDecimal.valueOf(90))
                    .tsb(BigDecimal.valueOf(-30))
                    .hrvTrend("DECLINING")
                    .weatherScore(80)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("THRESHOLD")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.3))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isEqualTo(DecisionType.SKIP);
            assertThat(decision.getRisk()).isIn(RiskLevel.HIGH, RiskLevel.CRITICAL);
            assertThat(decision.getReasons()).extracting(DecisionReason::getPriority)
                    .contains("SAFETY");
        }

        @Test
        void shouldReturnIndoorWhenBadWeatherButGoodReadiness() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(75))
                    .ctl(BigDecimal.valueOf(70))
                    .atl(BigDecimal.valueOf(65))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(20)
                    .weatherDescription("Heavy rain, 5°C")
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.7))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isEqualTo(DecisionType.INDOOR);
            assertThat(decision.getWorkout().isIndoor()).isTrue();
            assertThat(decision.getReasons()).anyMatch(r -> r.getPriority().equals("CONTEXT"));
        }

        @Test
        void shouldReturnModifyWhenLowTimeAvailability() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(70))
                    .ctl(BigDecimal.valueOf(65))
                    .atl(BigDecimal.valueOf(60))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(80)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(45)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.8))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isEqualTo(DecisionType.MODIFY);
            assertThat(decision.getWorkout().getDurationMin()).isLessThanOrEqualTo(45);
        }

        @Test
        void shouldReturnModifyWhenFatigueIsModerate() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(50))
                    .ctl(BigDecimal.valueOf(60))
                    .atl(BigDecimal.valueOf(75))
                    .tsb(BigDecimal.valueOf(-15))
                    .hrvTrend("SLIGHTLY_DECLINING")
                    .weatherScore(80)
                    .plannedTss(BigDecimal.valueOf(100))
                    .plannedDurationMin(120)
                    .plannedType("VO2MAX")
                    .timeAvailableMin(150)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.5))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isIn(DecisionType.MODIFY, DecisionType.SKIP);
            // should NOT keep the original high-intensity workout
            if (decision.getWorkout() != null) {
                assertThat(decision.getWorkout().getDifficulty())
                        .isIn("EASY", "MODERATE", "ENDURANCE");
            }
        }
    }

    @Nested
    class AlternativesGenerationTests {

        @Test
        void shouldGenerateAtLeastTwoAlternatives() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(70))
                    .ctl(BigDecimal.valueOf(65))
                    .atl(BigDecimal.valueOf(60))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(60)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.7))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getAlternatives())
                    .isNotEmpty()
                    .hasSizeGreaterThanOrEqualTo(2);
        }

        @Test
        void eachAlternativeShouldHaveDistinctType() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(70))
                    .ctl(BigDecimal.valueOf(65))
                    .atl(BigDecimal.valueOf(60))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(60)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.7))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            List<AlternativeOption> alternatives = decision.getAlternatives();
            long distinctLabels = alternatives.stream()
                    .map(AlternativeOption::getLabel)
                    .distinct()
                    .count();
            assertThat(distinctLabels).isEqualTo(alternatives.size());
        }
    }

    @Nested
    class ConfidenceModelTests {

        @Test
        void highConfidenceWhenAllDataPresentAndStable() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(75))
                    .ctl(BigDecimal.valueOf(70))
                    .atl(BigDecimal.valueOf(65))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(80)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.8))
                    .hasHrvData(true)
                    .hasWeatherData(true)
                    .hasRecentActivities(true)
                    .build();

            DailyDecision decision = engine.evaluate(input);

            ConfidenceScore confidence = decision.getConfidence();
            assertThat(confidence.getScore()).isGreaterThanOrEqualTo(0.7);
            assertThat(confidence.getLabel()).isIn("HIGH", "VERY_HIGH");
        }

        @Test
        void lowConfidenceWhenDataMissing() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(50))
                    .ctl(BigDecimal.valueOf(50))
                    .atl(BigDecimal.valueOf(70))
                    .tsb(BigDecimal.valueOf(-20))
                    .hrvTrend(null)
                    .weatherScore(50)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(null)
                    .hasHrvData(false)
                    .hasWeatherData(false)
                    .hasRecentActivities(false)
                    .build();

            DailyDecision decision = engine.evaluate(input);

            ConfidenceScore confidence = decision.getConfidence();
            assertThat(confidence.getScore()).isLessThanOrEqualTo(0.7);
        }
    }

    @Nested
    class RiskModelTests {

        @Test
        void criticalRiskWhenExtremeFatigueAndLowHrv() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(15))
                    .ctl(BigDecimal.valueOf(50))
                    .atl(BigDecimal.valueOf(100))
                    .tsb(BigDecimal.valueOf(-50))
                    .hrvTrend("SEVERELY_DECLINING")
                    .weatherScore(80)
                    .plannedTss(BigDecimal.valueOf(120))
                    .plannedDurationMin(180)
                    .plannedType("VO2MAX")
                    .timeAvailableMin(200)
                    .trainingMonotony(BigDecimal.valueOf(3.5))
                    .recentOutcomeRatio(BigDecimal.valueOf(0.1))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getRisk()).isEqualTo(RiskLevel.CRITICAL);
            assertThat(decision.getDecision()).isEqualTo(DecisionType.SKIP);
        }

        @Test
        void lowRiskWhenFresh() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(85))
                    .ctl(BigDecimal.valueOf(65))
                    .atl(BigDecimal.valueOf(55))
                    .tsb(BigDecimal.valueOf(10))
                    .hrvTrend("IMPROVING")
                    .weatherScore(85)
                    .plannedTss(BigDecimal.valueOf(70))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .trainingMonotony(BigDecimal.valueOf(1.2))
                    .recentOutcomeRatio(BigDecimal.valueOf(0.9))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getRisk()).isEqualTo(RiskLevel.LOW);
        }
    }

    @Nested
    class DecisionPriorityTests {

        @Test
        void safetyOverridesPlanWhenFatigued() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(20))
                    .ctl(BigDecimal.valueOf(55))
                    .atl(BigDecimal.valueOf(95))
                    .tsb(BigDecimal.valueOf(-40))
                    .hrvTrend("DECLINING")
                    .weatherScore(90)
                    .plannedTss(BigDecimal.valueOf(60))
                    .plannedDurationMin(60)
                    .plannedType("RECOVERY")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.2))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isEqualTo(DecisionType.SKIP);
            String topReasonPriority = decision.getReasons().get(0).getPriority();
            assertThat(topReasonPriority).isEqualTo("SAFETY");
        }

        @Test
        void contextOverridesPlanWhenBadWeather() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(75))
                    .ctl(BigDecimal.valueOf(65))
                    .atl(BigDecimal.valueOf(60))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(15)
                    .weatherDescription("Thunderstorm")
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.7))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isEqualTo(DecisionType.INDOOR);
        }
    }

    @Nested
    class EdgeCaseTests {

        @Test
        void noPlannedWorkoutShouldSuggestRestOrEasy() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(80))
                    .ctl(BigDecimal.valueOf(65))
                    .atl(BigDecimal.valueOf(55))
                    .tsb(BigDecimal.valueOf(10))
                    .hrvTrend("STABLE")
                    .weatherScore(80)
                    .plannedTss(null)
                    .plannedDurationMin(null)
                    .plannedType(null)
                    .timeAvailableMin(120)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.8))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision.getDecision()).isEqualTo(DecisionType.MODIFY);
            assertThat(decision.getReasons()).anyMatch(r -> r.getMessage().contains("planned"));
        }

        @Test
        void nullTimeAvailabilityDefaultsToAvailable() {
            DailyDecisionEngine.DecisionInput input = DailyDecisionEngine.DecisionInput.builder()
                    .readinessScore(BigDecimal.valueOf(75))
                    .ctl(BigDecimal.valueOf(65))
                    .atl(BigDecimal.valueOf(60))
                    .tsb(BigDecimal.valueOf(5))
                    .hrvTrend("STABLE")
                    .weatherScore(80)
                    .plannedTss(BigDecimal.valueOf(80))
                    .plannedDurationMin(90)
                    .plannedType("ENDURANCE")
                    .timeAvailableMin(null)
                    .recentOutcomeRatio(BigDecimal.valueOf(0.7))
                    .build();

            DailyDecision decision = engine.evaluate(input);

            assertThat(decision).isNotNull();
            assertThat(decision.getDecision()).isNotNull();
        }
    }
}
