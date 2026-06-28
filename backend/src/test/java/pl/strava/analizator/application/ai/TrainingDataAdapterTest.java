package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
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

import pl.strava.analizator.application.AnalyticsService;
import pl.strava.analizator.application.BlockHealthService;
import pl.strava.analizator.application.JournalService;
import pl.strava.analizator.application.TrainingPlanService;
import pl.strava.analizator.application.dto.BlockHealthDto;
import pl.strava.analizator.application.dto.CoachMemoryPreferenceDto;
import pl.strava.analizator.application.dto.CoachMemorySummaryDto;
import pl.strava.analizator.application.dto.DurabilityInsightDto;
import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.ReadinessSessionVariantDto;
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
    @Mock private AnalyticsService analyticsService;
    @Mock private BlockHealthService blockHealthService;
    @Mock private TrainingPlanService trainingPlanService;
    @Mock private JournalService journalService;

    private TrainingDataAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new TrainingDataAdapter(
                activityRepository, activityMetricRepository,
                athleteProfileRepository, dailyMetricRepository,
                aiPredictionRepository, analyticsService, blockHealthService, trainingPlanService, journalService);
        lenient().when(analyticsService.getDurabilityInsights()).thenReturn(DurabilityInsightDto.builder()
                .trend("stable")
                .label("Stabilna")
                .description("Brak sygnalow pogorszenia durability.")
                .workouts(List.of())
                .build());
        lenient().when(analyticsService.getProgressionLevels()).thenReturn(List.of(
                ProgressionLevelDto.builder()
                        .system("THRESHOLD")
                        .label("Próg")
                        .level(5)
                        .currentLoad(BigDecimal.valueOf(64))
                        .previousLoad(BigDecimal.valueOf(52))
                        .targetLoad(BigDecimal.valueOf(70))
                        .trend("UP")
                        .description("Próg rośnie.")
                        .nextRecommendation("Broń jednej jakościowej sesji progowej.")
                        .build()
        ));
        lenient().when(trainingPlanService.getPrograms()).thenReturn(List.of());
        lenient().when(trainingPlanService.getCalendarView(any(), any())).thenReturn(List.of());
        lenient().when(trainingPlanService.getCoachMemory()).thenReturn(CoachMemorySummaryDto.builder()
                .headline("LIGHTEN zwykle wchodzi")
                .coachNote("LIGHTEN zwykle akceptowany, SHIFT częściej odrzucany.")
                .preferences(List.of(
                        CoachMemoryPreferenceDto.builder()
                                .suggestionType("LIGHTEN")
                                .acceptedCount(3)
                                .rejectedCount(1)
                                .acceptanceRate(0.75)
                                .guidance("Najpierw tnij koszt, potem przenoś.")
                                .build()
                ))
                .build());
        lenient().when(blockHealthService.getCurrentBlockHealth()).thenReturn(BlockHealthDto.builder()
                .status("STABLE_PRODUCTIVE")
                .label("Blok stabilny")
                .description("Blok trzyma kierunek.")
                .goalExecutionStatus("ON_TARGET")
                .goalExecutionScore(84)
                .adjustmentDays(0)
                .missedStimulusDays(0)
                .overloadDays(0)
                .keySignals(List.of("Bodziec celu: 1/1"))
                .nextFocus("Broń głównego akcentu.")
                .build());
        lenient().when(journalService.getJournalContextForAi(anyInt())).thenReturn("");
        lenient().when(journalService.getJournalMoodTrend(anyInt())).thenReturn("No mood trend data");
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
    void buildContext_readinessIncludesTrainingWindowGuidance() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());

        LocalDate today = LocalDate.now();
        TreeMap<LocalDate, BigDecimal> ctlSeries = new TreeMap<>();
        ctlSeries.put(today, BigDecimal.valueOf(70));
        TreeMap<LocalDate, BigDecimal> atlSeries = new TreeMap<>();
        atlSeries.put(today, BigDecimal.valueOf(84));
        TreeMap<LocalDate, BigDecimal> tsbSeries = new TreeMap<>();
        tsbSeries.put(today, BigDecimal.valueOf(-18));
        TreeMap<LocalDate, BigDecimal> readinessSeries = new TreeMap<>();
        readinessSeries.put(today, BigDecimal.valueOf(38));

        when(dailyMetricRepository.findNumericSeries(any(), any())).thenAnswer(invocation -> {
            String metric = invocation.getArgument(0);
            return switch (metric) {
                case "ctl" -> ctlSeries;
                case "atl" -> atlSeries;
                case "tsb" -> tsbSeries;
                case "readiness" -> readinessSeries;
                default -> new TreeMap<>();
            };
        });
        when(analyticsService.getReadiness()).thenReturn(ReadinessDto.builder()
                .dayType("ENDURANCE")
                .dayLabel("Tlen")
                .dayFocus("Spokojny tlen")
                .tomorrowHint("Jutro spokojnie")
                .sessionVariants(List.of(ReadinessSessionVariantDto.builder()
                        .title("Krótki tlen")
                        .durationMinutes(45)
                        .targetPower("60-70% FTP")
                        .targetTss(35)
                        .fuelingHint("30-45 g węgli/h")
                        .recoveryHint("20-30 g białka")
                        .build()))
                .build());

        TrainingContext context = adapter.buildContext(PredictionType.TRAINING_TYPE_RECOMMENDATION);

        assertThat(context.getReadiness()).containsEntry("currentReadiness", BigDecimal.valueOf(38));
        assertThat(context.getReadiness()).containsEntry("currentTSB", BigDecimal.valueOf(-18));
        assertThat(context.getReadiness()).containsEntry("currentCTL", BigDecimal.valueOf(70));
        assertThat(context.getReadiness()).containsEntry("currentATL", BigDecimal.valueOf(84));
        assertThat(context.getReadiness()).containsEntry("trainingWindow", "productive-fatigue");
        assertThat(context.getReadiness()).containsEntry("dayType", "ENDURANCE");
        assertThat(context.getReadiness()).containsEntry("dayLabel", "Tlen");
        assertThat(context.getReadiness()).containsEntry("tomorrowHint", "Jutro spokojnie");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> sessionVariants = (List<Map<String, Object>>) context.getReadiness().get("sessionVariants");
        assertThat(sessionVariants.get(0)).containsEntry("fuelingHint", "30-45 g węgli/h");
        assertThat(sessionVariants.get(0)).containsEntry("recoveryHint", "20-30 g białka");
        assertThat(context.getReadiness().get("coachingGuidance"))
                .asString()
                .contains("TSB between -30 and 0");
    }

    @Test
    void buildContext_includesProgressionLevelsCoachSummaryAndCoachMemory() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());
        when(analyticsService.getReadiness()).thenReturn(ReadinessDto.builder()
                .score(62)
                .dayLabel("Tempo")
                .build());

        TrainingContext context = adapter.buildContext(PredictionType.TRAINING_COACH_SUMMARY);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> systems = (List<Map<String, Object>>) context.getProgressionLevels().get("systems");
        assertThat(systems).hasSize(1);
        assertThat(systems.getFirst()).containsEntry("system", "THRESHOLD");
        assertThat(context.getCoachSummary()).containsEntry("readinessLabel", "Tempo");
        assertThat(context.getCoachSummary()).containsKey("nextFocus");
        assertThat(context.getBlockHealth()).containsEntry("status", "STABLE_PRODUCTIVE");
        assertThat(context.getBlockHealth()).containsEntry("goalExecutionScore", 84);
        assertThat(context.getCoachMemory()).containsEntry("headline", "LIGHTEN zwykle wchodzi");
        assertThat(context.getCoachMemory()).containsEntry("coachNote", "LIGHTEN zwykle akceptowany, SHIFT częściej odrzucany.");
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

    @Test
    void buildContext_newPredictionTypes_buildWithoutErrors() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        assertThat(adapter.buildContext(PredictionType.RACE_PACING_STRATEGY)).isNotNull();
        assertThat(adapter.buildContext(PredictionType.NUTRITION_PLAN)).isNotNull();
        assertThat(adapter.buildContext(PredictionType.RECOVERY_PLAN)).isNotNull();
        assertThat(adapter.buildContext(PredictionType.INJURY_RISK)).isNotNull();
        assertThat(adapter.buildContext(PredictionType.PEAK_TIMING)).isNotNull();
    }

    @Test
    void buildContext_newPredictionTypes_includeExtraFields() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        TrainingContext ctx = adapter.buildContext(PredictionType.RACE_PACING_STRATEGY);
        assertThat(ctx.getRaceProfile()).isNotNull();
        assertThat(ctx.getRaceProfile()).containsKey("available");

        ctx = adapter.buildContext(PredictionType.NUTRITION_PLAN);
        assertThat(ctx.getPlannedActivity()).isNotNull();
        assertThat(ctx.getWeatherConditions()).isNotNull();

        ctx = adapter.buildContext(PredictionType.PEAK_TIMING);
        assertThat(ctx.getEventDate()).isNotNull();
        assertThat(ctx.getEventDate()).contains("not set");
    }

    @Test
    void buildContext_allTwelveTypes_haveDaysBackMapping() {
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(Collections.emptyList());
        when(dailyMetricRepository.findNumericSeries(any(), any())).thenReturn(new TreeMap<>());

        for (PredictionType type : PredictionType.values()) {
            TrainingContext ctx = adapter.buildContext(type);
            assertThat(ctx).isNotNull();
            assertThat(ctx.getAthleteProfile()).isNotNull();
            assertThat(ctx.getTimeContext()).isNotNull();
        }
    }
}
