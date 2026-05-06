package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.ActivityService;
import pl.strava.analizator.application.HeatmapBuildService;
import pl.strava.analizator.application.dto.ActivityHeatmapDto;
import pl.strava.analizator.domain.model.HeatmapSegment;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.ActivityTrainingEffectRepository;
import pl.strava.analizator.domain.port.HeatmapSegmentRepository;

@ExtendWith(MockitoExtension.class)
class ActivityServiceHeatmapTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private ActivityMetricRepository metricRepository;

    @Mock
    private HeatmapSegmentRepository heatmapSegmentRepository;

    @Mock
    private HeatmapBuildService heatmapBuildService;

    @Mock
    private ActivityTrainingEffectRepository trainingEffectRepository;

    private ActivityService activityService;

    @BeforeEach
    void setUp() {
        activityService = new ActivityService(activityRepository, metricRepository, heatmapSegmentRepository, heatmapBuildService, trainingEffectRepository);
    }

    @Test
    void returnsEmptyHeatmapWhenNoSegmentsExist() {
        when(heatmapSegmentRepository.findAll()).thenReturn(List.of());
        when(activityRepository.countActivitiesWithPolylines()).thenReturn(0);

        ActivityHeatmapDto result = activityService.getRouteHeatmap();

        assertThat(result.segments()).isEmpty();
        assertThat(result.routeCount()).isZero();
        assertThat(result.bounds()).isNull();
        assertThat(result.maxCount()).isZero();
        assertThat(result.totalDistanceKm()).isEqualTo(0.0);
        assertThat(result.status()).isEqualTo("ready");
    }

    @Test
    void returnsPreComputedSegmentsWithBoundsAndStats() {
        HeatmapSegment segment = HeatmapSegment.builder()
                .lat1(50.0).lon1(19.0)
                .lat2(50.1).lon2(19.1)
                .traversalCount(3)
                .gridKeyA("a").gridKeyB("b")
                .build();

        when(heatmapSegmentRepository.findAll()).thenReturn(List.of(segment));
        when(heatmapSegmentRepository.findMaxTraversalCount()).thenReturn(3);
        when(activityRepository.countActivitiesWithPolylines()).thenReturn(5);
        when(activityRepository.sumDistanceMetersForActivitiesWithPolylines()).thenReturn(100_000.0);

        ActivityHeatmapDto result = activityService.getRouteHeatmap();

        assertThat(result.segments()).hasSize(1);
        assertThat(result.segments().get(0).lat1()).isEqualTo(50.0);
        assertThat(result.segments().get(0).lon1()).isEqualTo(19.0);
        assertThat(result.segments().get(0).lat2()).isEqualTo(50.1);
        assertThat(result.segments().get(0).lon2()).isEqualTo(19.1);
        assertThat(result.segments().get(0).count()).isEqualTo(3);
        assertThat(result.maxCount()).isEqualTo(3);
        assertThat(result.routeCount()).isEqualTo(5);
        assertThat(result.totalDistanceKm()).isEqualTo(100.0);
        assertThat(result.bounds()).isNotNull();
        assertThat(result.bounds().south()).isEqualTo(50.0);
        assertThat(result.bounds().north()).isEqualTo(50.1);
        assertThat(result.bounds().west()).isEqualTo(19.0);
        assertThat(result.bounds().east()).isEqualTo(19.1);
        assertThat(result.status()).isEqualTo("ready");
    }

    @Test
    void getHeatmapSegmentsInBounds_delegatesToRepository() {
        HeatmapSegment seg = HeatmapSegment.builder()
                .lat1(50.0).lon1(19.0).lat2(50.1).lon2(19.1).traversalCount(3)
                .gridKeyA("a").gridKeyB("b").build();
        when(heatmapSegmentRepository.findInBounds(49.0, 51.0, 18.0, 20.0))
                .thenReturn(List.of(seg));

        List<HeatmapSegment> result = activityService.getHeatmapSegmentsInBounds(49.0, 51.0, 18.0, 20.0);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTraversalCount()).isEqualTo(3);
    }

    @Test
    void getHeatmapMaxCount_delegatesToRepository() {
        when(heatmapSegmentRepository.findMaxTraversalCount()).thenReturn(42);
        assertThat(activityService.getHeatmapMaxCount()).isEqualTo(42);
    }
}

