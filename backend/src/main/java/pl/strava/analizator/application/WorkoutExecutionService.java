package pl.strava.analizator.application;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.WorkoutExecutionEventRequest;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionEvent;
import pl.strava.analizator.domain.model.WorkoutExecutionStatus;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionEventRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionRepository;
import pl.strava.analizator.domain.workout.WorkoutRunner;
import pl.strava.analizator.domain.workout.WorkoutStepExpander;

@Service
@RequiredArgsConstructor
public class WorkoutExecutionService {
    private static final String COMPLIANCE_VERSION = pl.strava.analizator.domain.workout.WorkoutComplianceEvaluator.VERSION;

    private final WorkoutExecutionRepository executionRepository;
    private final WorkoutExecutionEventRepository eventRepository;
    private final TrainingPlanRepository trainingPlanRepository;
    private final Clock clock;
    private final pl.strava.analizator.domain.port.CoachingFeedbackRepository coachingFeedbackRepository;

    @Transactional
    public WorkoutExecution start(UUID scheduledWorkoutId, String idempotencyKey, Instant requestedAt,
                                  String deliveryMethod) {
        requireKey(idempotencyKey);
        var existing = executionRepository.findByStartIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return reconcileAndSave(existing.get(), now(requestedAt));
        }
        executionRepository.findActive().ifPresent(active -> {
            throw new IllegalStateException("Inne wykonanie treningu jest już aktywne: " + active.getId());
        });
        TrainingPlan plan = trainingPlanRepository.findById(scheduledWorkoutId)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled workout not found: " + scheduledWorkoutId));
        var expandedSteps = WorkoutStepExpander.expand(plan.getWorkoutStepsSnapshot());
        if (expandedSteps.isEmpty()) {
            throw new IllegalStateException("Scheduled workout has no executable snapshot");
        }
        Instant at = now(requestedAt);
        WorkoutExecution ready = WorkoutExecution.builder()
                .id(UUID.randomUUID()).scheduledWorkoutId(plan.getId())
                .workoutTemplateRevision(plan.getWorkoutTemplateRevision())
                .workoutNameSnapshot(plan.getWorkoutNameSnapshot() != null
                        ? plan.getWorkoutNameSnapshot() : plan.getPlannedDescription())
                .stepsSnapshot(expandedSteps)
                .ftpWatts(plan.getFtpWatts()).lthrBpm(plan.getLthrBpm())
                .maxHrBpm(plan.getMaxHrBpm()).restingHrBpm(plan.getRestingHrBpm())
                .startedAt(at).status(WorkoutExecutionStatus.READY)
                .currentStepIndex(0).workoutElapsedMs(0).stepElapsedMs(0)
                .intensityAdjustmentPct(0).skippedStepIndexes(List.of()).repeatedStepIndexes(List.of())
                .activityMatchStatus("PENDING").complianceStatus("UNKNOWN")
                .complianceAlgorithmVersion(COMPLIANCE_VERSION)
                .startIdempotencyKey(idempotencyKey)
                .deliveryMethod(deliveryMethod != null ? deliveryMethod : "ON_DEVICE")
                .stateVersion(0).createdAt(at).updatedAt(at).build();
        WorkoutExecution started = executionRepository.save(WorkoutRunner.start(ready, at));
        appendEvent(started, "START", idempotencyKey, at, "{}");
        return started;
    }

    @Transactional
    public WorkoutExecution active() {
        return executionRepository.findActive()
                .map(execution -> reconcileAndSave(execution, clock.instant()))
                .orElse(null);
    }

    @Transactional
    public WorkoutExecution get(UUID id) {
        return reconcileAndSave(find(id), clock.instant());
    }

    @Transactional
    public WorkoutExecution applyEvent(UUID id, WorkoutExecutionEventRequest request) {
        requireKey(request.getIdempotencyKey());
        WorkoutExecution execution = find(id);
        if (eventRepository.findByExecutionIdAndIdempotencyKey(id, request.getIdempotencyKey()).isPresent()) {
            return reconcileAndSave(execution, now(request.getOccurredAt()));
        }
        Instant at = now(request.getOccurredAt());
        String type = request.getType() == null ? "CHECKPOINT" : request.getType().toUpperCase(Locale.ROOT);
        WorkoutExecution updated = switch (type) {
            case "PAUSE" -> WorkoutRunner.pause(execution, at);
            case "RESUME" -> WorkoutRunner.resume(execution, at);
            case "SKIP_STEP" -> WorkoutRunner.skipStep(execution, at);
            case "PREVIOUS_STEP", "REPEAT_STEP" -> WorkoutRunner.previousStep(execution, at);
            case "INTENSITY" -> WorkoutRunner.changeIntensity(execution,
                    request.getIntensityDeltaPct() != null ? request.getIntensityDeltaPct() : 0, at);
            case "CHECKPOINT", "LAP" -> "LAP".equals(type)
                    ? WorkoutRunner.skipStep(execution, at) : WorkoutRunner.reconcile(execution, at);
            default -> throw new IllegalArgumentException("Unsupported execution event: " + type);
        };
        updated = executionRepository.save(updated);
        String payload = request.getIntensityDeltaPct() != null
                ? "{\"intensityDeltaPct\":" + request.getIntensityDeltaPct() + "}" : "{}";
        appendEvent(updated, type, request.getIdempotencyKey(), at, payload);
        return updated;
    }

    @Transactional
    public WorkoutExecution finish(UUID id, String idempotencyKey, Instant requestedAt, boolean abort) {
        requireKey(idempotencyKey);
        var existing = executionRepository.findByFinishIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            if (!existing.get().getId().equals(id)) {
                throw new IllegalStateException("Idempotency key belongs to another execution");
            }
            return existing.get();
        }
        WorkoutExecution execution = find(id);
        Instant at = now(requestedAt);
        WorkoutExecution finished;
        if (execution.getStatus() == WorkoutExecutionStatus.COMPLETED && !abort) {
            finished = execution;
        } else if (execution.getStatus() == WorkoutExecutionStatus.ABORTED && abort) {
            finished = execution;
        } else {
            finished = abort ? WorkoutRunner.abort(execution, at) : WorkoutRunner.complete(execution, at);
        }
        finished = executionRepository.save(finished.toBuilder().finishIdempotencyKey(idempotencyKey).build());
        appendEvent(finished, abort ? "ABORT" : "COMPLETE", idempotencyKey, at, "{}");
        trainingPlanRepository.updateStatus(finished.getScheduledWorkoutId(),
                abort ? TrainingPlanStatus.SKIPPED : TrainingPlanStatus.COMPLETED);
        saveCoachingFeedback(finished);
        return finished;
    }

    @Transactional
    public WorkoutExecution feedback(UUID id, Integer rpe, String feeling, String notes) {
        if (rpe != null && (rpe < 1 || rpe > 10)) {
            throw new IllegalArgumentException("RPE must be between 1 and 10");
        }
        WorkoutExecution execution = find(id);
        Instant at = clock.instant();
        WorkoutExecution saved = executionRepository.save(execution.toBuilder()
                .rpe(rpe).feeling(feeling).notes(notes)
                .stateVersion(execution.getStateVersion() + 1).updatedAt(at).build());
        saveCoachingFeedback(saved);
        return saved;
    }

    private void saveCoachingFeedback(WorkoutExecution execution) {
        if (execution.getFinishedAt() == null) return;
        String type = trainingPlanRepository.findById(execution.getScheduledWorkoutId())
                .map(TrainingPlan::getPlannedType).orElse("UNKNOWN");
        coachingFeedbackRepository.save(pl.strava.analizator.domain.model.CoachingFeedback.builder()
                .id(UUID.randomUUID()).sourceKey("execution:" + execution.getId())
                .occurredAt(execution.getFinishedAt()).sessionType(type).rpe(execution.getRpe())
                .completed(execution.getStatus() == WorkoutExecutionStatus.COMPLETED).build());
    }

    private WorkoutExecution reconcileAndSave(WorkoutExecution execution, Instant at) {
        WorkoutExecution reconciled = WorkoutRunner.reconcile(execution, at);
        return reconciled == execution ? execution : executionRepository.save(reconciled);
    }

    private WorkoutExecution find(UUID id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workout execution not found: " + id));
    }

    private void appendEvent(WorkoutExecution execution, String type, String key, Instant at, String payload) {
        eventRepository.save(WorkoutExecutionEvent.builder().id(UUID.randomUUID())
                .executionId(execution.getId()).sequenceNo(eventRepository.nextSequence(execution.getId()))
                .eventType(type).occurredAt(at).workoutElapsedMs(execution.getWorkoutElapsedMs())
                .stepIndex(execution.getCurrentStepIndex()).payload(payload)
                .idempotencyKey(key).createdAt(clock.instant()).build());
    }

    private Instant now(Instant requested) {
        Instant server = clock.instant();
        if (requested == null) {
            return server;
        }
        if (requested.isAfter(server.plusSeconds(60))) {
            throw new IllegalArgumentException("Event timestamp outside allowed clock window");
        }
        return requested;
    }

    private void requireKey(String key) {
        if (key == null || key.isBlank() || key.length() > 100) {
            throw new IllegalArgumentException("A valid idempotencyKey is required");
        }
    }
}
