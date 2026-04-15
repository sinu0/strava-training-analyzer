package pl.strava.analizator.application;

import org.junit.jupiter.api.Test;
import pl.strava.analizator.domain.model.HeatmapSegment;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class HeatmapChainBuilderTest {

    private final HeatmapChainBuilder builder = new HeatmapChainBuilder();

    @Test
    void emptyInputReturnsEmptyChains() {
        assertThat(builder.buildChains(List.of())).isEmpty();
    }

    @Test
    void singleSegmentBecomesSingleChain() {
        HeatmapSegment seg = seg(50.0, 19.0, 50.001, 19.001, 1);
        List<HeatmapChainBuilder.Chain> chains = builder.buildChains(List.of(seg));
        assertThat(chains).hasSize(1);
        assertThat(chains.get(0).path()).hasSize(2);
    }

    @Test
    void threeConnectedSegmentsMergeIntoOneChain() {
        List<HeatmapSegment> segs = List.of(
            seg(50.000, 19.000, 50.001, 19.001, 3),
            seg(50.001, 19.001, 50.002, 19.002, 3),
            seg(50.002, 19.002, 50.003, 19.003, 5)
        );
        List<HeatmapChainBuilder.Chain> chains = builder.buildChains(segs);
        assertThat(chains).hasSize(1);
        assertThat(chains.get(0).path()).hasSize(4);
        assertThat(chains.get(0).maxCount()).isEqualTo(5);
    }

    @Test
    void isolatedSegmentBecomesOwnChain() {
        List<HeatmapSegment> segs = List.of(
            seg(50.000, 19.000, 50.001, 19.001, 2),
            seg(50.007, 19.007, 50.008, 19.008, 2)
        );
        assertThat(builder.buildChains(segs)).hasSize(2);
    }

    @Test
    void junctionSplitsIntoMultipleChains() {
        List<HeatmapSegment> segs = List.of(
            seg(50.000, 19.000, 50.001, 19.001, 2),
            seg(50.001, 19.001, 50.002, 19.002, 2),
            seg(50.001, 19.001, 50.002, 18.999, 2)
        );
        List<HeatmapChainBuilder.Chain> chains = builder.buildChains(segs);
        assertThat(chains).hasSize(3);
    }

    private HeatmapSegment seg(double lat1, double lon1, double lat2, double lon2, int count) {
        return HeatmapSegment.builder()
            .lat1(lat1).lon1(lon1).lat2(lat2).lon2(lon2)
            .traversalCount(count).gridKeyA("a").gridKeyB("b").build();
    }
}
