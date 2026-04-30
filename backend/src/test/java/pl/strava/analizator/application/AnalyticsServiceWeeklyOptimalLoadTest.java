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
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.application.dto.WeeklyOptimalLoadDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;

class AnalyticsServiceWeeklyOptimalLoadTest {

    private DailyMetricRepository dailyMetricRepository;
    private ActivityRepository activityRepository;
    private ActivityMetricRepository activityMetricRepository;
    private AthleteProfileRepository athleteProfileRepository;
    private DailySummaryRepository dailySummaryRepository;
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        dailyMetricRepository = mock(DailyMetricRepository.class);
        activityRepository = mock(ActivityRepository.class);
        activityMetricRepository = mock(ActivityMetricRepository.class);
        athleteProfileRepository = mock(AthleteProfileRepository.class);
        dailySummaryRepository = mock(DailySummaryRepository.class);
        analyticsService = new AnalyticsService(
                dailyMetricRepository, activityRepository,
                activityMetricRepository, athleteProfileRepository, dailySummaryRepository);

        // Default: no activities
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        // Default: no daily metrics series
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(Map.of());
        // Default: empty batch metric lookups
        when(activityMetricRepository.findNumericValues(any(), any())).thenReturn(Map.of());
    }

    @Test
    void getWeeklyOptimalLoad_noCtlData_returnsNoDataStatus() {
        when(dailyMetricRepository.findNumericValue(any(), eq("ctl"))).thenReturn(Optional.empty());

        List<WeeklyOptimalLoadDto> result = analyticsService.getWeeklyOptimalLoad(1);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("NO_DATA");
        assertThat(result.get(0).getCtl()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getWeeklyOptimalLoad_actualTssInOptimalRange_returnsOptimalStatus() {
        BigDecimal ctl = BigDecimal.valueOf(50);
        when(dailyMetricRepository.findNumericValue(any(), eq("ctl"))).thenReturn(Optional.of(ctl));

        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(monday.atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                .movingTimeSec(3600)
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(any(), eq("training_stress_score")))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(350)));

        List<WeeklyOptimalLoadDto> result = analyticsService.getWeeklyOptimalLoad(1);

        WeeklyOptimalLoadDto thisWeek = result.stream()
                .filter(w -> !w.getWeekStart().isAfter(monday) && w.getActivityCount() > 0)
                .findFirst()
                .orElseThrow();
        assertThat(thisWeek.getStatus()).isEqualTo("OPTIMAL");
    }

    @Test
    void getWeeklyOptimalLoad_tssOverDangerThreshold_returnsDangerStatus() {
        BigDecimal ctl = BigDecimal.valueOf(50);
        when(dailyMetricRepository.findNumericValue(any(), eq("ctl"))).thenReturn(Optional.of(ctl));

        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(monday.atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                .movingTimeSec(3600)
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(any(), eq("training_stress_score")))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(600)));

        List<WeeklyOptimalLoadDto> result = analyticsService.getWeeklyOptimalLoad(1);

        WeeklyOptimalLoadDto thisWeek = result.stream()
                .filter(w -> !w.getWeekStart().isAfter(monday) && w.getActivityCount() > 0)
                .findFirst()
                .orElseThrow();
        assertThat(thisWeek.getStatus()).isEqualTo("DANGER");
    }

    @Test
    void getWeeklyOptimalLoad_tssUnderOptimalMin_returnsUnderStatus() {
        BigDecimal ctl = BigDecimal.valueOf(50);
        when(dailyMetricRepository.findNumericValue(any(), eq("ctl"))).thenReturn(Optional.of(ctl));

        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(monday.atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                .movingTimeSec(3600)
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValues(any(), eq("training_stress_score")))
                .thenReturn(Map.of(activityId, BigDecimal.valueOf(200)));

        List<WeeklyOptimalLoadDto> result = analyticsService.getWeeklyOptimalLoad(1);

        WeeklyOptimalLoadDto thisWeek = result.stream()
                .filter(w -> !w.getWeekStart().isAfter(monday) && w.getActivityCount() > 0)
                .findFirst()
                .orElseThrow();
        assertThat(thisWeek.getStatus()).isEqualTo("UNDER");
    }

    @Test
    void getWeeklyOptimalLoad_optimalBandsCalculatedCorrectly() {
        BigDecimal ctl = BigDecimal.valueOf(50);
        when(dailyMetricRepository.findNumericValue(any(), eq("ctl"))).thenReturn(Optional.of(ctl));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());

        List<WeeklyOptimalLoadDto> result = analyticsService.getWeeklyOptimalLoad(1);

        WeeklyOptimalLoadDto week = result.get(0);
        assertThat(week.getOptimalMin()).isEqualByComparingTo(BigDecimal.valueOf(280.0));
        assertThat(week.getOptimalTarget()).isEqualByComparingTo(BigDecimal.valueOf(350.0));
        assertThat(week.getOptimalMax()).isEqualByComparingTo(BigDecimal.valueOf(455.0));
        assertThat(week.getDangerThreshold()).isEqualByComparingTo(BigDecimal.valueOf(525.0));
    }

    @Test
    void sumWeeklyTss_usesBatchQuery() {
        BigDecimal ctl = BigDecimal.valueOf(50);
        when(dailyMetricRepository.findNumericValue(any(), eq("ctl"))).thenReturn(Optional.of(ctl));

        LocalDate monday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Activity a1 = Activity.builder()
                .id(id1)
                .startedAt(monday.atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                .movingTimeSec(3600)
                .build();
        Activity a2 = Activity.builder()
                .id(id2)
                .startedAt(monday.plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset()))
                .movingTimeSec(3600)
                .build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(a1, a2));
        when(activityMetricRepository.findNumericValues(any(), eq("training_stress_score")))
                .thenReturn(Map.of(id1, BigDecimal.valueOf(100), id2, BigDecimal.valueOf(150)));

        List<WeeklyOptimalLoadDto> result = analyticsService.getWeeklyOptimalLoad(1);

        WeeklyOptimalLoadDto thisWeek = result.stream()
                .filter(w -> w.getActivityCount() > 0)
                .findFirst()
                .orElseThrow();
        assertThat(thisWeek.getActualTss()).isEqualByComparingTo(BigDecimal.valueOf(250));
    }
}
