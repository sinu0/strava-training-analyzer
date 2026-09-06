package pl.strava.analizator.application;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionRepository;

@Service
@RequiredArgsConstructor
public class WorkoutActivityMatchingService {
    private static final Duration MATCH_WINDOW = Duration.ofMinutes(45);

    private final WorkoutExecutionRepository executionRepository;
    private final TrainingPlanRepository trainingPlanRepository;
    private final ActivityRepository activityRepository;
    private final Clock clock;
    private final pl.strava.analizator.domain.port.WorkoutExecutionEventRepository events;

    @Transactional
    public void matchImported(Activity imported) {
        if (imported == null || imported.getId() == null) {
            return;
        }
        for (WorkoutExecution execution : executionRepository.findCompletedWithoutActivity()) {
            List<Activity> candidates = candidates(execution);
            List<Activity> explicit = candidates.stream().filter(activity -> containsExecutionId(activity, execution.getId())).toList();
            if (explicit.size() == 1) {
                link(execution, explicit.getFirst(), "EXPLICIT");
            } else if (explicit.size() > 1 || candidates.size() > 1) {
                markAmbiguous(execution);
            } else if (candidates.size() == 1) {
                link(execution, candidates.getFirst(), "AUTO");
            }
        }
    }

    public List<Activity> candidates(UUID executionId) {
        return candidates(find(executionId));
    }

    @Transactional
    public WorkoutExecution linkManually(UUID executionId, UUID activityId) {
        WorkoutExecution execution = find(executionId);
        if (activityId == null) {
            trainingPlanRepository.findById(execution.getScheduledWorkoutId())
                    .filter(plan -> java.util.Objects.equals(plan.getActualActivityId(), execution.getActivityId()))
                    .ifPresent(plan -> trainingPlanRepository.save(plan.toBuilder().actualActivityId(null)
                            .activityMatchStatus("UNMATCHED").compliancePct(null).build()));
            return executionRepository.save(execution.toBuilder().activityId(null)
                    .activityMatchStatus("UNMATCHED").complianceStatus("UNKNOWN").complianceScore(null)
                    .stateVersion(execution.getStateVersion() + 1).updatedAt(clock.instant()).build());
        }
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found: " + activityId));
        return link(execution, activity, "MANUAL");
    }

    private List<Activity> candidates(WorkoutExecution execution) {
        if (execution.getStartedAt() == null || execution.getFinishedAt() == null) {
            return List.of();
        }
        OffsetDateTime from = OffsetDateTime.ofInstant(execution.getStartedAt().minus(MATCH_WINDOW), ZoneOffset.UTC);
        OffsetDateTime to = OffsetDateTime.ofInstant(execution.getFinishedAt().plus(MATCH_WINDOW), ZoneOffset.UTC);
        long executionSeconds = Math.max(1, execution.getWorkoutElapsedMs() / 1000);
        return activityRepository.findByStartedAtBetween(from, to).stream()
                .filter(this::isCycling)
                .filter(activity -> containsExecutionId(activity, execution.getId())
                        || credibleTiming(activity, execution, executionSeconds))
                .toList();
    }

    private boolean credibleTiming(Activity activity, WorkoutExecution execution, long executionSeconds) {
        if (activity.getStartedAt() == null) {
            return false;
        }
        long startDelta = Math.abs(Duration.between(execution.getStartedAt(),
                activity.getStartedAt().toInstant()).toSeconds());
        Integer duration = activity.getElapsedTimeSec() != null
                ? activity.getElapsedTimeSec() : activity.getMovingTimeSec();
        if (duration == null) {
            return startDelta <= MATCH_WINDOW.toSeconds();
        }
        long allowedDurationDelta = Math.max(900, Math.round(executionSeconds * 0.40));
        return startDelta <= MATCH_WINDOW.toSeconds()
                && Math.abs(duration.longValue() - executionSeconds) <= allowedDurationDelta;
    }

    private WorkoutExecution link(WorkoutExecution execution, Activity activity, String matchStatus) {
        Compliance compliance = evaluate(execution, activity);
        WorkoutExecution linked = executionRepository.save(execution.toBuilder()
                .activityId(activity.getId()).activityMatchStatus(matchStatus)
                .complianceStatus(compliance.status()).complianceScore(compliance.score())
                .complianceAlgorithmVersion(pl.strava.analizator.domain.workout.WorkoutComplianceEvaluator.VERSION)
                .stateVersion(execution.getStateVersion() + 1).updatedAt(clock.instant()).build());
        trainingPlanRepository.findById(execution.getScheduledWorkoutId()).ifPresent(plan ->
                trainingPlanRepository.save(plan.toBuilder().actualActivityId(activity.getId())
                        .activityMatchStatus(matchStatus).status(TrainingPlanStatus.COMPLETED)
                        .compliancePct(compliance.score() != null
                                ? java.math.BigDecimal.valueOf(compliance.score()) : null).build()));
        return linked;
    }

    private void markAmbiguous(WorkoutExecution execution) {
        executionRepository.save(execution.toBuilder().activityMatchStatus("AMBIGUOUS")
                .stateVersion(execution.getStateVersion() + 1).updatedAt(clock.instant()).build());
        trainingPlanRepository.findById(execution.getScheduledWorkoutId()).ifPresent(plan ->
                trainingPlanRepository.save(plan.toBuilder().activityMatchStatus("AMBIGUOUS").build()));
    }

    private Compliance evaluate(WorkoutExecution execution, Activity activity) {
        var evaluator = new pl.strava.analizator.domain.workout.WorkoutComplianceEvaluator();
        boolean changed = events.hasTimelineChanges(execution.getId()) || execution.getIntensityAdjustmentPct() != 0
                || (execution.getSkippedStepIndexes() != null && !execution.getSkippedStepIndexes().isEmpty())
                || (execution.getRepeatedStepIndexes() != null && !execution.getRepeatedStepIndexes().isEmpty());
        boolean aligned = activity.getStartedAt() != null && execution.getStartedAt() != null
                && Math.abs(Duration.between(execution.getStartedAt(), activity.getStartedAt().toInstant()).toSeconds()) <= 10;
        boolean paused = execution.getFinishedAt() == null || execution.getStartedAt() == null
                || Math.abs(Duration.between(execution.getStartedAt(), execution.getFinishedAt()).toMillis()
                        - execution.getWorkoutElapsedMs()) > 10_000;
        var result = changed || !aligned || paused ? evaluator.unknown("Zmieniona lub niezgodna oś czasu wykonania.")
                : evaluator.evaluate(execution.getStepsSnapshot(), execution.getFtpWatts(), activity);
        return new Compliance("AVAILABLE".equals(result.getAvailability()) ? "COMPLETE" : result.getAvailability(), result.getScore());
    }

    private boolean containsExecutionId(Activity activity, UUID executionId) {
        String marker = executionId.toString().toLowerCase(Locale.ROOT);
        return (activity.getName() != null && activity.getName().toLowerCase(Locale.ROOT).contains(marker))
                || (activity.getDescription() != null && activity.getDescription().toLowerCase(Locale.ROOT).contains(marker));
    }

    private boolean isCycling(Activity activity) {
        if (activity.getSportType() == null) {
            return false;
        }
        String sport = activity.getSportType().toLowerCase(Locale.ROOT);
        return sport.contains("ride") || sport.contains("cycling") || sport.contains("bike");
    }

    private WorkoutExecution find(UUID id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workout execution not found: " + id));
    }

    private record Compliance(String status, Integer score) {
    }
}
