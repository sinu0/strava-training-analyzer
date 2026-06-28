package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.ai.AiActivityNoteService;
import pl.strava.analizator.domain.metrics.LapMetricsService;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.ActivityTrainingEffectRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.port.SyncStateRepository;
@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    @Mock private AthleteProfileRepository profileRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository activityMetricRepository;
    @Mock private DailyMetricRepository dailyMetricRepository;
    @Mock private MetricRegistry metricRegistry;
    @Mock private MetricPersistenceService metricPersistenceService;
    @Mock private DailyMetricsService dailyMetricsService;
    @Mock private SyncDataSource syncDataSource;
    @Mock private SyncStateRepository syncStateRepository;
    @Mock private HeatmapBuildService heatmapBuildService;
    @Mock private LapMetricsService lapMetricsService;
    @Mock private WorkoutEvaluationService workoutEvaluationService;
    @Mock private ActivityTrainingEffectRepository trainingEffectRepository;
    @Mock private DailySummaryRepository dailySummaryRepository;
    @Mock private AiActivityNoteService aiActivityNoteService;
    @Mock private AutoSyncConfigPort autoSyncConfigPort;
    @Mock private PersonalRecordService personalRecordService;

    private SyncService syncService;

    @BeforeEach
    void setUp() {
        syncService = new SyncService(profileRepository, activityRepository,
                activityMetricRepository, dailyMetricRepository,
                metricRegistry, metricPersistenceService, dailyMetricsService, syncDataSource,
                syncStateRepository, aiActivityNoteService, heatmapBuildService, lapMetricsService,
                workoutEvaluationService, trainingEffectRepository, dailySummaryRepository,
                autoSyncConfigPort, personalRecordService);
        lenient().when(syncStateRepository.findFirst()).thenReturn(Optional.empty());
        lenient().when(lapMetricsService.enrichLaps(any(), any()))
                .thenAnswer(i -> ((Activity) i.getArgument(0)).getLaps());
    }

    @Test
    void syncRecentImportsNewActivities() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .name("Test Athlete")
                .build();

        Activity activity = Activity.builder()
                .externalId("99")
                .source("strava")
                .sportType("cycling")
                .name("Test Ride")
                .build();

        Activity fullActivity = Activity.builder()
                .externalId("99")
                .source("strava")
                .sportType("cycling")
                .name("Test Ride")
                .powerStream(new int[]{200, 210})
                .build();

        Activity savedActivity = Activity.builder()
                .id(UUID.randomUUID())
                .externalId("99")
                .source("strava")
                .sportType("cycling")
                .name("Test Ride")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(syncDataSource.fetchActivitiesPage(any(), anyInt(), any())).thenReturn(List.of(activity));
        when(activityRepository.existsByExternalIdAndSource("99", "strava")).thenReturn(false);
        when(syncDataSource.fetchActivityWithStreams(any(), anyString())).thenReturn(fullActivity);
        when(activityRepository.save(any())).thenReturn(savedActivity);
        when(metricRegistry.calculateAllActivityMetrics(any(), any())).thenReturn(Map.of());

        SyncService.SyncStatus status = syncService.syncRecent();

        assertThat(status.status()).isEqualTo("completed");
        assertThat(status.imported()).isEqualTo(1);
        verify(activityRepository).save(any());
        verify(dailyMetricsService).recalculateAll();
    }

    @Test
    void syncSkipsDuplicates() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .name("Test")
                .build();

        Activity activity = Activity.builder()
                .externalId("99")
                .source("strava")
                .sportType("cycling")
                .name("Existing")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(syncDataSource.fetchActivitiesPage(any(), anyInt(), any())).thenReturn(List.of(activity));
        when(activityRepository.existsByExternalIdAndSource("99", "strava")).thenReturn(true);

        SyncService.SyncStatus status = syncService.syncRecent();

        assertThat(status.status()).isEqualTo("completed");
        assertThat(status.imported()).isEqualTo(0);
        assertThat(status.skipped()).isEqualTo(1);
    }

    @Test
    void syncStatusReturnsIdle() {
        assertThat(syncService.getLastSyncStatus().status()).isEqualTo("idle");
    }

    @Test
    void syncActivityPhotosUpdatesExistingStravaActivities() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .name("Test Athlete")
                .build();

        Activity existingActivity = Activity.builder()
                .id(UUID.randomUUID())
                .externalId("99")
                .source("strava")
                .sportType("cycling")
                .name("Photo Ride")
                .photoUrls(null)
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findBySource("strava")).thenReturn(List.of(existingActivity));
        when(syncDataSource.fetchActivityPhotoUrls(profile, "99"))
                .thenReturn(List.of("https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg"));
        when(activityRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SyncService.SyncStatus status = syncService.syncActivityPhotos();

        assertThat(status.status()).isEqualTo("completed");
        assertThat(status.imported()).isEqualTo(1);
        assertThat(status.skipped()).isEqualTo(0);
        verify(activityRepository).save(argThat(activity ->
                activity.getPhotoUrls().equals(List.of("https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg"))));
    }

    @Test
    void resyncStreams_updatesElevationAndPolylineWhenMissing() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .name("Test Athlete")
                .build();

        // Activity has streams and laps but is missing elevation and polyline (old import)
        Activity existingActivity = Activity.builder()
                .id(UUID.randomUUID())
                .externalId("101")
                .source("strava")
                .sportType("cycling")
                .name("Old Outdoor Ride")
                .latStream(new double[]{50.0, 50.1})
                .lngStream(new double[]{20.0, 20.1})
                .laps(List.of())
                .elevationGainM(null)       // missing — needs resync
                .summaryPolyline(null)      // missing — needs resync
                .build();

        Activity freshActivity = Activity.builder()
                .externalId("101")
                .source("strava")
                .sportType("cycling")
                .name("Old Outdoor Ride")
                .latStream(new double[]{50.0, 50.1})
                .lngStream(new double[]{20.0, 20.1})
                .laps(List.of())
                .elevationGainM(BigDecimal.valueOf(250))
                .elevationLossM(BigDecimal.valueOf(240))
                .summaryPolyline("encodedpolyline123")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findBySource("strava")).thenReturn(List.of(existingActivity));
        when(syncDataSource.fetchActivityWithStreams(any(), anyString())).thenReturn(freshActivity);
        when(activityRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SyncService.SyncStatus status = syncService.resyncStreams();

        assertThat(status.status()).isEqualTo("completed");
        assertThat(status.imported()).isEqualTo(1);
        verify(activityRepository).save(argThat(saved ->
                BigDecimal.valueOf(250).compareTo(saved.getElevationGainM()) == 0
                        && "encodedpolyline123".equals(saved.getSummaryPolyline())));
    }

    @Test
    void resyncStreams_skipsActivitiesWithAllFieldsPresent() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .name("Test Athlete")
                .build();

        // Activity already has all required fields — should be skipped
        Activity completeActivity = Activity.builder()
                .id(UUID.randomUUID())
                .externalId("202")
                .source("strava")
                .sportType("cycling")
                .name("Complete Ride")
                .latStream(new double[]{50.0, 50.1})
                .lngStream(new double[]{20.0, 20.1})
                .altitudeStream(new double[]{100.0, 101.0})
                .powerStream(new int[]{200, 210})
                .laps(List.of(pl.strava.analizator.domain.vo.Lap.builder()
                        .startIndex(0)
                        .endIndex(1)
                        .totalElevationGain(BigDecimal.ONE)
                        .movingTimeSec(60)
                        .build()))
                .elevationGainM(BigDecimal.valueOf(100))
                .summaryPolyline("alreadypresent")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findBySource("strava")).thenReturn(List.of(completeActivity));

        SyncService.SyncStatus status = syncService.resyncStreams();

        assertThat(status.status()).isEqualTo("completed");
        assertThat(status.skipped()).isEqualTo(1);
        verify(syncDataSource, never()).fetchActivityWithStreams(any(), anyString());
        verify(activityRepository, never()).save(any());
    }

    @Test
    void resyncStreams_updatesStreamsForActivitiesMissingThem() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .name("Test Athlete")
                .build();

        Activity existingActivity = Activity.builder()
                .id(UUID.randomUUID())
                .externalId("303")
                .source("strava")
                .sportType("cycling")
                .name("No-Stream Ride")
                .latStream(null)            // missing streams — needs resync
                .laps(null)
                .elevationGainM(BigDecimal.valueOf(50))
                .summaryPolyline("poly")
                .build();

        Activity freshActivity = Activity.builder()
                .externalId("303")
                .source("strava")
                .latStream(new double[]{51.0, 51.1})
                .lngStream(new double[]{21.0, 21.1})
                .laps(List.of())
                .elevationGainM(BigDecimal.valueOf(50))
                .summaryPolyline("poly")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findBySource("strava")).thenReturn(List.of(existingActivity));
        when(syncDataSource.fetchActivityWithStreams(any(), anyString())).thenReturn(freshActivity);
        when(activityRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SyncService.SyncStatus status = syncService.resyncStreams();

        assertThat(status.status()).isEqualTo("completed");
        assertThat(status.imported()).isEqualTo(1);
        verify(activityRepository).save(argThat(saved -> saved.getLatStream() != null));
    }

    @Test
    void recalculateActivityMetrics_recalculatesAndSavesMetricsForActivity() {
        UUID activityId = UUID.randomUUID();
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .build();

        Activity activity = Activity.builder()
                .id(activityId)
                .externalId("404")
                .source("strava")
                .heartrateStream(new int[]{130, 140, 150})
                .build();

        Map<String, MetricResult> calculatedMetrics = Map.of(
                "time_in_zones", MetricResult.json("time_in_zones", Map.of("Z1", 1))
        );

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findById(activityId)).thenReturn(Optional.of(activity));
        when(metricRegistry.calculateAllActivityMetrics(activity, profile)).thenReturn(calculatedMetrics);

        syncService.recalculateActivityMetrics(activityId);

        verify(metricPersistenceService).saveActivityMetrics(activityId, calculatedMetrics);
    }

    @Test
    void recalculateAllActivityMetrics_recalculatesMetricsForAllActivities() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .stravaAthleteId(123L)
                .build();

        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Activity activity1 = Activity.builder().id(id1).externalId("501").source("strava").build();
        Activity activity2 = Activity.builder().id(id2).externalId("502").source("strava").build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(activityRepository.findAll()).thenReturn(List.of(activity1, activity2));
        when(metricRegistry.calculateAllActivityMetrics(any(), any())).thenReturn(Map.of());

        syncService.recalculateAllActivityMetrics();

        verify(metricRegistry).calculateAllActivityMetrics(activity1, profile);
        verify(metricRegistry).calculateAllActivityMetrics(activity2, profile);
    }
}
