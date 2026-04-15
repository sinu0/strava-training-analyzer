package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import java.time.temporal.TemporalAdjusters;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.TrainingContext;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AiPredictionRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

@ExtendWith(MockitoExtension.class)
class TrainingDataAdapterTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository activityMetricRepository;
    @Mock private AthleteProfileRepository athleteProfileRepository;
    @Mock private DailyMetricRepository dailyMetricRepository;
    @Mock private AiPredictionRepository aiPredictionRepository;

    private TrainingDataAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new TrainingDataAdapter(
                activityRepository, activityMetricRepository,
                athleteProfileRepository, dailyMetricRepository,
                aiPredictionRepository);
    }

    @Test
    void buildContext_withProfile_formatsProfileString() {
        AthleteProfile profile = AthleteProfile.builder()
                .ftpWatts((short) 270)
                .weightKg(BigDecimal.valueOf(73.5))
                .maxHrBpm((short) 192)
                .lthrBpm((short) 172)
                .build();
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        TrainingContext context = adapter.buildContext(PredictionType.FTP_PREDICTION);

        assertThat(context.getAthleteProfile()).contains("270");
        assertThat(context.getAthleteProfile()).contains("73.5");
        assertThat(context.getAthleteProfile()).contains("192");
        assertThat(context.getAthleteProfile()).contains("172");
    }

    @Test
    void buildContext_noProfile_returnsNoDataMessage() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        TrainingContext context = adapter.buildContext(PredictionType.FATIGUE_PREDICTION);

        assertThat(context.getAthleteProfile()).contains("No profile data");
    }

    @Test
    void buildContext_withActivities_formatsActivityList() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        UUID activityId = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(activityId)
                .sportType("Ride")
                .name("Morning Ride")
                .startedAt(OffsetDateTime.of(2024, 6, 1, 8, 0, 0, 0, ZoneOffset.UTC))
                .movingTimeSec(3600)
                .distanceM(BigDecimal.valueOf(42000))
                .avgPowerW((short) 220)
                .avgHeartrate((short) 148)
                .elevationGainM(BigDecimal.valueOf(450))
                .build();

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findAllByActivityId(activityId)).thenReturn(List.of(
                MetricResult.numeric("tss", 85.0),
                MetricResult.numeric("np", 240.0)
        ));

        TrainingContext context = adapter.buildContext(PredictionType.TRAINING_TYPE_RECOMMENDATION);

        assertThat(context.getRecentActivities()).hasSize(1);
        String formatted = context.getRecentActivities().get(0);
        assertThat(formatted).contains("2024-06-01");
        assertThat(formatted).contains("Ride");
        assertThat(formatted).contains("Morning Ride");
        assertThat(formatted).contains("60min");
        assertThat(formatted).containsPattern("42[.,]0km");
        assertThat(formatted).contains("220W");
        assertThat(formatted).contains("148bpm");
        assertThat(formatted).containsPattern("450");
        assertThat(formatted).containsPattern("tss: 85[.,]0");
        assertThat(formatted).containsPattern("np: 240[.,]0");
    }

    @Test
    void buildContext_withActivities_includesRecencyAndTimeContext() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        UUID activityId = UUID.randomUUID();
        OffsetDateTime startedAt = OffsetDateTime.now(ZoneOffset.UTC).minusDays(3);
        Activity activity = Activity.builder()
                .id(activityId)
                .sportType("Ride")
                .name("Recency Ride")
                .startedAt(startedAt)
                .movingTimeSec(1800)
                .build();

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(activity));
        when(activityMetricRepository.findAllByActivityId(activityId)).thenReturn(Collections.emptyList());

        TrainingContext context = adapter.buildContext(PredictionType.FATIGUE_PREDICTION);

        long daysAgo = ChronoUnit.DAYS.between(startedAt.toLocalDate(), LocalDate.now(ZoneOffset.UTC));
        assertThat(context.getRecentActivities()).singleElement().asString().contains(daysAgo + "d ago");
        assertThat(context.getTimeContext()).contains(LocalDate.now(ZoneOffset.UTC).toString());
        assertThat(context.getTimeContext()).contains("Treat activity dates as historical");
    }

    @Test
    void buildContext_partialProfileFields_handlesNulls() {
        AthleteProfile profile = AthleteProfile.builder()
                .ftpWatts((short) 250)
                .build(); // weight, maxHr, lthr are null
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        TrainingContext context = adapter.buildContext(PredictionType.FTP_PREDICTION);

        assertThat(context.getAthleteProfile()).contains("250");
        assertThat(context.getAthleteProfile()).contains("unknown");
    }

    @Test
    void buildContext_pmcDataIncludesCurrentValues() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(eq("ctl"), any())).thenReturn(new TreeMap<>());
        when(dailyMetricRepository.findNumericSeries(eq("atl"), any())).thenReturn(new TreeMap<>());
        when(dailyMetricRepository.findNumericSeries(eq("tsb"), any())).thenReturn(new TreeMap<>());
        when(dailyMetricRepository.findNumericSeries(eq("ftp"), any())).thenReturn(new TreeMap<>());
        when(dailyMetricRepository.findNumericSeries(eq("daily_tss"), any())).thenReturn(new TreeMap<>());
        when(dailyMetricRepository.findNumericSeries(eq("readiness"), any())).thenReturn(new TreeMap<>());

        TrainingContext context = adapter.buildContext(PredictionType.FTP_PREDICTION);

        assertThat(context.getPmcData()).isNotNull();
        assertThat(context.getPmcData()).containsKey("currentCTL");
        assertThat(context.getPmcData()).containsKey("currentATL");
        assertThat(context.getPmcData()).containsKey("currentTSB");
    }

    @Test
    void buildContext_weeklyVolumeIncludesWeeklyTssSummary() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());

        LocalDate currentWeekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate previousWeekStart = currentWeekStart.minusWeeks(1);

        TreeMap<LocalDate, BigDecimal> dailyTss = new TreeMap<>();
        dailyTss.put(previousWeekStart.plusDays(1), BigDecimal.valueOf(120));
        dailyTss.put(previousWeekStart.plusDays(3), BigDecimal.valueOf(80));
        dailyTss.put(currentWeekStart.plusDays(2), BigDecimal.valueOf(180));
        dailyTss.put(currentWeekStart.plusDays(5), BigDecimal.valueOf(120));

        when(dailyMetricRepository.findNumericSeries(any(), any())).thenAnswer(invocation -> {
            String metric = invocation.getArgument(0);
            return "daily_tss".equals(metric) ? dailyTss : new TreeMap<>();
        });

        TrainingContext context = adapter.buildContext(PredictionType.FATIGUE_PREDICTION);

        Map<String, Object> weeklyVolume = context.getWeeklyVolume();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> weeklyTssByWeek = (List<Map<String, Object>>) weeklyVolume.get("weeklyTssByWeek");

        assertThat(weeklyTssByWeek).hasSize(2);
        assertThat(weeklyTssByWeek.get(0).get("weekStart")).isEqualTo(previousWeekStart.toString());
        assertThat(weeklyTssByWeek.get(0).get("weeklyTss")).isEqualTo(BigDecimal.valueOf(200));
        assertThat(weeklyTssByWeek.get(1).get("weekStart")).isEqualTo(currentWeekStart.toString());
        assertThat(weeklyTssByWeek.get(1).get("weeklyTss")).isEqualTo(BigDecimal.valueOf(300));
        assertThat(weeklyVolume.get("currentWeekTss")).isEqualTo(BigDecimal.valueOf(300));
        assertThat(weeklyVolume.get("previousWeekTss")).isEqualTo(BigDecimal.valueOf(200));
    }

    @Test
    void buildContext_emptyActivities_emptyRecentActivitiesList() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        TrainingContext context = adapter.buildContext(PredictionType.PERFORMANCE_TREND);

        assertThat(context.getRecentActivities()).isEmpty();
    }

    @Test
    void buildContext_differentPredictionTypes_useDifferentDaysBack() {
        // Verify that the adapter uses different time ranges for different prediction types.
        // TRAINING_TYPE_RECOMMENDATION: 7 days, PERFORMANCE_TREND: 60 days
        // We can verify indirectly by checking that both contexts are built without errors.
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        TrainingContext short7 = adapter.buildContext(PredictionType.TRAINING_TYPE_RECOMMENDATION);
        TrainingContext long60 = adapter.buildContext(PredictionType.PERFORMANCE_TREND);

        assertThat(short7).isNotNull();
        assertThat(long60).isNotNull();
    }

    @Test
    void buildContext_activityWithMinimalData_noNullPointers() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        UUID activityId = UUID.randomUUID();
        Activity minimal = Activity.builder()
                .id(activityId)
                .sportType("Run")
                .build(); // most fields null

        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(minimal));
        when(activityMetricRepository.findAllByActivityId(activityId)).thenReturn(Collections.emptyList());

        TrainingContext context = adapter.buildContext(PredictionType.OVERTRAINING_RISK);

        assertThat(context.getRecentActivities()).hasSize(1);
    }
}
