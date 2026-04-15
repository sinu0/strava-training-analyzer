package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.application.dto.DailyOptimalLoadDto;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

class AnalyticsServiceDailyOptimalLoadTest {

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

        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any())).thenReturn(Map.of());
        when(dailyMetricRepository.findNumericSeries(eq("ctl"), any())).thenReturn(Map.of());
        when(dailyMetricRepository.findNumericSeries(eq("atl"), any())).thenReturn(Map.of());
        when(dailyMetricRepository.findNumericSeries(eq("tsb"), any())).thenReturn(Map.of());
    }

    @Test
    void getDailyOptimalLoad_pastRestDaysClearOptimalRangeAndTrainingDaysRedistributeTarget() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(13);
        Set<DayOfWeek> trainingDays = Set.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);

        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any()))
                .thenReturn(createRecurringTssSeries(start, today, trainingDays, BigDecimal.valueOf(90)));
        when(dailyMetricRepository.findNumericSeries(eq("ctl"), any()))
                .thenReturn(createConstantSeries(start, today, BigDecimal.valueOf(60)));
        when(dailyMetricRepository.findNumericSeries(eq("atl"), any()))
                .thenReturn(createConstantSeries(start, today, BigDecimal.valueOf(72)));
        when(dailyMetricRepository.findNumericSeries(eq("tsb"), any()))
                .thenReturn(createConstantSeries(start, today, BigDecimal.valueOf(-12)));

        List<DailyOptimalLoadDto> result = analyticsService.getDailyOptimalLoad(14, 0);

        DailyOptimalLoadDto restDay = result.stream()
                .filter(day -> !day.isFuture())
                .filter(day -> !trainingDays.contains(day.getDate().getDayOfWeek()))
                .findFirst()
                .orElseThrow();
        DailyOptimalLoadDto trainingDay = result.stream()
                .filter(day -> !day.isFuture())
                .filter(day -> trainingDays.contains(day.getDate().getDayOfWeek()))
                .findFirst()
                .orElseThrow();

        assertThat(restDay.getActualTss()).isNull();
        assertThat(restDay.getOptimalMin()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(restDay.getOptimalTarget()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(restDay.getOptimalMax()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(restDay.getDangerThreshold()).isEqualByComparingTo(BigDecimal.ZERO);

        assertThat(trainingDay.getActualTss()).isEqualByComparingTo(BigDecimal.valueOf(90));
        assertThat(trainingDay.getOptimalMin()).isEqualByComparingTo(BigDecimal.valueOf(112.0));
        assertThat(trainingDay.getOptimalTarget()).isEqualByComparingTo(BigDecimal.valueOf(140.0));
        assertThat(trainingDay.getOptimalMax()).isEqualByComparingTo(BigDecimal.valueOf(182.0));
        assertThat(trainingDay.getDangerThreshold()).isEqualByComparingTo(BigDecimal.valueOf(210.0));
    }

    @Test
    void getDailyOptimalLoad_futureProjectionUsesRestDayThenTrainingDayTargets() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(13);
        Set<DayOfWeek> trainingDays = Set.of(
                today.plusDays(2).getDayOfWeek(),
                today.plusDays(4).getDayOfWeek(),
                today.plusDays(6).getDayOfWeek());

        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any()))
                .thenReturn(createRecurringTssSeries(start, today, trainingDays, BigDecimal.valueOf(90)));
        when(dailyMetricRepository.findNumericSeries(eq("ctl"), any()))
                .thenReturn(createConstantSeries(start, today, BigDecimal.valueOf(60)));
        when(dailyMetricRepository.findNumericSeries(eq("atl"), any()))
                .thenReturn(createConstantSeries(start, today, BigDecimal.valueOf(72)));
        when(dailyMetricRepository.findNumericSeries(eq("tsb"), any()))
                .thenReturn(createConstantSeries(start, today, BigDecimal.valueOf(-12)));

        List<DailyOptimalLoadDto> result = analyticsService.getDailyOptimalLoad(14, 2);

        DailyOptimalLoadDto firstFutureDay = result.stream()
                .filter(DailyOptimalLoadDto::isFuture)
                .filter(day -> day.getDate().isEqual(today.plusDays(1)))
                .findFirst()
                .orElseThrow();
        DailyOptimalLoadDto secondFutureDay = result.stream()
                .filter(DailyOptimalLoadDto::isFuture)
                .filter(day -> day.getDate().isEqual(today.plusDays(2)))
                .findFirst()
                .orElseThrow();

        assertThat(firstFutureDay.getProjectedTss()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(firstFutureDay.getOptimalTarget()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(firstFutureDay.getOptimalMax()).isEqualByComparingTo(BigDecimal.ZERO);

        assertThat(secondFutureDay.getProjectedTss()).isEqualByComparingTo(BigDecimal.valueOf(136.7));
        assertThat(secondFutureDay.getOptimalTarget()).isGreaterThan(BigDecimal.ZERO);
        assertThat(secondFutureDay.getOptimalMax()).isGreaterThan(BigDecimal.ZERO);
        assertThat(secondFutureDay.getDangerThreshold()).isGreaterThan(BigDecimal.ZERO);
    }

    private Map<LocalDate, BigDecimal> createRecurringTssSeries(
            LocalDate start,
            LocalDate end,
            Set<DayOfWeek> trainingDays,
            BigDecimal tss) {
        Map<LocalDate, BigDecimal> series = new HashMap<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (trainingDays.contains(date.getDayOfWeek())) {
                series.put(date, tss);
            }
        }
        return series;
    }

    private Map<LocalDate, BigDecimal> createConstantSeries(
            LocalDate start,
            LocalDate end,
            BigDecimal value) {
        Map<LocalDate, BigDecimal> series = new HashMap<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            series.put(date, value);
        }
        return series;
    }
}
