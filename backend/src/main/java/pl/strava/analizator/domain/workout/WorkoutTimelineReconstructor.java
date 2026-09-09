package pl.strava.analizator.domain.workout;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionEvent;
import pl.strava.analizator.domain.model.WorkoutStep;

/** Rebuilds the actually executed target sequence from the durable event log. */
public final class WorkoutTimelineReconstructor {
    private static final long CLOCK_TOLERANCE_MS = 2_000;
    private static final Pattern INTENSITY_DELTA = Pattern.compile(
            "\\\"intensityDeltaPct\\\"\\s*:\\s*(-?\\d+)");

    public Timeline reconstruct(WorkoutExecution execution, List<WorkoutExecutionEvent> events) {
        if (execution == null || execution.getId() == null || execution.getStepsSnapshot() == null
                || execution.getStepsSnapshot().isEmpty() || events == null || events.size() < 2) {
            return unknown("Brak kompletnego dziennika zdarzeń wykonania.");
        }
        WorkoutExecutionEvent first = events.getFirst();
        WorkoutExecutionEvent last = events.getLast();
        if (!"START".equals(normalize(first.getEventType()))
                || !"COMPLETE".equals(normalize(last.getEventType()))) {
            return unknown("Dziennik wykonania nie ma poprawnego początku i zakończenia.");
        }
        if (!Objects.equals(execution.getId(), first.getExecutionId())
                || first.getSequenceNo() != 1
                || first.getWorkoutElapsedMs() != 0
                || !validStepIndex(first.getStepIndex() != null ? first.getStepIndex() : 0,
                        execution.getStepsSnapshot())
                || first.getOccurredAt() == null
                || execution.getStartedAt() == null
                || Math.abs(Duration.between(execution.getStartedAt(), first.getOccurredAt()).toMillis())
                        > CLOCK_TOLERANCE_MS) {
            return unknown("Początek osi czasu jest niespójny.");
        }

        ReplayState state = new ReplayState(
                first.getStepIndex() != null ? first.getStepIndex() : 0, 0, 0, true);
        List<TargetSegment> segments = new ArrayList<>();
        WorkoutExecutionEvent previous = first;

        for (int i = 1; i < events.size(); i++) {
            WorkoutExecutionEvent current = events.get(i);
            if (!validSuccessor(execution, previous, current)) {
                return unknown("Dziennik zdarzeń jest nieuporządkowany albo sprzeczny.");
            }
            long activeMs = current.getWorkoutElapsedMs() - previous.getWorkoutElapsedMs();
            long wallMs = Duration.between(previous.getOccurredAt(), current.getOccurredAt()).toMillis();
            if (state.running) {
                if (activeMs > wallMs + CLOCK_TOLERANCE_MS) {
                    return unknown("Czas aktywny przekracza czas zegarowy wykonania.");
                }
                state = advance(execution.getStepsSnapshot(), state, previous.getOccurredAt(), activeMs, segments);
            } else if (activeMs != 0) {
                return unknown("Czas treningu zmienił się podczas pauzy.");
            }

            ReplayState anchored = apply(current, state, execution.getStepsSnapshot());
            if (anchored == null) {
                return unknown("Nie można odtworzyć zdarzenia " + normalize(current.getEventType()) + ".");
            }
            state = anchored;
            previous = current;
        }

        if (Math.abs(last.getWorkoutElapsedMs() - execution.getWorkoutElapsedMs()) > CLOCK_TOLERANCE_MS
                || segments.isEmpty()) {
            return unknown("Odtworzona oś czasu nie zgadza się ze stanem końcowym.");
        }
        return new Timeline("AVAILABLE", null, List.copyOf(segments));
    }

    private ReplayState advance(List<WorkoutStep> steps, ReplayState original, Instant wallStart,
                                long activeMs, List<TargetSegment> segments) {
        ReplayState state = original;
        long remaining = activeMs;
        Instant cursor = wallStart;
        while (remaining > 0 && state.stepIndex >= 0 && state.stepIndex < steps.size()) {
            WorkoutStep step = steps.get(state.stepIndex);
            Long durationMs = durationMs(step);
            long consumed = durationMs == null
                    ? remaining
                    : Math.min(remaining, Math.max(0, durationMs - state.stepElapsedMs));
            if (consumed > 0) {
                segments.add(new TargetSegment(cursor, cursor.plusMillis(consumed), state.stepIndex,
                        adjusted(step.getPowerPctFtpLow(), state.intensityAdjustmentPct),
                        adjusted(step.getPowerPctFtpHigh(), state.intensityAdjustmentPct)));
                cursor = cursor.plusMillis(consumed);
                remaining -= consumed;
                state = new ReplayState(state.stepIndex, state.stepElapsedMs + consumed,
                        state.intensityAdjustmentPct, state.running);
            }
            if (durationMs != null && state.stepElapsedMs >= durationMs) {
                state = new ReplayState(state.stepIndex + 1, 0,
                        state.intensityAdjustmentPct, state.running);
            } else if (consumed == 0) {
                break;
            }
        }
        return state;
    }

    private ReplayState apply(WorkoutExecutionEvent event, ReplayState state, List<WorkoutStep> steps) {
        String type = normalize(event.getEventType());
        return switch (type) {
            case "PAUSE" -> anchorWithoutReset(event, state, false);
            case "RESUME" -> anchorWithoutReset(event, state, true);
            case "SKIP_STEP", "LAP", "PREVIOUS_STEP", "REPEAT_STEP" ->
                    event.getStepIndex() == null || !validStepIndex(event.getStepIndex(), steps)
                            ? null
                            : new ReplayState(event.getStepIndex(), 0,
                                    state.intensityAdjustmentPct, state.running);
            case "INTENSITY" -> {
                Integer delta = intensityDelta(event.getPayload());
                if (delta == null || !matchesAnchor(event, state)) yield null;
                int adjusted = Math.max(-50, Math.min(50, state.intensityAdjustmentPct + delta));
                yield new ReplayState(state.stepIndex, state.stepElapsedMs, adjusted, state.running);
            }
            case "CHECKPOINT" -> matchesAnchor(event, state) ? state : null;
            case "COMPLETE", "ABORT" -> matchesCompletedAnchor(event, state, steps)
                    ? new ReplayState(completedAnchor(event, state), state.stepElapsedMs,
                            state.intensityAdjustmentPct, false)
                    : null;
            default -> null;
        };
    }

    private ReplayState anchorWithoutReset(WorkoutExecutionEvent event, ReplayState state, boolean running) {
        return matchesAnchor(event, state)
                ? new ReplayState(state.stepIndex, state.stepElapsedMs, state.intensityAdjustmentPct, running)
                : null;
    }

    private boolean matchesAnchor(WorkoutExecutionEvent event, ReplayState state) {
        return event.getStepIndex() == null || event.getStepIndex() == state.stepIndex;
    }

    private int completedAnchor(WorkoutExecutionEvent event, ReplayState state) {
        return event.getStepIndex() != null ? event.getStepIndex() : state.stepIndex;
    }

    private boolean matchesCompletedAnchor(WorkoutExecutionEvent event, ReplayState state,
                                           List<WorkoutStep> steps) {
        if (event.getStepIndex() == null) return true;
        if (!validStepIndex(event.getStepIndex(), steps)) return false;
        int expected = state.stepIndex >= steps.size() ? steps.size() - 1 : state.stepIndex;
        return event.getStepIndex() == expected;
    }

    private boolean validStepIndex(int stepIndex, List<WorkoutStep> steps) {
        return stepIndex >= 0 && stepIndex < steps.size();
    }

    private boolean validSuccessor(WorkoutExecution execution, WorkoutExecutionEvent previous,
                                   WorkoutExecutionEvent current) {
        return current != null
                && Objects.equals(execution.getId(), current.getExecutionId())
                && current.getOccurredAt() != null
                && current.getSequenceNo() == previous.getSequenceNo() + 1
                && !current.getOccurredAt().isBefore(previous.getOccurredAt())
                && current.getWorkoutElapsedMs() >= previous.getWorkoutElapsedMs();
    }

    private Integer intensityDelta(String payload) {
        if (payload == null) return null;
        Matcher matcher = INTENSITY_DELTA.matcher(payload);
        if (!matcher.find()) return null;
        try {
            return Integer.valueOf(matcher.group(1));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Integer adjusted(Integer value, int adjustmentPct) {
        return value == null ? null : (int) Math.round(value * (1 + adjustmentPct / 100.0));
    }

    private Long durationMs(WorkoutStep step) {
        if (step.getDurationSec() == null || "OPEN".equalsIgnoreCase(step.getDurationType())
                || "LAP_BUTTON".equalsIgnoreCase(step.getDurationType())) {
            return null;
        }
        return Math.max(0, step.getDurationSec()) * 1_000L;
    }

    private String normalize(String type) {
        return type == null ? "" : type.toUpperCase(Locale.ROOT);
    }

    private Timeline unknown(String reason) {
        return new Timeline("UNKNOWN", reason, List.of());
    }

    private record ReplayState(int stepIndex, long stepElapsedMs, int intensityAdjustmentPct, boolean running) {
    }

    public record Timeline(String availability, String reason, List<TargetSegment> segments) {
    }

    public record TargetSegment(Instant startedAt, Instant endedAt, int stepIndex,
                                Integer powerPctFtpLow, Integer powerPctFtpHigh) {
    }
}
