package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TimeZone;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import pl.strava.analizator.application.dto.WeeklyMmpDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

class AnalyticsServiceWeeklyMmpTest {

    private DailyMetricRepository dailyMetricRepository;
    private ActivityRepository activityRepository;
    private ActivityMetricRepository activityMetricRepository;
    private AthleteProfileRepository athleteProfileRepository;
    private AnalyticsService analyticsService;
    private TimeZone originalTimeZone;

    @BeforeEach
    void setUp() {
        originalTimeZone = TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Warsaw"));

        dailyMetricRepository = mock(DailyMetricRepository.class);
        activityRepository = mock(ActivityRepository.class);
        activityMetricRepository = mock(ActivityMetricRepository.class);
        athleteProfileRepository = mock(AthleteProfileRepository.class);
        analyticsService = new AnalyticsService(
                dailyMetricRepository, activityRepository,
                activityMetricRepository, athleteProfileRepository);
    }

    @AfterEach
    void tearDown() {
        TimeZone.setDefault(originalTimeZone);
    }

    @Test
    void getWeeklyMmp_emptyDateRange_returnsEmptyList() {
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());

        List<WeeklyMmpDto> result = analyticsService.getWeeklyMmp(
                LocalDate.of(2024, 6, 1), LocalDate.of(2024, 6, 30));

        assertThat(result).isEmpty();
    }

    @Test
    void getWeeklyMmp_activitiesGroupedByWeek() {
        // Two activities in the same week (Mon 2024-07-08 to Sun 2024-07-14)
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        OffsetDateTime mon = LocalDate.of(2024, 7, 8)
                .atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime().plusHours(10);
        OffsetDateTime wed = LocalDate.of(2024, 7, 10)
                .atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime().plusHours(10);

        Activity a1 = Activity.builder().id(id1).startedAt(mon).build();
        Activity a2 = Activity.builder().id(id2).startedAt(wed).build();

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(a1, a2));

        // Activity 1: 5min best = 300W
        Map<String, Object> curve1 = Map.of("efforts", Map.of("300", 300.0));
        when(activityMetricRepository.findJsonValue(eq(id1), eq("power_curve")))
                .thenReturn(Optional.of(curve1));

        // Activity 2: 5min best = 320W (higher)
        Map<String, Object> curve2 = Map.of("efforts", Map.of("300", 320.0));
        when(activityMetricRepository.findJsonValue(eq(id2), eq("power_curve")))
                .thenReturn(Optional.of(curve2));

        List<WeeklyMmpDto> result = analyticsService.getWeeklyMmp(
                LocalDate.of(2024, 7, 1), LocalDate.of(2024, 7, 14));

        assertThat(result).hasSize(1);
        WeeklyMmpDto week = result.get(0);
        assertThat(week.weekStart()).isEqualTo(LocalDate.of(2024, 7, 8));
        assertThat(week.weekLabel()).isEqualTo("2024-W28");
        // Should pick the max: 320W
        assertThat(week.bestEfforts().get("5min")).isEqualTo(320);
    }

    @Test
    void getWeeklyMmp_twoWeeks_returnsTwoEntries() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        OffsetDateTime week1 = LocalDate.of(2024, 7, 8)
                .atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime().plusHours(10);
        OffsetDateTime week2 = LocalDate.of(2024, 7, 15)
                .atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime().plusHours(10);

        Activity a1 = Activity.builder().id(id1).startedAt(week1).build();
        Activity a2 = Activity.builder().id(id2).startedAt(week2).build();

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(a1, a2));

        Map<String, Object> curve = Map.of("efforts", Map.of("60", 400.0, "300", 280.0));
        when(activityMetricRepository.findJsonValue(any(), eq("power_curve")))
                .thenReturn(Optional.of(curve));

        List<WeeklyMmpDto> result = analyticsService.getWeeklyMmp(
                LocalDate.of(2024, 7, 1), LocalDate.of(2024, 7, 21));

        assertThat(result).hasSize(2);
        assertThat(result.get(0).weekStart()).isEqualTo(LocalDate.of(2024, 7, 8));
        assertThat(result.get(1).weekStart()).isEqualTo(LocalDate.of(2024, 7, 15));
        assertThat(result.get(0).bestEfforts().get("1min")).isEqualTo(400);
        assertThat(result.get(0).bestEfforts().get("5min")).isEqualTo(280);
    }

    @Test
    void getWeeklyMmp_activityWithoutPowerCurve_skipped() {
        UUID id1 = UUID.randomUUID();
        OffsetDateTime time = LocalDate.of(2024, 7, 8)
                .atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime().plusHours(10);

        Activity a1 = Activity.builder().id(id1).startedAt(time).build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(a1));
        when(activityMetricRepository.findJsonValue(eq(id1), eq("power_curve")))
                .thenReturn(Optional.empty());

        List<WeeklyMmpDto> result = analyticsService.getWeeklyMmp(
                LocalDate.of(2024, 7, 1), LocalDate.of(2024, 7, 14));

        assertThat(result).isEmpty();
    }

    @Test
    void getWPrimeBalance_returnsStoredMetric() {
        UUID activityId = UUID.randomUUID();
        Map<String, Object> stored = Map.of(
                "wPrime", 15000.0,
                "criticalPower", 190.0,
                "minBalance", 3000.0);
        when(activityMetricRepository.findJsonValue(eq(activityId), eq("w_prime_balance")))
                .thenReturn(Optional.of(stored));

        Map<String, Object> result = analyticsService.getWPrimeBalance(activityId);

        assertThat(result).containsEntry("wPrime", 15000.0);
        assertThat(result).containsEntry("criticalPower", 190.0);
    }

    @Test
    void getWPrimeBalance_missingMetric_returnsEmptyMap() {
        UUID activityId = UUID.randomUUID();
        when(activityMetricRepository.findJsonValue(eq(activityId), eq("w_prime_balance")))
                .thenReturn(Optional.empty());

        Map<String, Object> result = analyticsService.getWPrimeBalance(activityId);

        assertThat(result).isEmpty();
    }
}
