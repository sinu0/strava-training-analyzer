package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.OptimizePlanRequest;
import pl.strava.analizator.application.dto.OptimizePlanResponse;
import pl.strava.analizator.application.dto.OptimizePlanResponse.PlanResultDto;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.TrainingPlanProgramRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;

@ExtendWith(MockitoExtension.class)
class TrainingPlanOptimizerServiceTest {

    @Mock
    private TrainingPlanRepository trainingPlanRepository;
    @Mock
    private TrainingPlanProgramRepository programRepository;
    @Mock
    private AthleteProfileRepository athleteProfileRepository;

    @InjectMocks
    private TrainingPlanOptimizerService service;

    @Nested
    class PlanGeneration {

        @Test
        void shouldGenerateThreePlans() {
            var response = service.optimize(basicRequest());

            assertThat(response.getPlans()).hasSize(3);
            assertThat(response.getPlans())
                    .extracting(PlanResultDto::getType)
                    .containsExactlyInAnyOrder("CONSERVATIVE", "BALANCED", "AGGRESSIVE");
        }

        @Test
        void shouldGenerateCorrectNumberOfSessions() {
            var request = basicRequest();
            var response = service.optimize(request);

            int expectedSessions = request.getWeeks() * request.getTrainingDaysPerWeek();
            for (var plan : response.getPlans()) {
                assertThat(plan.getSessions()).hasSize(expectedSessions);
            }
        }

        @Test
        void shouldHaveHiSessionsInEachWeek() {
            var request = OptimizePlanRequest.builder()
                    .weeks(4)
                    .trainingDaysPerWeek(4)
                    .targetWeeklyTss(BigDecimal.valueOf(500))
                    .currentCtl(BigDecimal.valueOf(55))
                    .currentAtl(BigDecimal.valueOf(50))
                    .ftp(260)
                    .build();

            var response = service.optimize(request);
            var balanced = findPlan(response.getPlans(), "BALANCED");

            assertThat(balanced.getSessions().stream()
                    .filter(s -> "HIGH".equals(s.getIntensity()))
                    .count()).isGreaterThan(0);
        }
    }

    @Nested
    class Scoring {

        @Test
        void shouldScoreConservativeLowestFatigueCost() {
            var response = service.optimize(basicRequest());

            var conservative = findPlan(response.getPlans(), "CONSERVATIVE");
            var aggressive = findPlan(response.getPlans(), "AGGRESSIVE");
            assertThat(conservative.getFatigueCost()).isLessThan(aggressive.getFatigueCost());
        }

        @Test
        void shouldScoreAggressiveHighestAdaptationGain() {
            var response = service.optimize(basicRequest());

            var conservative = findPlan(response.getPlans(), "CONSERVATIVE");
            var aggressive = findPlan(response.getPlans(), "AGGRESSIVE");
            assertThat(aggressive.getAdaptationGain())
                    .isGreaterThanOrEqualTo(conservative.getAdaptationGain());
        }
    }

    @Nested
    class Constraints {

        @Test
        void shouldNotExceedThreeHighIntensitySessionsPerWeek() {
            var request = OptimizePlanRequest.builder()
                    .weeks(2)
                    .trainingDaysPerWeek(6)
                    .targetWeeklyTss(BigDecimal.valueOf(500))
                    .currentCtl(BigDecimal.valueOf(50))
                    .currentAtl(BigDecimal.valueOf(45))
                    .ftp(250)
                    .build();

            var response = service.optimize(request);
            var balanced = findPlan(response.getPlans(), "BALANCED");

            for (var session : balanced.getSessions()) {
                long highCountInWeek = balanced.getSessions().stream()
                        .filter(s -> s.getDay().get(java.time.temporal.WeekFields.ISO.weekOfYear())
                                == session.getDay().get(java.time.temporal.WeekFields.ISO.weekOfYear()))
                        .filter(s -> "HIGH".equals(s.getIntensity()))
                        .count();
                assertThat(highCountInWeek).isLessThanOrEqualTo(3);
            }
        }

        @Test
        void shouldNotHaveConsecutiveVo2MaxSessions() {
            var response = service.optimize(basicRequest());
            var balanced = findPlan(response.getPlans(), "BALANCED");

            var sessions = balanced.getSessions().stream()
                    .sorted((a, b) -> a.getDay().compareTo(b.getDay()))
                    .toList();

            for (int i = 0; i < sessions.size() - 1; i++) {
                boolean bothVo2 = "VO2_MAX".equals(sessions.get(i).getType())
                        && "VO2_MAX".equals(sessions.get(i + 1).getType());
                assertThat(bothVo2).isFalse();
            }
        }

        @Test
        void shouldHaveAtLeastOneRestDayPerWeek() {
            var request = OptimizePlanRequest.builder()
                    .weeks(2)
                    .trainingDaysPerWeek(5)
                    .targetWeeklyTss(BigDecimal.valueOf(450))
                    .currentCtl(BigDecimal.valueOf(50))
                    .currentAtl(BigDecimal.valueOf(45))
                    .ftp(250)
                    .build();

            var response = service.optimize(request);
            int totalDays = response.getPlans().get(0).getSessions().size();
            assertThat(totalDays).isLessThan(request.getWeeks() * 7);
        }
    }

    @Nested
    class IntensityDistribution {

        @Test
        void shouldHaveMostlyLowIntensity() {
            var response = service.optimize(basicRequest());
            var balanced = findPlan(response.getPlans(), "BALANCED");

            assertThat(balanced.getIntensityDistribution().getLow()).isGreaterThanOrEqualTo(50);
        }

        @Test
        void shouldLimitHighIntensity() {
            var response = service.optimize(basicRequest());
            var balanced = findPlan(response.getPlans(), "BALANCED");

            assertThat(balanced.getIntensityDistribution().getHigh()).isLessThanOrEqualTo(30);
        }
    }

    @Nested
    class PeakAlignment {

        @Test
        void shouldTaperWhenEventIsClose() {
            var request = OptimizePlanRequest.builder()
                    .weeks(3)
                    .trainingDaysPerWeek(4)
                    .targetWeeklyTss(BigDecimal.valueOf(400))
                    .currentCtl(BigDecimal.valueOf(70))
                    .currentAtl(BigDecimal.valueOf(60))
                    .ftp(280)
                    .eventDate(LocalDate.now().plusDays(10))
                    .goalPriority("A")
                    .build();

            var response = service.optimize(request);
            assertThat(response.getStrategy().getFocus()).isEqualTo("TAPER");
        }

        @Test
        void shouldBuildWhenEventIsFar() {
            var request = OptimizePlanRequest.builder()
                    .weeks(8)
                    .trainingDaysPerWeek(4)
                    .targetWeeklyTss(BigDecimal.valueOf(450))
                    .currentCtl(BigDecimal.valueOf(55))
                    .currentAtl(BigDecimal.valueOf(50))
                    .ftp(260)
                    .eventDate(LocalDate.now().plusDays(60))
                    .build();

            var response = service.optimize(request);
            assertThat(response.getStrategy().getFocus()).isEqualTo("BUILD");
        }
    }

    @Nested
    class Confidence {

        @Test
        void shouldReturnConfidenceBetweenZeroAndHundred() {
            var response = service.optimize(basicRequest());
            assertThat(response.getConfidence()).isBetween(0, 100);
        }

        @Test
        void shouldReturnNonNullViolationsList() {
            var response = service.optimize(basicRequest());
            assertThat(response.getConstraintViolations()).isNotNull();
        }
    }

    private OptimizePlanRequest basicRequest() {
        return OptimizePlanRequest.builder()
                .weeks(4)
                .trainingDaysPerWeek(4)
                .targetWeeklyTss(BigDecimal.valueOf(450))
                .currentCtl(BigDecimal.valueOf(55))
                .currentAtl(BigDecimal.valueOf(50))
                .ftp(250)
                .build();
    }

    private PlanResultDto findPlan(List<PlanResultDto> plans, String type) {
        return plans.stream()
                .filter(p -> type.equals(p.getType()))
                .findFirst()
                .orElseThrow();
    }
}
