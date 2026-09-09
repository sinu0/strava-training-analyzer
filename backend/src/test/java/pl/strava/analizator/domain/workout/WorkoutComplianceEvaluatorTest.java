package pl.strava.analizator.domain.workout;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.WorkoutStep;

class WorkoutComplianceEvaluatorTest {
    private final WorkoutComplianceEvaluator evaluator = new WorkoutComplianceEvaluator();
    private final List<WorkoutStep> steps = List.of(WorkoutStep.builder().type("steady").durationSec(10).powerPctFtpLow(50).powerPctFtpHigh(75).build());

    @Test void weightsTimeInsteadOfCountingIrregularSamples() {
        var result = evaluator.evaluate(steps, 200, Activity.builder().deviceWatts(true)
                .timeStream(new int[]{0, 1, 10}).powerStream(new int[]{120, 200, 200}).build());
        assertThat(result.getScore()).isEqualTo(10);
        assertThat(result.getAvailability()).isEqualTo("AVAILABLE");
    }
    @Test void missingOrEstimatedPowerNeverProducesAComplianceScore() {
        var result = evaluator.evaluate(steps, 200, Activity.builder().deviceWatts(false)
                .timeStream(new int[]{0,10}).powerStream(new int[]{120,120}).build());
        assertThat(result.getAvailability()).isEqualTo("UNKNOWN");
        assertThat(result.getScore()).isNull();
    }
    @Test void shortRecordingCannotLookLikePerfectExecution() {
        var result = evaluator.evaluate(steps, 200, Activity.builder().deviceWatts(true)
                .timeStream(new int[]{0,2}).powerStream(new int[]{120,120}).build());
        assertThat(result.getAvailability()).isEqualTo("PARTIAL");
        assertThat(result.getScore()).isNull();
    }

    @Test void evaluatesReconstructedTargetsAcrossPauseAndShiftedRecordingStart() {
        Instant start = Instant.parse("2026-09-09T06:00:00Z");
        var timeline = new WorkoutTimelineReconstructor.Timeline("AVAILABLE", null, List.of(
                new WorkoutTimelineReconstructor.TargetSegment(start, start.plusSeconds(30), 0, 50, 60),
                new WorkoutTimelineReconstructor.TargetSegment(start.plusSeconds(40), start.plusSeconds(70), 1, 80, 90)));
        int[] time = java.util.stream.IntStream.rangeClosed(0, 75).toArray();
        int[] watts = new int[76];
        java.util.Arrays.fill(watts, 0);
        java.util.Arrays.fill(watts, 5, 35, 110);
        java.util.Arrays.fill(watts, 45, 75, 170);
        Activity activity = Activity.builder().deviceWatts(true)
                .startedAt(OffsetDateTime.ofInstant(start.minusSeconds(5), ZoneOffset.UTC))
                .timeStream(time).powerStream(watts).build();

        var result = evaluator.evaluate(timeline, 200, activity);

        assertThat(result.getAvailability()).isEqualTo("AVAILABLE");
        assertThat(result.getCoverage()).isEqualTo(1.0);
        assertThat(result.getScore()).isEqualTo(100);
    }
}
