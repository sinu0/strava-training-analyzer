package pl.strava.analizator.application;

import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutFileExporter;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;

@Service
@RequiredArgsConstructor
public class WorkoutExportService {

    private static final int DEFAULT_FTP = 200;

    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final TrainingPlanRepository trainingPlanRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final WorkoutFileExporter workoutFileExporter;

    public byte[] exportAsZwo(UUID templateId) {
        WorkoutTemplate template = findTemplate(templateId);
        int ftp = getAthleteFtp();
        return workoutFileExporter.encodeAsZwo(template, ftp);
    }

    public byte[] exportAsFit(UUID templateId) {
        WorkoutTemplate template = findTemplate(templateId);
        int ftp = getAthleteFtp();
        return workoutFileExporter.encodeAsFit(template, ftp);
    }

    public byte[] exportScheduledAsZwo(UUID scheduledWorkoutId) {
        TrainingPlan plan = findScheduled(scheduledWorkoutId);
        return workoutFileExporter.encodeAsZwo(snapshot(plan), scheduledFtp(plan));
    }

    public byte[] exportScheduledAsFit(UUID scheduledWorkoutId) {
        TrainingPlan plan = findScheduled(scheduledWorkoutId);
        return workoutFileExporter.encodeAsFit(snapshot(plan), scheduledFtp(plan));
    }

    private TrainingPlan findScheduled(UUID id) {
        return trainingPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled workout not found: " + id));
    }

    private WorkoutTemplate snapshot(TrainingPlan plan) {
        if (plan.getWorkoutStepsSnapshot() == null || plan.getWorkoutStepsSnapshot().isEmpty()) {
            throw new IllegalStateException("Scheduled workout does not contain an immutable step snapshot");
        }
        return WorkoutTemplate.builder()
                .id(plan.getWorkoutTemplateId()).revisionId(plan.getWorkoutTemplateRevisionId())
                .revision(plan.getWorkoutTemplateRevision() != null ? plan.getWorkoutTemplateRevision() : 1)
                .name(plan.getWorkoutNameSnapshot() != null ? plan.getWorkoutNameSnapshot() : plan.getPlannedDescription())
                .steps(plan.getWorkoutStepsSnapshot()).targetDurationMin(plan.getPlannedDurationMin())
                .targetTss(plan.getPlannedTss()).build();
    }

    private int scheduledFtp(TrainingPlan plan) {
        return plan.getFtpWatts() != null ? plan.getFtpWatts() : getAthleteFtp();
    }

    private WorkoutTemplate findTemplate(UUID templateId) {
        return workoutTemplateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Workout template not found: " + templateId));
    }

    private int getAthleteFtp() {
        return athleteProfileRepository.findFirst()
                .map(p -> p.getFtpWatts() != null ? p.getFtpWatts().intValue() : DEFAULT_FTP)
                .orElse(DEFAULT_FTP);
    }
}
