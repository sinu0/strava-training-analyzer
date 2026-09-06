package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.TimeZone;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;

class AnalyticsServicePowerCurveRangeTest {

    private DailyMetricRepository dailyMetricRepository;
    private ActivityRepository activityRepository;
    private ActivityMetricRepository activityMetricRepository;
    private AthleteProfileRepository athleteProfileRepository;
    private DailySummaryRepository dailySummaryRepository;
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
        dailySummaryRepository = mock(DailySummaryRepository.class);
        analyticsService = new AnalyticsService(java.time.Clock.systemDefaultZone(),
                dailyMetricRepository, activityRepository,
                activityMetricRepository, athleteProfileRepository, dailySummaryRepository);

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TimeZone.setDefault(originalTimeZone);
    }

    @Test
    void powerCurveExcludesEstimatedAndUnprovenSources() {
        var measured = pl.strava.analizator.domain.model.Activity.builder().id(java.util.UUID.randomUUID()).deviceWatts(true).build();
        var estimated = pl.strava.analizator.domain.model.Activity.builder().id(java.util.UUID.randomUUID()).deviceWatts(false).build();
        var unknown = pl.strava.analizator.domain.model.Activity.builder().id(java.util.UUID.randomUUID()).build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(measured, estimated, unknown));
        when(activityMetricRepository.findAllByActivityId(measured.getId())).thenReturn(List.of(
                pl.strava.analizator.domain.model.MetricResult.json("power_curve", java.util.Map.of("efforts", java.util.Map.of("1200", 200)))));
        var curve = analyticsService.getPowerCurve(LocalDate.now(), LocalDate.now());
        assertThat(curve.getEfforts()).containsEntry(1200, 200.0);
        org.mockito.Mockito.verify(activityMetricRepository, org.mockito.Mockito.never()).findAllByActivityId(estimated.getId());
        org.mockito.Mockito.verify(activityMetricRepository, org.mockito.Mockito.never()).findAllByActivityId(unknown.getId());
    }

    @Test
    void unverifiedHistoryRequiresOptInAndIsExplicitlyLabeled() {
        var unknown = pl.strava.analizator.domain.model.Activity.builder().id(java.util.UUID.randomUUID()).build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(unknown));
        when(activityMetricRepository.findAllByActivityId(unknown.getId())).thenReturn(List.of(
                pl.strava.analizator.domain.model.MetricResult.json("power_curve", java.util.Map.of("efforts", java.util.Map.of("1200", 200)))));
        var curve = analyticsService.getPowerCurve(LocalDate.now(), LocalDate.now(), true);
        assertThat(curve.getEfforts()).containsEntry(1200, 200.0);
        assertThat(curve.getSource()).isEqualTo("MIXED_UNVERIFIED");
        assertThat(curve.getUnknownSourceActivities()).isEqualTo(1);
        assertThat(curve.getMeasuredActivities()).isZero();
    }

    @Test
    void getPowerCurveUsesSelectedDateBoundariesInSystemTimezone() {
        analyticsService.getPowerCurve(LocalDate.of(2024, 7, 15), LocalDate.of(2024, 7, 15));

        ArgumentCaptor<OffsetDateTime> fromCaptor = ArgumentCaptor.forClass(OffsetDateTime.class);
        ArgumentCaptor<OffsetDateTime> toCaptor = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(activityRepository).findByStartedAtBetween(fromCaptor.capture(), toCaptor.capture());

        assertThat(fromCaptor.getValue()).isEqualTo(OffsetDateTime.parse("2024-07-15T00:00:00+02:00"));
        assertThat(toCaptor.getValue()).isEqualTo(OffsetDateTime.parse("2024-07-16T00:00:00+02:00"));
    }
}
