package pl.strava.analizator.domain.workout;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionStatus;
import pl.strava.analizator.domain.model.WorkoutStep;

/**
 * Pure workout state machine. Wall-clock instants are persisted, so state can be
 * reconstructed after a process or device restart. A UI timer is only a repaint trigger.
 */
public final class WorkoutRunner {

    private static final int MIN_INTENSITY_ADJUSTMENT = -50;
    private static final int MAX_INTENSITY_ADJUSTMENT = 50;

    private WorkoutRunner() {
    }

    public static WorkoutExecution start(WorkoutExecution state, Instant now) {
        requireStatus(state, WorkoutExecutionStatus.READY);
        requireSteps(state);
        return state.toBuilder()
                .status(WorkoutExecutionStatus.RUNNING)
                .startedAt(state.getStartedAt() != null ? state.getStartedAt() : now)
                .runningSince(now)
                .stateVersion(state.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution reconcile(WorkoutExecution state, Instant now) {
        if (state.getStatus() != WorkoutExecutionStatus.RUNNING || state.getRunningSince() == null) {
            return state;
        }
        long availableMs = Math.max(0, Duration.between(state.getRunningSince(), now).toMillis());
        if (availableMs == 0) {
            return state;
        }

        List<WorkoutStep> steps = safeSteps(state);
        int stepIndex = state.getCurrentStepIndex();
        long stepElapsed = state.getStepElapsedMs();
        long workoutElapsed = state.getWorkoutElapsedMs();
        Instant cursor = state.getRunningSince();

        while (availableMs > 0 && stepIndex < steps.size()) {
            Long durationMs = durationMs(steps.get(stepIndex));
            if (durationMs == null) {
                stepElapsed += availableMs;
                workoutElapsed += availableMs;
                cursor = cursor.plusMillis(availableMs);
                availableMs = 0;
                break;
            }

            long remainingInStep = Math.max(0, durationMs - stepElapsed);
            long consumed = Math.min(availableMs, remainingInStep);
            stepElapsed += consumed;
            workoutElapsed += consumed;
            cursor = cursor.plusMillis(consumed);
            availableMs -= consumed;

            if (stepElapsed >= durationMs) {
                stepIndex++;
                stepElapsed = 0;
            }
            if (remainingInStep == 0 && consumed == 0 && stepIndex < steps.size()) {
                continue;
            }
        }

        if (stepIndex >= steps.size()) {
            return state.toBuilder()
                    .status(WorkoutExecutionStatus.COMPLETED)
                    .currentStepIndex(Math.max(0, steps.size() - 1))
                    .stepElapsedMs(steps.isEmpty() ? 0 : valueOrZero(durationMs(steps.getLast())))
                    .workoutElapsedMs(workoutElapsed)
                    .runningSince(null)
                    .finishedAt(cursor)
                    .stateVersion(state.getStateVersion() + 1)
                    .updatedAt(cursor)
                    .build();
        }

        return state.toBuilder()
                .currentStepIndex(stepIndex)
                .stepElapsedMs(stepElapsed)
                .workoutElapsedMs(workoutElapsed)
                .runningSince(now)
                .stateVersion(state.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution pause(WorkoutExecution state, Instant now) {
        requireStatus(state, WorkoutExecutionStatus.RUNNING);
        WorkoutExecution reconciled = reconcile(state, now);
        if (reconciled.getStatus() == WorkoutExecutionStatus.COMPLETED) {
            return reconciled;
        }
        return reconciled.toBuilder()
                .status(WorkoutExecutionStatus.PAUSED)
                .runningSince(null)
                .stateVersion(reconciled.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution resume(WorkoutExecution state, Instant now) {
        requireStatus(state, WorkoutExecutionStatus.PAUSED);
        return state.toBuilder()
                .status(WorkoutExecutionStatus.RUNNING)
                .runningSince(now)
                .stateVersion(state.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution skipStep(WorkoutExecution state, Instant now) {
        WorkoutExecution reconciled = reconcileForAction(state, now);
        int skipped = reconciled.getCurrentStepIndex();
        List<Integer> skippedSteps = append(reconciled.getSkippedStepIndexes(), skipped);
        int next = skipped + 1;
        if (next >= safeSteps(reconciled).size()) {
            return complete(reconciled, now).toBuilder()
                    .skippedStepIndexes(skippedSteps)
                    .build();
        }
        return reconciled.toBuilder()
                .currentStepIndex(next)
                .stepElapsedMs(0)
                .runningSince(reconciled.getStatus() == WorkoutExecutionStatus.RUNNING ? now : null)
                .skippedStepIndexes(skippedSteps)
                .stateVersion(reconciled.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution previousStep(WorkoutExecution state, Instant now) {
        WorkoutExecution reconciled = reconcileForAction(state, now);
        int previous = Math.max(0, reconciled.getCurrentStepIndex() - 1);
        return reconciled.toBuilder()
                .currentStepIndex(previous)
                .stepElapsedMs(0)
                .runningSince(reconciled.getStatus() == WorkoutExecutionStatus.RUNNING ? now : null)
                .repeatedStepIndexes(append(reconciled.getRepeatedStepIndexes(), previous))
                .stateVersion(reconciled.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution changeIntensity(WorkoutExecution state, int deltaPct, Instant now) {
        WorkoutExecution reconciled = reconcileForAction(state, now);
        int adjusted = Math.max(MIN_INTENSITY_ADJUSTMENT,
                Math.min(MAX_INTENSITY_ADJUSTMENT, reconciled.getIntensityAdjustmentPct() + deltaPct));
        return reconciled.toBuilder()
                .intensityAdjustmentPct(adjusted)
                .runningSince(reconciled.getStatus() == WorkoutExecutionStatus.RUNNING ? now : null)
                .stateVersion(reconciled.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution complete(WorkoutExecution state, Instant now) {
        WorkoutExecution reconciled = reconcileForAction(state, now);
        if (reconciled.getStatus() == WorkoutExecutionStatus.COMPLETED) {
            return reconciled;
        }
        return reconciled.toBuilder()
                .status(WorkoutExecutionStatus.COMPLETED)
                .runningSince(null)
                .finishedAt(now)
                .stateVersion(reconciled.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    public static WorkoutExecution abort(WorkoutExecution state, Instant now) {
        WorkoutExecution reconciled = reconcileForAction(state, now);
        if (reconciled.getStatus() == WorkoutExecutionStatus.COMPLETED) {
            throw new IllegalStateException("Completed workout cannot be aborted");
        }
        return reconciled.toBuilder()
                .status(WorkoutExecutionStatus.ABORTED)
                .runningSince(null)
                .finishedAt(now)
                .stateVersion(reconciled.getStateVersion() + 1)
                .updatedAt(now)
                .build();
    }

    private static WorkoutExecution reconcileForAction(WorkoutExecution state, Instant now) {
        if (state.getStatus() != WorkoutExecutionStatus.RUNNING
                && state.getStatus() != WorkoutExecutionStatus.PAUSED) {
            throw new IllegalStateException("Workout action is not allowed from " + state.getStatus());
        }
        return reconcile(state, now);
    }

    private static void requireStatus(WorkoutExecution state, WorkoutExecutionStatus expected) {
        if (state.getStatus() != expected) {
            throw new IllegalStateException("Expected " + expected + " but was " + state.getStatus());
        }
    }

    private static void requireSteps(WorkoutExecution state) {
        if (safeSteps(state).isEmpty()) {
            throw new IllegalStateException("Workout requires at least one step");
        }
    }

    private static List<WorkoutStep> safeSteps(WorkoutExecution state) {
        return state.getStepsSnapshot() != null ? state.getStepsSnapshot() : List.of();
    }

    private static Long durationMs(WorkoutStep step) {
        if (step.getDurationSec() == null
                || "LAP_BUTTON".equalsIgnoreCase(step.getDurationType())
                || "OPEN".equalsIgnoreCase(step.getDurationType())) {
            return null;
        }
        return Math.max(0, step.getDurationSec()) * 1_000L;
    }

    private static long valueOrZero(Long value) {
        return value != null ? value : 0;
    }

    private static List<Integer> append(List<Integer> values, int value) {
        List<Integer> result = new ArrayList<>(values != null ? values : List.of());
        result.add(value);
        return List.copyOf(result);
    }
}
