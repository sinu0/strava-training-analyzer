package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.SegmentEffort;

class SegmentRecordDetectorTest {

    @Test
    void detectsRecordsChronologicallyWithoutFutureLeakage() {
        SegmentEffort first = effort("2024-01-01T10:00:00Z", 100);
        SegmentEffort slower = effort("2024-02-01T10:00:00Z", 110);
        SegmentEffort record = effort("2024-03-01T10:00:00Z", 90);

        List<SegmentEffort> detected = new SegmentRecordDetector().detect(List.of(record, slower, first));

        assertThat(detected).extracting(SegmentEffort::getElapsedTimeSec).containsExactly(100, 110, 90);
        assertThat(detected).extracting(SegmentEffort::isRecordAtTime).containsExactly(true, false, true);
        assertThat(detected).extracting(SegmentEffort::getPreviousBestElapsedTimeSec)
                .containsExactly(null, 100, 100);
    }

    private SegmentEffort effort(String startedAt, int elapsed) {
        return SegmentEffort.builder()
                .id(UUID.randomUUID())
                .segmentId(1L)
                .startedAt(OffsetDateTime.parse(startedAt))
                .elapsedTimeSec(elapsed)
                .build();
    }
}
