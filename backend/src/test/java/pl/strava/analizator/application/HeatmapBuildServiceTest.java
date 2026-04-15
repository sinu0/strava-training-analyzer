package pl.strava.analizator.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.HeatmapSegment;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.HeatmapSegmentRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HeatmapBuildServiceTest {

    @Mock
    private HeatmapSegmentRepository heatmapSegmentRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private HeatmapSkeletonBuilder skeletonBuilder;

    private HeatmapBuildService heatmapBuildService;

    @BeforeEach
    void setUp() {
        heatmapBuildService = new HeatmapBuildService(activityRepository, heatmapSegmentRepository, skeletonBuilder);
    }

    /**
     * "_p~iF~ps|U_ulLnnqC" decodes to 2 points: (38.5, -120.2) and (40.7, -120.95).
     * One segment is produced and upserted with sorted grid keys.
     */
    @Test
    void updateForActivity_snapsPolylineToGridAndUpserts() {
        heatmapBuildService.updateForActivity("_p~iF~ps|U_ulLnnqC");

        ArgumentCaptor<String> keyACaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> keyBCaptor = ArgumentCaptor.forClass(String.class);
        verify(heatmapSegmentRepository, times(1))
                .upsertSegment(keyACaptor.capture(), keyBCaptor.capture(),
                        anyDouble(), anyDouble(), anyDouble(), anyDouble());

        String keyA = keyACaptor.getValue();
        String keyB = keyBCaptor.getValue();
        assertThat(keyA.compareTo(keyB)).isLessThanOrEqualTo(0);
    }

    @Test
    void updateForActivity_skipsNullPolyline() {
        heatmapBuildService.updateForActivity(null);

        verify(heatmapSegmentRepository, never()).upsertSegment(anyString(), anyString(),
                anyDouble(), anyDouble(), anyDouble(), anyDouble());
    }

    /**
     * Polyline "??_pR_pR~oR~oR" encodes (0,0) → (0.1,0.1) → (0,0).
     * Segment (0,0)-(0.1,0.1) appears twice but should be upserted only once.
     */
    @Test
    void updateForActivity_deduplicatesSegmentsWithinSingleActivity() {
        heatmapBuildService.updateForActivity("??_pR_pR~oR~oR");

        verify(heatmapSegmentRepository, times(1))
                .upsertSegment(anyString(), anyString(), anyDouble(), anyDouble(), anyDouble(), anyDouble());
    }

    @Test
    void rebuildAll_deletesAllAndRebuilds() {
        Activity activity = Activity.builder()
                .externalId("1")
                .summaryPolyline("_p~iF~ps|U_ulLnnqC")
                .build();
        when(activityRepository.findWithSummaryPolylines()).thenReturn(List.of(activity));
        List<HeatmapSegment> skeletonResult = List.of(
                HeatmapSegment.builder().lat1(0).lon1(0).lat2(1).lon2(1)
                        .gridKeyA("a").gridKeyB("b").traversalCount(1).build());
        when(skeletonBuilder.buildSkeleton(any())).thenReturn(skeletonResult);

        heatmapBuildService.rebuildAll();

        verify(heatmapSegmentRepository, times(2)).deleteAll();
        verify(heatmapSegmentRepository, times(1))
                .upsertSegment(anyString(), anyString(), anyDouble(), anyDouble(), anyDouble(), anyDouble());
        verify(skeletonBuilder).buildSkeleton(any());
        verify(heatmapSegmentRepository).saveAll(skeletonResult);
    }

    @Test
    void rebuildAll_handlesEmptyActivityList() {
        when(activityRepository.findWithSummaryPolylines()).thenReturn(List.of());

        heatmapBuildService.rebuildAll();

        verify(heatmapSegmentRepository, times(2)).deleteAll();
        verify(heatmapSegmentRepository, never())
                .upsertSegment(any(), any(), anyDouble(), anyDouble(), anyDouble(), anyDouble());
        verify(skeletonBuilder).buildSkeleton(any());
        verify(heatmapSegmentRepository).saveAll(any());
    }
}
