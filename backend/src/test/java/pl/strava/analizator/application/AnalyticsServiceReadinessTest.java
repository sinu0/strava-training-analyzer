package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.application.dto.DurabilityInsightDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;

class AnalyticsServiceReadinessTest {

    private DailyMetricRepository dailyMetricRepository;
    private DailySummaryRepository dailySummaryRepository;
    private AthleteProfileRepository athleteProfileRepository;
    private ActivityRepository activityRepository;
    private ActivityMetricRepository activityMetricRepository;
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        dailyMetricRepository = mock(DailyMetricRepository.class);
        dailySummaryRepository = mock(DailySummaryRepository.class);
        activityRepository = mock(ActivityRepository.class);
        activityMetricRepository = mock(ActivityMetricRepository.class);
        athleteProfileRepository = mock(AthleteProfileRepository.class);
        analyticsService = new AnalyticsService(
                dailyMetricRepository,
                activityRepository,
                activityMetricRepository,
                athleteProfileRepository,
                dailySummaryRepository);
    }

    @Test
    void getReadiness_productiveFatigue_returnsEnduranceDayType() {
        stubReadiness(BigDecimal.valueOf(-18), BigDecimal.valueOf(70), BigDecimal.valueOf(84));

        ReadinessDto readiness = analyticsService.getReadiness();

        assertThat(readiness.getScore()).isEqualTo(49);
        assertThat(readiness.getDayType()).isEqualTo("ENDURANCE");
        assertThat(readiness.getDayLabel()).isEqualTo("Tlen");
        assertThat(readiness.getDayFocus()).contains("trening tlenowy");
        assertThat(readiness.getSessionVariants()).hasSize(3);
        assertThat(readiness.getSessionVariants().get(0).getDurationMinutes()).isEqualTo(45);
        assertThat(readiness.getSessionVariants().get(0).getFuelingHint()).contains("30-45 g węgli/h");
        assertThat(readiness.getSessionVariants().get(0).getRecoveryHint()).contains("20-30 g białka");
        assertThat(readiness.getTomorrowHint()).contains("tempo");
        assertThat(readiness.getBestQualityWindowLabel()).isIn("Jutro", "Pojutrze");
        assertThat(readiness.getQualityWindowSummary()).contains("okno jakości");
        assertThat(readiness.getQualityWindows()).hasSize(3);
        assertThat(readiness.getQualityWindows().stream().map(window -> window.getRecommendation()))
                .contains("BEST_QUALITY");
    }

    @Test
    void getReadiness_freshState_returnsHighIntensityDayType() {
        stubReadiness(BigDecimal.valueOf(14), BigDecimal.valueOf(68), BigDecimal.valueOf(58));

        ReadinessDto readiness = analyticsService.getReadiness();

        assertThat(readiness.getScore()).isEqualTo(85);
        assertThat(readiness.getDayType()).isEqualTo("HIGH_INTENSITY");
        assertThat(readiness.getDayLabel()).isEqualTo("Mocny bodziec");
        assertThat(readiness.getDayFocus()).contains("interwały");
        assertThat(readiness.getSessionVariants()).hasSize(3);
        assertThat(readiness.getSessionVariants().get(0).getTitle()).contains("VO2");
        assertThat(readiness.getSessionVariants().get(0).getFuelingHint()).contains("60-80 g węgli/h");
        assertThat(readiness.getSessionVariants().get(0).getRecoveryHint()).contains("węgle");
        assertThat(readiness.getTomorrowHint()).contains("regeneracja");
        assertThat(readiness.getBestQualityWindowLabel()).isEqualTo("Dziś");
        assertThat(readiness.getQualityWindows()).hasSize(3);
        assertThat(readiness.getQualityWindows().get(0).getRecommendation()).isEqualTo("BEST_QUALITY");
    }

    @Test
    void getReadiness_healthSignalsReduceScoreAndExposeSnapshot() {
        LocalDate today = stubReadiness(BigDecimal.valueOf(-5), BigDecimal.valueOf(70), BigDecimal.valueOf(68));
        when(dailySummaryRepository.findByDate(today)).thenReturn(Optional.of(DailySummary.builder()
                .date(today)
                .sleepScore((short) 52)
                .bodyBattery((short) 30)
                .restingHrBpm((short) 58)
                .build()));
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(AthleteProfile.builder()
                .restingHrBpm((short) 50)
                .build()));

        ReadinessDto readiness = analyticsService.getReadiness();

        assertThat(readiness.getScore()).isEqualTo(53);
        assertThat(readiness.getDayType()).isEqualTo("ENDURANCE");
        assertThat(readiness.getHealthSignals()).isNotNull();
        assertThat(readiness.getHealthSignals().getSleepScore()).isEqualTo((short) 52);
        assertThat(readiness.getHealthSignals().getBodyBattery()).isEqualTo((short) 30);
        assertThat(readiness.getHealthSignals().getScoreAdjustment()).isEqualTo(-22);
    }

    @Test
    void getReadiness_checkInImprovesScoreEvenWhenTsbStillCapsDayType() {
        LocalDate today = stubReadiness(BigDecimal.valueOf(-18), BigDecimal.valueOf(70), BigDecimal.valueOf(84));
        when(dailySummaryRepository.findByDate(today)).thenReturn(Optional.of(DailySummary.builder()
                .date(today)
                .checkInSleepQuality((short) 5)
                .checkInLegFreshness((short) 5)
                .checkInMotivation((short) 5)
                .checkInSoreness((short) 1)
                .checkInUpdatedAt(Instant.parse("2026-04-25T06:30:00Z"))
                .build()));
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());

        ReadinessDto readiness = analyticsService.getReadiness();

        assertThat(readiness.getScore()).isEqualTo(69);
        assertThat(readiness.getDayType()).isEqualTo("ENDURANCE");
        assertThat(readiness.getCheckIn()).isNotNull();
        assertThat(readiness.getCheckIn().getScoreAdjustment()).isEqualTo(20);
        assertThat(readiness.getCheckIn().getUpdatedAt()).isEqualTo(Instant.parse("2026-04-25T06:30:00Z"));
    }

    @Test
    void getDurabilityInsights_buildsStableSummaryFromRecentLongRides() {
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .name("Long endurance")
                .sportType("Ride")
                .startedAt(OffsetDateTime.now(ZoneOffset.UTC).minusDays(3))
                .movingTimeSec(2 * 60 * 60)
                .build();
        when(activityRepository.findByStartedAtBetween(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(List.of(activityId), "tss"))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(120)));
        when(activityMetricRepository.findNumericValues(List.of(activityId), "aerobic_decoupling"))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(3.2)));
        when(activityMetricRepository.findNumericValues(List.of(activityId), "power_fade"))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(2.4)));

        DurabilityInsightDto durability = analyticsService.getDurabilityInsights();

        assertThat(durability.getTrend()).isEqualTo("STABLE");
        assertThat(durability.getLabel()).isEqualTo("Trzymasz końcówkę");
        assertThat(durability.getAvgAerobicDecoupling()).isEqualByComparingTo(BigDecimal.valueOf(3.20));
        assertThat(durability.getAvgPowerFade()).isEqualByComparingTo(BigDecimal.valueOf(2.40));
        assertThat(durability.getAvgDurabilityScore()).isEqualTo(80);
        assertThat(durability.getWorkouts()).singleElement()
                .extracting("durationMin", "durabilityScore")
                .containsExactly(120, 80);
    }

    private LocalDate stubReadiness(BigDecimal tsb, BigDecimal ctl, BigDecimal atl) {
        LocalDate today = LocalDate.now();
        when(dailyMetricRepository.findNumericValue(eq(today), eq("tsb"))).thenReturn(Optional.of(tsb));
        when(dailyMetricRepository.findNumericValue(eq(today), eq("ctl"))).thenReturn(Optional.of(ctl));
        when(dailyMetricRepository.findNumericValue(eq(today), eq("atl"))).thenReturn(Optional.of(atl));
        when(dailyMetricRepository.findNumericValue(eq(today.minusDays(1)), eq("tsb"))).thenReturn(Optional.empty());
        when(dailyMetricRepository.findNumericValue(eq(today.minusDays(1)), eq("ctl"))).thenReturn(Optional.empty());
        when(dailyMetricRepository.findNumericValue(eq(today.minusDays(1)), eq("atl"))).thenReturn(Optional.empty());
        when(dailySummaryRepository.findByDate(today.minusDays(1))).thenReturn(Optional.empty());
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        return today;
    }
}
