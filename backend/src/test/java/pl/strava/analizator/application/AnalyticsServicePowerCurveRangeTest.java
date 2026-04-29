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
        analyticsService = new AnalyticsService(
                dailyMetricRepository, activityRepository,
                activityMetricRepository, athleteProfileRepository, dailySummaryRepository);

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TimeZone.setDefault(originalTimeZone);
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
