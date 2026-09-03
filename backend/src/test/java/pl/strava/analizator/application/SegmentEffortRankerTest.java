package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.SegmentEffort;

class SegmentEffortRankerTest {

    @Test
    void givesEqualTimesTheSameCompetitionRank() {
        SegmentEffort first = effort(90);
        SegmentEffort tiedFirst = effort(90);
        SegmentEffort third = effort(95);
        SegmentEffort unknown = effort(null);

        var ranks = new SegmentEffortRanker().rank(List.of(third, unknown, tiedFirst, first));

        assertThat(ranks).containsEntry(first.getId(), 1)
                .containsEntry(tiedFirst.getId(), 1)
                .containsEntry(third.getId(), 3)
                .doesNotContainKey(unknown.getId());
    }

    private SegmentEffort effort(Integer elapsedTimeSec) {
        return SegmentEffort.builder().id(UUID.randomUUID()).elapsedTimeSec(elapsedTimeSec).build();
    }
}
