package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.application.dto.ActivitySummaryDto;
import pl.strava.analizator.application.dto.ActivityDataQualityDto;
import pl.strava.analizator.application.dto.AdaptiveCoachResponse;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

@ExtendWith(MockitoExtension.class)
class V2TodayServiceTest {

    @Mock private CoachService coachService;
    @Mock private V2ActivityService activityService;
    @Mock private AnalyticsService analyticsService;
    @Mock private TrainingPlanService trainingPlanService;
    @Mock private SyncService syncService;
    @Mock private ActivityDataQualityService dataQualityService;
    @Mock private DailyMetricRepository dailyMetricRepository;
    @Mock private AthleteProfileRepository athleteProfileRepository;
    @Mock private HealthService healthService;

    private V2TodayService service;

    @BeforeEach
    void setUp() {
        service = new V2TodayService(coachService, activityService, analyticsService,
                trainingPlanService, syncService, dataQualityService, dailyMetricRepository,
                athleteProfileRepository, healthService);
    }

    @Test
    void noDataIsUnknownAndNeverPresentedAsZeroLoad() {
        when(activityService.findActivities(isNull(), isNull(), any(), anyInt(), anyInt()))
                .thenReturn(ActivitySummaryPageDto.builder().items(List.of()).build());
        when(analyticsService.getPmc(any(), any())).thenReturn(List.of());
        when(trainingPlanService.getPlans(any(), any())).thenReturn(List.of());
        when(syncService.getLastSyncStatus())
                .thenReturn(new SyncService.SyncStatus("idle", null, 0, 0, null));
        when(coachService.getTodayDecision()).thenThrow(new IllegalStateException("no data"));

        var result = service.getToday();

        assertThat(result.getDataStatus()).isEqualTo("UNKNOWN");
        assertThat(result.getLoad()).isNull();
        assertThat(result.getRecommendation()).isNull();
        assertThat(result.getConfidence().getLevel()).isEqualTo("LOW");
        assertThat(result.getConfidence().getReasons()).isNotEmpty();
    }

    @Test
    void partialLatestActivityQualityIsVisibleAndCannotProduceHighConfidence() {
        UUID activityId = UUID.randomUUID();
        ActivitySummaryDto activity = ActivitySummaryDto.builder()
                .id(activityId).name("Test").startedAt(OffsetDateTime.now()).build();
        when(activityService.findActivities(isNull(), isNull(), any(), anyInt(), anyInt()))
                .thenReturn(ActivitySummaryPageDto.builder().items(List.of(activity)).build());
        when(dataQualityService.get(activityId)).thenReturn(ActivityDataQualityDto.builder()
                .activityId(activityId).status("PARTIAL").issues(List.of("MISSING_TRAINING_STREAM")).build());
        when(analyticsService.getPmc(any(), any())).thenReturn(List.of());
        when(trainingPlanService.getPlans(any(), any())).thenReturn(List.of());
        when(syncService.getLastSyncStatus())
                .thenReturn(new SyncService.SyncStatus("completed", null, 0, 0, null));
        when(coachService.getTodayDecision()).thenThrow(new IllegalStateException("no recommendation"));

        var result = service.getToday();

        assertThat(result.getDataStatus()).isEqualTo("PARTIAL");
        assertThat(result.getConfidence().getLevel()).isNotEqualTo("HIGH");
        assertThat(result.getEvidence()).anyMatch(item -> "DATA_QUALITY".equals(item.getCode()));
    }

    @Test
    void lowLoadCoveragePreventsHighConfidenceEvenWhenPmcHasNumbers() {
        UUID activityId = UUID.randomUUID();
        LocalDate today = LocalDate.now();
        ActivitySummaryDto activity = ActivitySummaryDto.builder()
                .id(activityId).name("Test").startedAt(OffsetDateTime.now()).build();
        when(activityService.findActivities(isNull(), isNull(), any(), anyInt(), anyInt()))
                .thenReturn(ActivitySummaryPageDto.builder().items(List.of(activity)).build());
        when(dataQualityService.get(activityId)).thenReturn(ActivityDataQualityDto.builder()
                .activityId(activityId).status("AVAILABLE").issues(List.of()).build());
        when(analyticsService.getPmc(any(), any())).thenReturn(List.of(PmcDataDto.builder()
                .date(today).ctl(BigDecimal.valueOf(42)).atl(BigDecimal.valueOf(50))
                .tsb(BigDecimal.valueOf(-8)).build()));
        when(dailyMetricRepository.findNumericSeries(org.mockito.ArgumentMatchers.eq("training_load_coverage"), any()))
                .thenReturn(Map.of(today, BigDecimal.valueOf(0.4)));
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(AthleteProfile.builder()
                .ftpWatts((short) 230).lthrBpm((short) 171).build()));
        when(healthService.getRecoveryStatus(today)).thenReturn(
                new HealthService.RecoveryStatus(75, "AVAILABLE", "dobra", "ok", List.of()));
        when(trainingPlanService.getPlans(any(), any())).thenReturn(List.of());
        when(syncService.getLastSyncStatus()).thenReturn(new SyncService.SyncStatus("completed", null, 0, 0, null));
        when(coachService.getTodayDecision()).thenReturn(AdaptiveCoachResponse.builder()
                .decision("TRAIN").reasoning(List.of()).insight("Trening")
                .bestSession(AdaptiveCoachResponse.SessionOptionDto.builder()
                        .type("ENDURANCE").durationMinutes(60).targetTss(50).description("Spokojnie").build())
                .build());

        var result = service.getToday();

        assertThat(result.getConfidence().getLevel()).isEqualTo("MEDIUM");
        assertThat(result.getConfidence().getReasons()).anyMatch(reason -> reason.contains("40%"));
        assertThat(result.getDataStatus()).isEqualTo("PARTIAL");
    }
}
