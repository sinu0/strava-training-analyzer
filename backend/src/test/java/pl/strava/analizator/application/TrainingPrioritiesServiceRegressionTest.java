package pl.strava.analizator.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;

@ExtendWith(MockitoExtension.class)
class TrainingPrioritiesServiceRegressionTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository activityMetricRepository;
    @Mock private DailyMetricRepository dailyMetricRepository;
    @Mock private AthleteProfileRepository athleteProfileRepository;
    @Mock private DailySummaryRepository dailySummaryRepository;

    @Test
    void fatigueUsesCanonicalDailyTssMetric() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(
                AthleteProfile.builder().ftpWatts((short) 280).weightKg(BigDecimal.valueOf(75)).build()));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(Map.of());

        new TrainingPrioritiesService(activityRepository, activityMetricRepository,
                dailyMetricRepository, athleteProfileRepository, dailySummaryRepository).getPriorities();

        verify(dailyMetricRepository).findNumericSeries(
                org.mockito.ArgumentMatchers.eq("daily_tss"), any());
    }

    @Test
    void steadyEnduranceRideIsNotClassifiedAsIntervalSession() {
        int[] steadyPower = new int[600];
        Arrays.fill(steadyPower, 240);
        TrainingPrioritiesService service = serviceWithActivities(List.of(activity(steadyPower)));

        var result = service.getPriorities();

        org.assertj.core.api.Assertions.assertThat(result.getIntervalDetection().getTotalIntervalSessions()).isZero();
    }

    @Test
    void repeatedShortSprintsAreClassifiedAsNeuromuscularIntervals() {
        int[] power = new int[240];
        Arrays.fill(power, 120);
        for (int start : List.of(30, 90, 150)) {
            Arrays.fill(power, start, start + 10, 500);
        }
        TrainingPrioritiesService service = serviceWithActivities(List.of(activity(power)));

        var result = service.getPriorities();

        org.assertj.core.api.Assertions.assertThat(result.getIntervalDetection().getSessionsByType())
                .containsEntry("NEUROMUSCULAR", 1);
    }

    private TrainingPrioritiesService serviceWithActivities(List<Activity> activities) {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(
                AthleteProfile.builder().ftpWatts((short) 280).weightKg(BigDecimal.valueOf(75)).build()));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(activities);
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(Map.of());
        return new TrainingPrioritiesService(activityRepository, activityMetricRepository,
                dailyMetricRepository, athleteProfileRepository, dailySummaryRepository);
    }

    private Activity activity(int[] power) {
        return Activity.builder()
                .id(UUID.randomUUID())
                .startedAt(OffsetDateTime.of(2026, 7, 1, 8, 0, 0, 0, ZoneOffset.UTC))
                .movingTimeSec(power.length)
                .powerStream(power)
                .build();
    }
}
