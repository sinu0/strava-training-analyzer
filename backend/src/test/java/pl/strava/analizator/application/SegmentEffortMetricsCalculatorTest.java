package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.SegmentEffort;

class SegmentEffortMetricsCalculatorTest {

    private final SegmentEffortMetricsCalculator calculator = new SegmentEffortMetricsCalculator();

    @Test
    void calculatesOnlyTheEffortSliceAndKeepsUnavailableValuesNull() {
        Activity activity = Activity.builder()
                .id(UUID.randomUUID())
                .startedAt(OffsetDateTime.parse("2026-09-01T08:00:00Z"))
                .timeStream(new int[]{0, 5, 10, 15, 20})
                .distanceStream(new double[]{0, 50, 110, 180, 260})
                .powerStream(new int[]{100, 200, 220, 240, 500})
                .heartrateStream(new int[]{110, 130, 140, 150, 170})
                .altitudeStream(new double[]{100, 101, 103, 102, 106})
                .velocityStream(new double[]{2, 4, 5, 6, 8})
                .build();
        SegmentEffort effort = SegmentEffort.builder()
                .segmentId(7L)
                .activityId(activity.getId())
                .startIndex(1)
                .endIndex(3)
                .elapsedTimeSec(15)
                .build();

        SegmentEffort result = calculator.enrich(activity, effort);

        assertThat(result.getAveragePowerW()).isEqualTo((short) 220);
        assertThat(result.getAverageHeartrate()).isEqualTo((short) 140);
        assertThat(result.getAverageCadence()).isNull();
        assertThat(result.getAverageSpeedMs()).isEqualByComparingTo(BigDecimal.valueOf(5));
        assertThat(result.getElevationGainM()).isEqualByComparingTo(BigDecimal.valueOf(2));
        assertThat(result.getDistanceM()).isEqualByComparingTo(BigDecimal.valueOf(130));
    }
}
