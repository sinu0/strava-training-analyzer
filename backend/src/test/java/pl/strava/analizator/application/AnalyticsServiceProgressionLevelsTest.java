package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;

class AnalyticsServiceProgressionLevelsTest {

    private ActivityRepository activityRepository;
    private ActivityMetricRepository activityMetricRepository;
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        DailyMetricRepository dailyMetricRepository = mock(DailyMetricRepository.class);
        activityRepository = mock(ActivityRepository.class);
        activityMetricRepository = mock(ActivityMetricRepository.class);
        AthleteProfileRepository athleteProfileRepository = mock(AthleteProfileRepository.class);
        DailySummaryRepository dailySummaryRepository = mock(DailySummaryRepository.class);
        analyticsService = new AnalyticsService(
                dailyMetricRepository,
                activityRepository,
                activityMetricRepository,
                athleteProfileRepository,
                dailySummaryRepository);

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        when(activityMetricRepository.findNumericValues(any(), any())).thenReturn(Map.of());
    }

    @Test
    void getProgressionLevels_comparesCurrentAndPreviousBlockAcrossSystems() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        UUID thresholdCurrentId = UUID.randomUUID();
        UUID thresholdPreviousId = UUID.randomUUID();
        UUID vo2CurrentId = UUID.randomUUID();
        UUID longEnduranceId = UUID.randomUUID();

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(
                Activity.builder()
                        .id(thresholdCurrentId)
                        .sportType("Ride")
                        .startedAt(today.minusDays(5).atTime(8, 0).atOffset(ZoneOffset.UTC))
                        .movingTimeSec(75 * 60)
                        .build(),
                Activity.builder()
                        .id(thresholdPreviousId)
                        .sportType("Ride")
                        .startedAt(today.minusDays(28).atTime(8, 0).atOffset(ZoneOffset.UTC))
                        .movingTimeSec(50 * 60)
                        .build(),
                Activity.builder()
                        .id(vo2CurrentId)
                        .sportType("Ride")
                        .startedAt(today.minusDays(3).atTime(8, 0).atOffset(ZoneOffset.UTC))
                        .movingTimeSec(60 * 60)
                        .build(),
                Activity.builder()
                        .id(longEnduranceId)
                        .sportType("Ride")
                        .startedAt(today.minusDays(2).atTime(8, 0).atOffset(ZoneOffset.UTC))
                        .movingTimeSec(180 * 60)
                        .build()
        ));
        when(activityMetricRepository.findNumericValues(any(), eq("intensity_factor"))).thenReturn(Map.of(
                thresholdCurrentId, BigDecimal.valueOf(0.96),
                thresholdPreviousId, BigDecimal.valueOf(0.90),
                vo2CurrentId, BigDecimal.valueOf(1.08),
                longEnduranceId, BigDecimal.valueOf(0.72)
        ));
        when(activityMetricRepository.findNumericValues(any(), eq("aerobic_decoupling"))).thenReturn(Map.of(
                longEnduranceId, BigDecimal.valueOf(4.2)
        ));

        List<ProgressionLevelDto> progressionLevels = analyticsService.getProgressionLevels();

        assertThat(progressionLevels).hasSize(3);
        ProgressionLevelDto threshold = progressionLevels.stream()
                .filter(level -> "THRESHOLD".equals(level.getSystem()))
                .findFirst()
                .orElseThrow();
        ProgressionLevelDto vo2 = progressionLevels.stream()
                .filter(level -> "VO2".equals(level.getSystem()))
                .findFirst()
                .orElseThrow();
        ProgressionLevelDto longEndurance = progressionLevels.stream()
                .filter(level -> "LONG_ENDURANCE".equals(level.getSystem()))
                .findFirst()
                .orElseThrow();

        assertThat(threshold.getCurrentLoad()).isGreaterThan(threshold.getPreviousLoad());
        assertThat(threshold.getTrend()).isEqualTo("UP");
        assertThat(vo2.getLevel()).isGreaterThan(0);
        assertThat(longEndurance.getDescription()).contains("Długi");
    }
}
