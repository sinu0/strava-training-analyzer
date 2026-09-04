package pl.strava.analizator.domain.workout;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionStatus;
import pl.strava.analizator.domain.model.WorkoutStep;

class WorkoutRunnerTest {

    private static final Instant START = Instant.parse("2026-09-03T08:00:00Z");

    @Test
    void advancesAcrossStepsFromTimestampsAfterLongBackgroundPeriod() {
        WorkoutExecution running = WorkoutRunner.start(ready(List.of(
                timed("warmup", 10),
                timed("steady", 20),
                timed("cooldown", 10))), START);

        WorkoutExecution reconciled = WorkoutRunner.reconcile(running, START.plusSeconds(35));

        assertThat(reconciled.getStatus()).isEqualTo(WorkoutExecutionStatus.RUNNING);
        assertThat(reconciled.getCurrentStepIndex()).isEqualTo(2);
        assertThat(reconciled.getStepElapsedMs()).isEqualTo(5_000);
        assertThat(reconciled.getWorkoutElapsedMs()).isEqualTo(35_000);
    }

    @Test
    void pauseFreezesTimeAndResumeUsesNewAnchor() {
        WorkoutExecution running = WorkoutRunner.start(ready(List.of(timed("steady", 60))), START);
        WorkoutExecution paused = WorkoutRunner.pause(running, START.plusSeconds(12));

        WorkoutExecution stillPaused = WorkoutRunner.reconcile(paused, START.plusSeconds(120));
        WorkoutExecution resumed = WorkoutRunner.resume(stillPaused, START.plusSeconds(120));
        WorkoutExecution afterResume = WorkoutRunner.reconcile(resumed, START.plusSeconds(125));

        assertThat(stillPaused.getWorkoutElapsedMs()).isEqualTo(12_000);
        assertThat(afterResume.getWorkoutElapsedMs()).isEqualTo(17_000);
        assertThat(afterResume.getStepElapsedMs()).isEqualTo(17_000);
    }

    @Test
    void openStepOnlyEndsAfterManualLap() {
        WorkoutExecution running = WorkoutRunner.start(ready(List.of(
                WorkoutStep.builder().type("freeRide").durationType("LAP_BUTTON").build(),
                timed("cooldown", 10))), START);

        WorkoutExecution afterHour = WorkoutRunner.reconcile(running, START.plusSeconds(3600));
        WorkoutExecution next = WorkoutRunner.skipStep(afterHour, START.plusSeconds(3600));

        assertThat(afterHour.getCurrentStepIndex()).isZero();
        assertThat(afterHour.getStatus()).isEqualTo(WorkoutExecutionStatus.RUNNING);
        assertThat(next.getCurrentStepIndex()).isEqualTo(1);
        assertThat(next.getSkippedStepIndexes()).containsExactly(0);
    }

    @Test
    void supportsPreviousStepAndClampedIntensityChanges() {
        WorkoutExecution running = WorkoutRunner.start(ready(List.of(timed("warmup", 10), timed("steady", 30))), START);
        WorkoutExecution second = WorkoutRunner.reconcile(running, START.plusSeconds(12));

        WorkoutExecution repeated = WorkoutRunner.previousStep(second, START.plusSeconds(12));
        WorkoutExecution harder = WorkoutRunner.changeIntensity(repeated, 60, START.plusSeconds(12));

        assertThat(repeated.getCurrentStepIndex()).isZero();
        assertThat(repeated.getRepeatedStepIndexes()).containsExactly(0);
        assertThat(harder.getIntensityAdjustmentPct()).isEqualTo(50);
    }

    @Test
    void completesTimedWorkoutAndRejectsInvalidTransition() {
        WorkoutExecution running = WorkoutRunner.start(ready(List.of(timed("steady", 10))), START);

        WorkoutExecution completed = WorkoutRunner.reconcile(running, START.plusSeconds(15));

        assertThat(completed.getStatus()).isEqualTo(WorkoutExecutionStatus.COMPLETED);
        assertThat(completed.getWorkoutElapsedMs()).isEqualTo(10_000);
        assertThat(completed.getFinishedAt()).isEqualTo(START.plusSeconds(10));
        assertThatThrownBy(() -> WorkoutRunner.resume(completed, START.plusSeconds(20)))
                .isInstanceOf(IllegalStateException.class);
    }

    private WorkoutExecution ready(List<WorkoutStep> steps) {
        return WorkoutExecution.builder()
                .status(WorkoutExecutionStatus.READY)
                .stepsSnapshot(steps)
                .currentStepIndex(0)
                .stepElapsedMs(0)
                .workoutElapsedMs(0)
                .intensityAdjustmentPct(0)
                .skippedStepIndexes(List.of())
                .repeatedStepIndexes(List.of())
                .stateVersion(0L)
                .build();
    }

    private WorkoutStep timed(String type, int durationSec) {
        return WorkoutStep.builder().type(type).durationSec(durationSec).build();
    }
}
