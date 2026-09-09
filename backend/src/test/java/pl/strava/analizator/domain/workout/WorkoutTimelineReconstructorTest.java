package pl.strava.analizator.domain.workout;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionEvent;
import pl.strava.analizator.domain.model.WorkoutStep;

class WorkoutTimelineReconstructorTest {
    private static final Instant START = Instant.parse("2026-09-09T06:00:00Z");
    private static final UUID EXECUTION_ID = UUID.fromString("53c72f4d-65b7-4b55-a166-0bf826568ac7");
    private final WorkoutTimelineReconstructor reconstructor = new WorkoutTimelineReconstructor();

    @Test
    void removesPausedWallClockTimeFromThePowerTargets() {
        WorkoutExecution execution = execution(List.of(step(30, 50, 60), step(30, 80, 90)));

        var timeline = reconstructor.reconstruct(execution, List.of(
                event(1, "START", 0, 0, 0, "{}"),
                event(2, "PAUSE", 30, 30_000, 1, "{}"),
                event(3, "RESUME", 40, 30_000, 1, "{}"),
                event(4, "COMPLETE", 70, 60_000, 1, "{}")));

        assertThat(timeline.availability()).isEqualTo("AVAILABLE");
        assertThat(timeline.segments()).hasSize(2);
        assertThat(timeline.segments().get(0).startedAt()).isEqualTo(START);
        assertThat(timeline.segments().get(0).endedAt()).isEqualTo(START.plusSeconds(30));
        assertThat(timeline.segments().get(1).startedAt()).isEqualTo(START.plusSeconds(40));
        assertThat(timeline.segments().get(1).endedAt()).isEqualTo(START.plusSeconds(70));
        assertThat(timeline.segments().get(1).stepIndex()).isEqualTo(1);
    }

    @Test
    void appliesIntensityChangesOnlyAfterTheirEvent() {
        WorkoutExecution execution = execution(List.of(step(60, 50, 60)));

        var timeline = reconstructor.reconstruct(execution, List.of(
                event(1, "START", 0, 0, 0, "{}"),
                event(2, "INTENSITY", 30, 30_000, 0, "{\"intensityDeltaPct\":50}"),
                event(3, "COMPLETE", 60, 60_000, 0, "{}")));

        assertThat(timeline.availability()).isEqualTo("AVAILABLE");
        assertThat(timeline.segments()).extracting(
                WorkoutTimelineReconstructor.TargetSegment::powerPctFtpLow,
                WorkoutTimelineReconstructor.TargetSegment::powerPctFtpHigh)
                .containsExactly(org.assertj.core.groups.Tuple.tuple(50, 60),
                        org.assertj.core.groups.Tuple.tuple(75, 90));
    }

    @Test
    void followsSkippedAndRepeatedStepAnchors() {
        WorkoutExecution execution = execution(List.of(step(30, 50, 60), step(30, 80, 90)))
                .toBuilder().finishedAt(START.plusSeconds(40)).workoutElapsedMs(40_000).build();

        var timeline = reconstructor.reconstruct(execution, List.of(
                event(1, "START", 0, 0, 0, "{}"),
                event(2, "SKIP_STEP", 10, 10_000, 1, "{}"),
                event(3, "PREVIOUS_STEP", 20, 20_000, 0, "{}"),
                event(4, "COMPLETE", 40, 40_000, 0, "{}")));

        assertThat(timeline.availability()).isEqualTo("AVAILABLE");
        assertThat(timeline.segments()).extracting(WorkoutTimelineReconstructor.TargetSegment::stepIndex)
                .containsExactly(0, 1, 0);
    }

    @Test
    void rejectsAnIncompleteOrContradictoryEventHistory() {
        WorkoutExecution execution = execution(List.of(step(60, 50, 60)));

        var timeline = reconstructor.reconstruct(execution, List.of(
                event(1, "START", 0, 0, 0, "{}"),
                event(2, "PAUSE", 20, 30_000, 0, "{}")));

        assertThat(timeline.availability()).isEqualTo("UNKNOWN");
        assertThat(timeline.segments()).isEmpty();
    }

    @Test
    void rejectsAnEventHistoryThatStartsWithAnotherExecutionId() {
        WorkoutExecution execution = execution(List.of(step(60, 50, 60)));
        WorkoutExecutionEvent foreignStart = WorkoutExecutionEvent.builder()
                .id(UUID.randomUUID()).executionId(UUID.randomUUID()).sequenceNo(1)
                .eventType("START").occurredAt(START).workoutElapsedMs(0).stepIndex(0)
                .payload("{}").idempotencyKey("foreign-start").createdAt(START).build();

        var timeline = reconstructor.reconstruct(execution, List.of(
                foreignStart,
                event(2, "COMPLETE", 60, 60_000, 0, "{}")));

        assertThat(timeline.availability()).isEqualTo("UNKNOWN");
        assertThat(timeline.segments()).isEmpty();
    }

    @Test
    void rejectsStepAnchorsOutsideThePersistedSnapshot() {
        WorkoutExecution execution = execution(List.of(step(60, 50, 60)))
                .toBuilder().finishedAt(START.plusSeconds(20)).workoutElapsedMs(20_000).build();

        var timeline = reconstructor.reconstruct(execution, List.of(
                event(1, "START", 0, 0, 0, "{}"),
                event(2, "SKIP_STEP", 10, 10_000, 99, "{}"),
                event(3, "COMPLETE", 20, 20_000, 99, "{}")));

        assertThat(timeline.availability()).isEqualTo("UNKNOWN");
        assertThat(timeline.segments()).isEmpty();
    }

    private WorkoutExecution execution(List<WorkoutStep> steps) {
        return WorkoutExecution.builder().id(EXECUTION_ID).stepsSnapshot(steps).ftpWatts(200)
                .startedAt(START).finishedAt(START.plusSeconds(70)).workoutElapsedMs(60_000).build();
    }

    private WorkoutStep step(int durationSec, int low, int high) {
        return WorkoutStep.builder().type("steady").durationSec(durationSec)
                .powerPctFtpLow(low).powerPctFtpHigh(high).build();
    }

    private WorkoutExecutionEvent event(int sequence, String type, long wallSeconds,
                                        long workoutElapsedMs, int stepIndex, String payload) {
        return WorkoutExecutionEvent.builder().id(UUID.randomUUID()).executionId(EXECUTION_ID)
                .sequenceNo(sequence).eventType(type).occurredAt(START.plusSeconds(wallSeconds))
                .workoutElapsedMs(workoutElapsedMs).stepIndex(stepIndex).payload(payload)
                .idempotencyKey("event-" + sequence).createdAt(START.plusSeconds(wallSeconds)).build();
    }
}
