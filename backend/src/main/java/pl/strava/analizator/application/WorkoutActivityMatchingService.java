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
        int[] power = activity.getPowerStream();
        int[] times = activity.getTimeStream();
        if (power == null || power.length == 0 || times == null || times.length == 0 || execution.getFtpWatts() == null) {
            return new Compliance("UNKNOWN", null);
        }
        int samples = Math.min(power.length, times.length);
        int comparable = 0;
        int inTarget = 0;
        for (int i = 0; i < samples; i++) {
            WorkoutStep step = stepAt(execution.getStepsSnapshot(), times[i]);
            if (step == null || step.getPowerPctFtpLow() == null || step.getPowerPctFtpHigh() == null) {
                continue;
            }
            comparable++;
            double adjustment = 1 + execution.getIntensityAdjustmentPct() / 100.0;
            double low = execution.getFtpWatts() * step.getPowerPctFtpLow() / 100.0 * adjustment;
            double high = execution.getFtpWatts() * step.getPowerPctFtpHigh() / 100.0 * adjustment;
            if (power[i] >= low && power[i] <= high) {
                inTarget++;
            }
        }
        if (comparable == 0) {
            return new Compliance("PARTIAL", null);
        }
        return new Compliance("COMPLETE", (int) Math.round(inTarget * 100.0 / comparable));
    }

    private WorkoutStep stepAt(List<WorkoutStep> steps, int second) {
        if (steps == null) {
            return null;
        }
        int cursor = 0;
        for (WorkoutStep step : steps) {
            if (step.getDurationSec() == null) {
                return step;
            }
            cursor += step.getDurationSec();
            if (second < cursor) {
                return step;
            }
        }
        return null;
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
