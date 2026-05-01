package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.PerformancePredictionRequest;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.PerformanceIndicatorsDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.RecoverySignalsDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.RecentTrendsDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.RecentWorkoutDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest.TrainingLoadStateDto;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;

@ExtendWith(MockitoExtension.class)
class PerformancePredictionServiceTest {

    @Mock
    private DailyMetricRepository dailyMetricRepository;
    @Mock
    private AthleteProfileRepository athleteProfileRepository;
    @Mock
    private DailySummaryRepository dailySummaryRepository;
    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private PerformancePredictionService service;

    @Test
    void shouldBeInjected() {
        assertThat(service).isNotNull();
    }

    @Nested
    class FormClassification {

        @Test
        void shouldClassifyPeakWhenHighCtlPositiveTsbAndLowFatigue() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(85))
                            .atl(BigDecimal.valueOf(70))
                            .tsb(BigDecimal.valueOf(12))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("STABLE")
                            .fatigueTrend("DOWN")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getFormState()).isEqualTo("PEAK");
        }

        @Test
        void shouldClassifyBuildingWhenRisingCtl() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(65))
                            .atl(BigDecimal.valueOf(70))
                            .tsb(BigDecimal.valueOf(-5))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("UP")
                            .fatigueTrend("STABLE")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getFormState()).isEqualTo("BUILDING");
        }

        @Test
        void shouldClassifyFatiguedWhenHighAtlAndNegativeTsb() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(60))
                            .atl(BigDecimal.valueOf(90))
                            .tsb(BigDecimal.valueOf(-20))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("DOWN")
                            .fatigueTrend("UP")
                            .build())
                    .recoverySignals(RecoverySignalsDto.builder()
                            .hrvTrend("DOWN")
                            .restingHrTrend("UP")
                            .sleepQuality("POOR")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getFormState()).isEqualTo("FATIGUED");
        }

        @Test
        void shouldClassifyDetrainedWhenLowCtlAndFalling() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(35))
                            .atl(BigDecimal.valueOf(30))
                            .tsb(BigDecimal.valueOf(5))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("DOWN")
                            .fatigueTrend("DOWN")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getFormState()).isEqualTo("DETRAINED");
        }
    }

    @Nested
    class ReadinessScore {

        @Test
        void shouldReturnHighReadinessWhenFreshAndRecovered() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(80))
                            .atl(BigDecimal.valueOf(60))
                            .tsb(BigDecimal.valueOf(15))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .fatigueTrend("DOWN")
                            .build())
                    .recoverySignals(RecoverySignalsDto.builder()
                            .hrvTrend("UP")
                            .restingHrTrend("DOWN")
                            .sleepQuality("GOOD")
                            .build())
                    .recentWorkouts(List.of(
                            RecentWorkoutDto.builder().outcome("OVERACHIEVE").build()
                    ))
                    .build();

            var response = service.predict(request);

            assertThat(response.getReadinessScore()).isGreaterThanOrEqualTo(75);
        }

        @Test
        void shouldReturnLowReadinessWhenFatigued() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(55))
                            .atl(BigDecimal.valueOf(85))
                            .tsb(BigDecimal.valueOf(-25))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .fatigueTrend("UP")
                            .build())
                    .recoverySignals(RecoverySignalsDto.builder()
                            .hrvTrend("DOWN")
                            .restingHrTrend("UP")
                            .sleepQuality("POOR")
                            .build())
                    .recentWorkouts(List.of(
                            RecentWorkoutDto.builder().outcome("FAIL").build()
                    ))
                    .build();

            var response = service.predict(request);

            assertThat(response.getReadinessScore()).isLessThanOrEqualTo(35);
        }

        @Test
        void shouldReturnModerateReadinessForBalancedState() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(70))
                            .atl(BigDecimal.valueOf(72))
                            .tsb(BigDecimal.valueOf(-2))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .fatigueTrend("STABLE")
                            .build())
                    .recoverySignals(RecoverySignalsDto.builder()
                            .hrvTrend("STABLE")
                            .restingHrTrend("STABLE")
                            .sleepQuality("AVERAGE")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getReadinessScore()).isBetween(40, 70);
        }
    }

    @Nested
    class PeakWindow {

        @Test
        void shouldPredictPeakSoonWhenTsbPositive() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(80))
                            .atl(BigDecimal.valueOf(75))
                            .tsb(BigDecimal.valueOf(5))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .fatigueTrend("DOWN")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getPeakWindow().getStartInDays()).isBetween(1, 5);
            assertThat(response.getPeakWindow().getDurationDays()).isBetween(1, 7);
        }

        @Test
        void shouldPredictPeakLaterWhenHighlyFatigued() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(65))
                            .atl(BigDecimal.valueOf(100))
                            .tsb(BigDecimal.valueOf(-25))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .fatigueTrend("UP")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getPeakWindow().getStartInDays()).isGreaterThanOrEqualTo(5);
        }
    }

    @Nested
    class PerformancePrediction {

        @Test
        void shouldPredictFtpBasedOnCtlAndTrend() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(75))
                            .atl(BigDecimal.valueOf(65))
                            .tsb(BigDecimal.valueOf(8))
                            .build())
                    .performanceIndicators(PerformanceIndicatorsDto.builder()
                            .ftp(BigDecimal.valueOf(280))
                            .ftpTrend("UP")
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("UP")
                            .fatigueTrend("STABLE")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getPerformancePrediction().getFtp()).isGreaterThan(280);
            assertThat(response.getPerformancePrediction().getPower20min()).isGreaterThanOrEqualTo(280);
        }

        @Test
        void shouldPredictLowerFtpWhenFatigued() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(60))
                            .atl(BigDecimal.valueOf(95))
                            .tsb(BigDecimal.valueOf(-20))
                            .build())
                    .performanceIndicators(PerformanceIndicatorsDto.builder()
                            .ftp(BigDecimal.valueOf(250))
                            .ftpTrend("DOWN")
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("DOWN")
                            .fatigueTrend("UP")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getPerformancePrediction().getFtp()).isLessThan(250);
        }
    }

    @Nested
    class TaperRecommendations {

        @Test
        void shouldRecommendTaperWhenNearPeak() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(82))
                            .atl(BigDecimal.valueOf(70))
                            .tsb(BigDecimal.valueOf(10))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("STABLE")
                            .fatigueTrend("DOWN")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getRecommendations()).anyMatch(r -> r.toLowerCase().contains("reduce volume"));
            assertThat(response.getRecommendations()).anyMatch(r -> r.toLowerCase().contains("maintaining intensity"));
        }

        @Test
        void shouldRecommendRestWhenFatigued() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(55))
                            .atl(BigDecimal.valueOf(95))
                            .tsb(BigDecimal.valueOf(-22))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .fatigueTrend("UP")
                            .build())
                    .recoverySignals(RecoverySignalsDto.builder()
                            .hrvTrend("DOWN")
                            .sleepQuality("POOR")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getRecommendations()).anyMatch(r -> r.contains("rest") || r.contains("recovery"));
        }

        @Test
        void shouldRecommendBuildingWhenDetrained() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(30))
                            .atl(BigDecimal.valueOf(25))
                            .tsb(BigDecimal.valueOf(8))
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("DOWN")
                            .fatigueTrend("DOWN")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getRecommendations()).anyMatch(r -> r.contains("build") || r.contains("increase"));
        }
    }

    @Nested
    class Confidence {

        @Test
        void shouldReturnHighConfidenceWithCompleteData() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(75))
                            .atl(BigDecimal.valueOf(65))
                            .tsb(BigDecimal.valueOf(8))
                            .build())
                    .performanceIndicators(PerformanceIndicatorsDto.builder()
                            .ftp(BigDecimal.valueOf(280))
                            .ftpTrend("UP")
                            .tte(45)
                            .build())
                    .recoverySignals(RecoverySignalsDto.builder()
                            .hrvTrend("UP")
                            .restingHrTrend("STABLE")
                            .sleepQuality("GOOD")
                            .build())
                    .recentTrends(RecentTrendsDto.builder()
                            .ctlTrend("UP")
                            .fatigueTrend("DOWN")
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getConfidence()).isGreaterThanOrEqualTo(80);
        }

        @Test
        void shouldReturnLowerConfidenceWithMinimalData() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(65))
                            .atl(BigDecimal.valueOf(60))
                            .tsb(BigDecimal.valueOf(5))
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getConfidence()).isLessThanOrEqualTo(80);
        }
    }

    @Nested
    class EdgeCases {

        @Test
        void shouldHandleNullValuesGracefully() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder().build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getFormState()).isNotNull();
            assertThat(response.getReadinessScore()).isBetween(0, 100);
            assertThat(response.getPeakWindow()).isNotNull();
            assertThat(response.getPerformancePrediction()).isNotNull();
            assertThat(response.getRecommendations()).isNotNull();
            assertThat(response.getConfidence()).isBetween(0, 100);
        }

        @Test
        void shouldHandleExtremeTsbValues() {
            var request = PerformancePredictionRequest.builder()
                    .trainingLoad(TrainingLoadStateDto.builder()
                            .ctl(BigDecimal.valueOf(100))
                            .atl(BigDecimal.valueOf(140))
                            .tsb(BigDecimal.valueOf(-35))
                            .build())
                    .build();

            var response = service.predict(request);

            assertThat(response.getReadinessScore()).isLessThanOrEqualTo(30);
            assertThat(response.getFormState()).isEqualTo("FATIGUED");
        }
    }
}
