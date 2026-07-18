package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.metrics.calculator.CtlAtlTsbCalculator;
import pl.strava.analizator.domain.metrics.calculator.TrainingMonotonyCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

@ExtendWith(MockitoExtension.class)
class DailyMetricsServiceTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository activityMetricRepository;
    @Mock private AthleteProfileRepository athleteProfileRepository;
    @Mock private DailyMetricRepository dailyMetricRepository;

    private DailyMetricsService service;

    @BeforeEach
    void setUp() {
        service = new DailyMetricsService(
                activityRepository,
                activityMetricRepository,
                athleteProfileRepository,
                dailyMetricRepository,
                new CtlAtlTsbCalculator(),
                new TrainingMonotonyCalculator());
    }

    @Test
    void recalculateAll_savesDerivedDailyMetrics() {
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(OffsetDateTime.of(2024, 6, 1, 8, 0, 0, 0, ZoneOffset.UTC))
                .build();

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findNumericValue(activityId, "training_stress_score"))
                .thenReturn(Optional.of(BigDecimal.valueOf(75)));
        when(athleteProfileRepository.findFirst())
                .thenReturn(Optional.of(AthleteProfile.builder().ftpWatts((short) 280).build()));

        service.recalculateAll();

        verify(dailyMetricRepository, atLeastOnce()).save(any(), any());
        verify(dailyMetricRepository, atLeastOnce()).saveAll(any(), any());
    }

    /**
     * KEY FTP BUG: When profile has ftpWatts set (e.g. imported from Strava),
     * FTP estimation from activity power curves must still run and its result saved to
     * daily_metric — so that the FTP history reflects actual training progression.
     * The profile FTP is only a floor (minimum), not a static override.
     */
    @Test
    void recalculateAll_savesEstimatedFtpFromPowerCurves_evenWhenProfileFtpIsSet() {
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(OffsetDateTime.of(2024, 6, 1, 8, 0, 0, 0, ZoneOffset.UTC))
                .build();

        // Profile has old Strava FTP = 200W
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 200).build();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));

        // Activity has power_curve with a 20-min best of 300W → estimated FTP ≈ 300 * 0.87 = 261W
        Map<String, Object> powerCurve = Map.of("efforts", Map.of("1200", 300.0));
        when(activityMetricRepository.findJsonValue(activityId, "power_curve"))
                .thenReturn(Optional.of(powerCurve));

        service.recalculateAll();

        // FTP saved to daily_metric must reflect the ESTIMATED value (261W), not the static profile 200W
        ArgumentCaptor<MetricResult> metricCaptor = ArgumentCaptor.forClass(MetricResult.class);
        verify(dailyMetricRepository, atLeastOnce()).save(any(), metricCaptor.capture());

        double savedFtp = metricCaptor.getAllValues().stream()
                .filter(m -> "ftp".equals(m.getMetricName()))
                .mapToDouble(m -> m.getNumericValue().doubleValue())
                .findFirst()
                .orElse(-1.0);

        // Estimated = 300 * 0.87 = 261W > profile 200W → saved value should be ~261 (not 200)
        assertThat(savedFtp).isGreaterThan(250.0);
    }

    @Test
    void recalculateAll_usesBetterOfProfileOrEstimatedFtp_forTssCalculations() {
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .movingTimeSec(3600)
                .startedAt(OffsetDateTime.of(2024, 6, 1, 8, 0, 0, 0, ZoneOffset.UTC))
                .build();

        // Profile FTP = 300W (from formal test), power_curve shows 250W 20-min → estimate 217W
        // Effective FTP for TSS should use max(300, 217) = 300W
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 300).build();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));

        Map<String, Object> powerCurve = Map.of("efforts", Map.of("1200", 250.0));
        when(activityMetricRepository.findJsonValue(activityId, "power_curve"))
                .thenReturn(Optional.of(powerCurve));

        // TSS and HR-TSS not available; NP available for TSS estimation (lenient: may not be reached)
        when(activityMetricRepository.findNumericValue(activityId, "training_stress_score"))
                .thenReturn(Optional.empty());
        when(activityMetricRepository.findNumericValue(activityId, "hr_training_stress_score"))
                .thenReturn(Optional.empty());
        // normalized_power is needed for estimateTssFromNp — lenient because path depends on tss lookup
        org.mockito.Mockito.lenient()
                .when(activityMetricRepository.findNumericValue(activityId, "normalized_power"))
                .thenReturn(Optional.of(BigDecimal.valueOf(270)));

        service.recalculateAll();

        // Verify FTP saved = max(300, 217) = 300
        ArgumentCaptor<MetricResult> metricCaptor = ArgumentCaptor.forClass(MetricResult.class);
        verify(dailyMetricRepository, atLeastOnce()).save(any(), metricCaptor.capture());

        double savedFtp = metricCaptor.getAllValues().stream()
                .filter(m -> "ftp".equals(m.getMetricName()))
                .mapToDouble(m -> m.getNumericValue().doubleValue())
                .findFirst()
                .orElse(-1.0);

        assertThat(savedFtp).isGreaterThanOrEqualTo(300.0);
    }

    @Test
    void recalculateAll_usesProfileFtpAsFloor_whenEstimateIsLowerThanProfileFtp() {
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(OffsetDateTime.of(2024, 6, 1, 8, 0, 0, 0, ZoneOffset.UTC))
                .build();

        // Profile FTP = 320W (formal test), 20-min best = 300W → estimate 261W < profile
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 320).build();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));

        Map<String, Object> powerCurve = Map.of("efforts", Map.of("1200", 300.0));
        when(activityMetricRepository.findJsonValue(activityId, "power_curve"))
                .thenReturn(Optional.of(powerCurve));

        service.recalculateAll();

        ArgumentCaptor<MetricResult> metricCaptor = ArgumentCaptor.forClass(MetricResult.class);
        verify(dailyMetricRepository, atLeastOnce()).save(any(), metricCaptor.capture());

        double savedFtp = metricCaptor.getAllValues().stream()
                .filter(m -> "ftp".equals(m.getMetricName()))
                .mapToDouble(m -> m.getNumericValue().doubleValue())
                .findFirst()
                .orElse(-1.0);

        // Profile 320W > estimate 261W → saved value should be 320 (floor = profile)
        assertThat(savedFtp).isGreaterThanOrEqualTo(320.0);
    }

    @Test
    void recalculateAll_doesNotSaveFtp_whenNoPowerDataAndNoProfileFtp() {
        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(OffsetDateTime.of(2024, 6, 1, 8, 0, 0, 0, ZoneOffset.UTC))
                .build();

        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findJsonValue(activityId, "power_curve"))
                .thenReturn(Optional.empty());
        when(activityMetricRepository.findNumericValue(eq(activityId), any()))
                .thenReturn(Optional.empty());

        service.recalculateAll();

        // No FTP should be saved if estimation returns 0 and no profile FTP
        verify(dailyMetricRepository, never()).save(any(),
                argThat(m -> "ftp".equals(m.getMetricName())));
    }

    @Test
    void backfillFtpHistory_doesNotLeakCurrentProfileFtpIntoHistoricalDates() {
        UUID activityId = UUID.randomUUID();
        LocalDate historicalDate = LocalDate.of(2024, 6, 1);
        Activity activity = Activity.builder()
                .id(activityId)
                .startedAt(historicalDate.atStartOfDay().atOffset(ZoneOffset.UTC))
                .build();
        when(activityMetricRepository.findJsonValue(activityId, "power_curve"))
                .thenReturn(Optional.of(Map.of("efforts", Map.of("1200", 300.0))));

        service.backfillFtpHistory(List.of(activity), 320.0);

        verify(dailyMetricRepository).save(eq(historicalDate), argThat(metric ->
                "ftp".equals(metric.getMetricName())
                        && metric.getNumericValue().doubleValue() < 300.0));
        verify(dailyMetricRepository).save(eq(LocalDate.now(ZoneOffset.UTC)), argThat(metric ->
                "ftp".equals(metric.getMetricName())
                        && metric.getNumericValue().doubleValue() == 320.0));
    }
}
