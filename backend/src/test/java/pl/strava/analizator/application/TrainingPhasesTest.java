package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.application.dto.RaceReadinessProjection;
import pl.strava.analizator.application.dto.TrainingPhaseAnalysis;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

class TrainingPhasesTest {

    private DailyMetricRepository dailyMetricRepository;
    private ActivityRepository activityRepository;
    private ActivityMetricRepository activityMetricRepository;
    private AthleteProfileRepository athleteProfileRepository;
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        dailyMetricRepository = mock(DailyMetricRepository.class);
        activityRepository = mock(ActivityRepository.class);
        activityMetricRepository = mock(ActivityMetricRepository.class);
        athleteProfileRepository = mock(AthleteProfileRepository.class);
        analyticsService = new AnalyticsService(
                dailyMetricRepository, activityRepository,
                activityMetricRepository, athleteProfileRepository);

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(Map.of());
    }

    @Test
    void detectsRecoveryPhaseOnLowVolume() {
        // 5 weeks of data: first 4 weeks have TSS ~400 each, week 5 has TSS ~100 (< 60% of avg)
        LocalDate monday = LocalDate.now().minusWeeks(5).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate to = monday.plusWeeks(5).minusDays(1);

        Map<LocalDate, BigDecimal> dailyTss = new HashMap<>();
        Map<LocalDate, BigDecimal> ctlSeries = new HashMap<>();
        Map<LocalDate, BigDecimal> atlSeries = new HashMap<>();
        Map<LocalDate, BigDecimal> tsbSeries = new HashMap<>();

        // Weeks 1-4: ~57 TSS/day = ~400/week
        for (int w = 0; w < 4; w++) {
            for (int d = 0; d < 7; d++) {
                LocalDate date = monday.plusWeeks(w).plusDays(d);
                dailyTss.put(date, BigDecimal.valueOf(57));
                ctlSeries.put(date, BigDecimal.valueOf(50));
                atlSeries.put(date, BigDecimal.valueOf(55));
                tsbSeries.put(date, BigDecimal.valueOf(-5));
            }
        }
        // Week 5: very low TSS (~14/day = ~100/week, which is < 60% of ~400 avg)
        for (int d = 0; d < 7; d++) {
            LocalDate date = monday.plusWeeks(4).plusDays(d);
            dailyTss.put(date, BigDecimal.valueOf(14));
            ctlSeries.put(date, BigDecimal.valueOf(45));
            atlSeries.put(date, BigDecimal.valueOf(20));
            tsbSeries.put(date, BigDecimal.valueOf(25)); // TSB > 10
        }

        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any())).thenReturn(dailyTss);
        when(dailyMetricRepository.findNumericSeries(eq("ctl"), any())).thenReturn(ctlSeries);
        when(dailyMetricRepository.findNumericSeries(eq("atl"), any())).thenReturn(atlSeries);
        when(dailyMetricRepository.findNumericSeries(eq("tsb"), any())).thenReturn(tsbSeries);

        TrainingPhaseAnalysis result = analyticsService.detectTrainingPhases(monday, to);

        assertThat(result.phases()).isNotEmpty();
        String lastPhase = result.phases().get(result.phases().size() - 1).phase();
        assertThat(lastPhase).isEqualTo("RECOVERY");
        assertThat(result.currentPhase()).isEqualTo("RECOVERY");
    }

    @Test
    void detectsBuildPhaseOnRisingLoad() {
        // 5 weeks where CTL and volume are both rising with moderate IF
        LocalDate monday = LocalDate.now().minusWeeks(5).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate to = monday.plusWeeks(5).minusDays(1);

        Map<LocalDate, BigDecimal> dailyTss = new HashMap<>();
        Map<LocalDate, BigDecimal> ctlSeries = new HashMap<>();
        Map<LocalDate, BigDecimal> atlSeries = new HashMap<>();
        Map<LocalDate, BigDecimal> tsbSeries = new HashMap<>();

        for (int w = 0; w < 5; w++) {
            double weekCtl = 30 + w * 5; // Rising: 30, 35, 40, 45, 50
            for (int d = 0; d < 7; d++) {
                LocalDate date = monday.plusWeeks(w).plusDays(d);
                dailyTss.put(date, BigDecimal.valueOf(50 + w * 8)); // Rising TSS
                ctlSeries.put(date, BigDecimal.valueOf(weekCtl));
                atlSeries.put(date, BigDecimal.valueOf(weekCtl + 5));
                tsbSeries.put(date, BigDecimal.valueOf(-5));
            }
        }

        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any())).thenReturn(dailyTss);
        when(dailyMetricRepository.findNumericSeries(eq("ctl"), any())).thenReturn(ctlSeries);
        when(dailyMetricRepository.findNumericSeries(eq("atl"), any())).thenReturn(atlSeries);
        when(dailyMetricRepository.findNumericSeries(eq("tsb"), any())).thenReturn(tsbSeries);

        // Activities with rising duration and moderate IF (0.68-0.72)
        java.util.List<Activity> activities = new java.util.ArrayList<>();
        for (int w = 0; w < 5; w++) {
            for (int d = 0; d < 3; d++) {
                Activity a = Activity.builder()
                        .id(java.util.UUID.randomUUID())
                        .startedAt(monday.plusWeeks(w).plusDays(d * 2)
                                .atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                        .movingTimeSec((90 + w * 10) * 60) // Rising duration in minutes
                        .build();
                activities.add(a);
                when(activityMetricRepository.findNumericValue(a.getId(), "intensity_factor"))
                        .thenReturn(Optional.of(BigDecimal.valueOf(0.68 + w * 0.01)));
            }
        }
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(activities);

        TrainingPhaseAnalysis result = analyticsService.detectTrainingPhases(monday, to);

        assertThat(result.phases()).isNotEmpty();
        String lastPhase = result.phases().get(result.phases().size() - 1).phase();
        assertThat(lastPhase).isEqualTo("BUILD");
    }

    @Test
    void detectsBasePhaseOnLowIntensity() {
        // Low IF (<0.65) with rising CTL and stable/rising volume
        LocalDate monday = LocalDate.now().minusWeeks(5).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate to = monday.plusWeeks(5).minusDays(1);

        Map<LocalDate, BigDecimal> dailyTss = new HashMap<>();
        Map<LocalDate, BigDecimal> ctlSeries = new HashMap<>();
        Map<LocalDate, BigDecimal> atlSeries = new HashMap<>();
        Map<LocalDate, BigDecimal> tsbSeries = new HashMap<>();

        for (int w = 0; w < 5; w++) {
            double weekCtl = 25 + w * 3; // Slowly rising CTL
            for (int d = 0; d < 7; d++) {
                LocalDate date = monday.plusWeeks(w).plusDays(d);
                dailyTss.put(date, BigDecimal.valueOf(40 + w * 3));
                ctlSeries.put(date, BigDecimal.valueOf(weekCtl));
                atlSeries.put(date, BigDecimal.valueOf(weekCtl + 2));
                tsbSeries.put(date, BigDecimal.valueOf(-2));
            }
        }

        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any())).thenReturn(dailyTss);
        when(dailyMetricRepository.findNumericSeries(eq("ctl"), any())).thenReturn(ctlSeries);
        when(dailyMetricRepository.findNumericSeries(eq("atl"), any())).thenReturn(atlSeries);
        when(dailyMetricRepository.findNumericSeries(eq("tsb"), any())).thenReturn(tsbSeries);

        // Activities with low IF (<0.65) and stable duration
        java.util.List<Activity> activities = new java.util.ArrayList<>();
        for (int w = 0; w < 5; w++) {
            for (int d = 0; d < 4; d++) {
                Activity a = Activity.builder()
                        .id(java.util.UUID.randomUUID())
                        .startedAt(monday.plusWeeks(w).plusDays(d)
                                .atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                        .movingTimeSec((120 + w * 5) * 60) // Stable/rising duration
                        .build();
                activities.add(a);
                when(activityMetricRepository.findNumericValue(a.getId(), "intensity_factor"))
                        .thenReturn(Optional.of(BigDecimal.valueOf(0.55 + w * 0.01))); // Low IF: 0.55-0.59
            }
        }
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(activities);

        TrainingPhaseAnalysis result = analyticsService.detectTrainingPhases(monday, to);

        assertThat(result.phases()).isNotEmpty();
        String lastPhase = result.phases().get(result.phases().size() - 1).phase();
        assertThat(lastPhase).isEqualTo("BASE");
    }

    @Test
    void emptyDataReturnsEmptyPhases() {
        LocalDate from = LocalDate.now().minusWeeks(4);
        LocalDate to = LocalDate.now();

        TrainingPhaseAnalysis result = analyticsService.detectTrainingPhases(from, to);

        assertThat(result.phases()).allSatisfy(p -> {
            assertThat(p.totalTss()).isEqualTo(0.0);
        });
        assertThat(result.recommendation()).isNotBlank();
    }

    @Test
    void projectsRaceReadinessForward() {
        LocalDate today = LocalDate.now();
        LocalDate raceDate = today.plusDays(14);

        when(dailyMetricRepository.findNumericValue(today, "ctl"))
                .thenReturn(Optional.of(BigDecimal.valueOf(60)));
        when(dailyMetricRepository.findNumericValue(today, "atl"))
                .thenReturn(Optional.of(BigDecimal.valueOf(70)));

        // Recent TSS: ~50/day average
        Map<LocalDate, BigDecimal> recentTss = new HashMap<>();
        for (int i = 0; i < 28; i++) {
            recentTss.put(today.minusDays(i), BigDecimal.valueOf(50));
        }
        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any())).thenReturn(recentTss);

        RaceReadinessProjection result = analyticsService.projectRaceReadiness(raceDate);

        assertThat(result.daysUntilRace()).isEqualTo(14);
        assertThat(result.currentCtl()).isEqualTo(60.0);
        assertThat(result.currentAtl()).isEqualTo(70.0);
        assertThat(result.projections()).hasSize(14);

        // CTL should decay somewhat (taper reduces training load)
        assertThat(result.projectedCtl()).isLessThan(60.0);
        // TSB should rise (fatigue drops faster than fitness during taper)
        assertThat(result.projectedTsb()).isGreaterThan(-10.0);
    }

    @Test
    void taperRecommendationChangesWithDaysOut() {
        String thirtyDays = analyticsService.buildTaperRecommendation(30);
        String sevenDays = analyticsService.buildTaperRecommendation(7);

        assertThat(thirtyDays).contains("Kontynuuj normalny trening");
        assertThat(sevenDays).doesNotContain("Kontynuuj normalny trening");
        assertThat(sevenDays).contains("Zredukuj objętość o 60-70%");
    }

    @Test
    void formAssessmentReflectsTsb() {
        // Positive TSB in ideal range with CTL > 0 → Świetna
        assertThat(analyticsService.assessForm(15.0, 50.0)).isEqualTo("Świetna");
        // TSB barely positive → Dobra
        assertThat(analyticsService.assessForm(2.0, 50.0)).isEqualTo("Dobra");
        // Slightly negative TSB → Przeciętna
        assertThat(analyticsService.assessForm(-5.0, 50.0)).isEqualTo("Przeciętna");
        // Very negative TSB → Zmęczony
        assertThat(analyticsService.assessForm(-15.0, 50.0)).isEqualTo("Zmęczony");
    }
}
