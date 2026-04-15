package pl.strava.analizator.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pl.strava.analizator.domain.model.HeatmapSegment;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class HeatmapSkeletonBuilderTest {

    private HeatmapSkeletonBuilder skeletonBuilder;

    @BeforeEach
    void setUp() {
        skeletonBuilder = new HeatmapSkeletonBuilder();
    }

    @Test
    void emptyInput_returnsEmpty() {
        assertThat(skeletonBuilder.buildSkeleton(List.of())).isEmpty();
    }

    @Test
    void singleSegment_returnsSingleSegment() {
        HeatmapSegment s = seg(50.0, 20.0, 50.00027, 20.00027, 5);

        List<HeatmapSegment> result = skeletonBuilder.buildSkeleton(List.of(s));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTraversalCount()).isEqualTo(5);
    }

    @Test
    void twoParallelNearbySegments_mergedIntoOne() {
        // seg1 midpoint: (50.000135, 20.000135), direction 45°
        HeatmapSegment seg1 = seg(50.0, 20.0, 50.00027, 20.00027, 5);
        // seg2 midpoint: (50.000355, 20.000135), direction 45°, dist ≈ 0.000220 < MERGE_RADIUS=0.00035
        HeatmapSegment seg2 = seg(50.00022, 20.0, 50.00049, 20.00027, 3);

        List<HeatmapSegment> result = skeletonBuilder.buildSkeleton(List.of(seg1, seg2));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTraversalCount()).isEqualTo(8);
    }

    @Test
    void twoPerpendicularNearbySegments_notMerged() {
        // NE direction ~45°
        HeatmapSegment seg1 = seg(50.0, 20.0, 50.00027, 20.00027, 2);
        // E direction ~0° — midpoints are close but angle diff ~45° > THRESHOLD=30°
        HeatmapSegment seg2 = seg(50.00022, 20.00005, 50.00022, 20.00032, 4);

        List<HeatmapSegment> result = skeletonBuilder.buildSkeleton(List.of(seg1, seg2));

        assertThat(result).hasSize(2);
    }

    @Test
    void twoFarSegments_notMerged() {
        // distance between midpoints ≈ 0.001 > MERGE_RADIUS=0.00035
        HeatmapSegment seg1 = seg(50.0, 20.0, 50.00027, 20.00027, 2);
        HeatmapSegment seg2 = seg(50.001, 20.0, 50.00127, 20.00027, 3);

        List<HeatmapSegment> result = skeletonBuilder.buildSkeleton(List.of(seg1, seg2));

        assertThat(result).hasSize(2);
    }

    @Test
    void threeParallelSegments_allMergedIntoOne() {
        HeatmapSegment seg1 = seg(50.0, 20.0, 50.00027, 20.00027, 5);
        HeatmapSegment seg2 = seg(50.00022, 20.0, 50.00049, 20.00027, 3);
        // midpoint (50.000245, 20.000135), dist from seg1 ≈ 0.000110, dist from seg2 ≈ 0.000110
        HeatmapSegment seg3 = seg(50.00011, 20.0, 50.00038, 20.00027, 2);

        List<HeatmapSegment> result = skeletonBuilder.buildSkeleton(List.of(seg1, seg2, seg3));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTraversalCount()).isEqualTo(10);
    }

    @Test
    void mergedSegmentHasWeightedAverageCoordinates() {
        // weight 4 : seg1(50.0,20.0)→(50.00027,20.00027)
        // weight 1 : seg2(50.00022,20.0)→(50.00049,20.00027)
        HeatmapSegment seg1 = seg(50.0, 20.0, 50.00027, 20.00027, 4);
        HeatmapSegment seg2 = seg(50.00022, 20.0, 50.00049, 20.00027, 1);

        List<HeatmapSegment> result = skeletonBuilder.buildSkeleton(List.of(seg1, seg2));

        assertThat(result).hasSize(1);
        HeatmapSegment merged = result.get(0);
        assertThat(merged.getTraversalCount()).isEqualTo(5);
        // Weighted avg lat1 = (50.0*4 + 50.00022*1) / 5 = 50.000044
        assertThat(merged.getLat1()).isCloseTo(50.000044, within(1e-5));
        assertThat(merged.getLon1()).isCloseTo(20.0, within(1e-5));
        // Weighted avg lat2 = (50.00027*4 + 50.00049*1) / 5 = 50.000314
        assertThat(merged.getLat2()).isCloseTo(50.000314, within(1e-5));
        assertThat(merged.getLon2()).isCloseTo(20.00027, within(1e-5));
    }

    private HeatmapSegment seg(double lat1, double lon1, double lat2, double lon2, int count) {
        return HeatmapSegment.builder()
                .lat1(lat1).lon1(lon1).lat2(lat2).lon2(lon2)
                .traversalCount(count).gridKeyA("a").gridKeyB("b")
                .build();
    }
}
