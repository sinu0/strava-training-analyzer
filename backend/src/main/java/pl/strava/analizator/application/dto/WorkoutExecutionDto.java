package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.Getter;
import lombok.Setter;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutStep;

@Getter
@Setter
public class WorkoutExecutionDto {
    private UUID id;
    private UUID scheduledWorkoutId;
    private Integer workoutTemplateRevision;
    private String workoutNameSnapshot;
    private List<WorkoutStep> stepsSnapshot;
    private Integer ftpWatts;
    private Integer lthrBpm;
    private Integer maxHrBpm;
    private Integer restingHrBpm;
    private Instant startedAt;
    private Instant finishedAt;
    private String status;
    private int currentStepIndex;
    private long workoutElapsedMs;
    private long stepElapsedMs;
    private Instant runningSince;
    private int intensityAdjustmentPct;
    private List<Integer> skippedStepIndexes;
    private List<Integer> repeatedStepIndexes;
    private Integer rpe;
    private String feeling;
    private String notes;
    private UUID activityId;
    private String activityMatchStatus;
    private String complianceStatus;
    private Integer complianceScore;
    private String complianceAlgorithmVersion;
    private String deliveryMethod;
    private long stateVersion;
    private Instant updatedAt;

    public static WorkoutExecutionDto fromDomain(WorkoutExecution execution) {
        WorkoutExecutionDto dto = new WorkoutExecutionDto();
        dto.id = execution.getId();
        dto.scheduledWorkoutId = execution.getScheduledWorkoutId();
        dto.workoutTemplateRevision = execution.getWorkoutTemplateRevision();
        dto.workoutNameSnapshot = execution.getWorkoutNameSnapshot();
        dto.stepsSnapshot = execution.getStepsSnapshot();
        dto.ftpWatts = execution.getFtpWatts();
        dto.lthrBpm = execution.getLthrBpm();
        dto.maxHrBpm = execution.getMaxHrBpm();
        dto.restingHrBpm = execution.getRestingHrBpm();
        dto.startedAt = execution.getStartedAt();
        dto.finishedAt = execution.getFinishedAt();
        dto.status = execution.getStatus().name();
        dto.currentStepIndex = execution.getCurrentStepIndex();
        dto.workoutElapsedMs = execution.getWorkoutElapsedMs();
        dto.stepElapsedMs = execution.getStepElapsedMs();
        dto.runningSince = execution.getRunningSince();
        dto.intensityAdjustmentPct = execution.getIntensityAdjustmentPct();
        dto.skippedStepIndexes = execution.getSkippedStepIndexes();
        dto.repeatedStepIndexes = execution.getRepeatedStepIndexes();
        dto.rpe = execution.getRpe();
        dto.feeling = execution.getFeeling();
        dto.notes = execution.getNotes();
        dto.activityId = execution.getActivityId();
        dto.activityMatchStatus = execution.getActivityMatchStatus();
        dto.complianceStatus = execution.getComplianceStatus();
        dto.complianceScore = execution.getComplianceScore();
        dto.complianceAlgorithmVersion = execution.getComplianceAlgorithmVersion();
        dto.deliveryMethod = execution.getDeliveryMethod();
        dto.stateVersion = execution.getStateVersion();
        dto.updatedAt = execution.getUpdatedAt();
        return dto;
    }
}
