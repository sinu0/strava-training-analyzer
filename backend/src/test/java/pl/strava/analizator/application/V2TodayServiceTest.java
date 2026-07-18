package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import java.util.List;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.application.dto.ActivitySummaryDto;
import pl.strava.analizator.application.dto.ActivityDataQualityDto;

@ExtendWith(MockitoExtension.class)
class V2TodayServiceTest {

    @Mock private CoachService coachService;
    @Mock private V2ActivityService activityService;
    @Mock private AnalyticsService analyticsService;
    @Mock private TrainingPlanService trainingPlanService;
    @Mock private SyncService syncService;
    @Mock private ActivityDataQualityService dataQualityService;

    private V2TodayService service;

    @BeforeEach
    void setUp() {
        service = new V2TodayService(coachService, activityService, analyticsService,
                trainingPlanService, syncService, dataQualityService);
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
}
