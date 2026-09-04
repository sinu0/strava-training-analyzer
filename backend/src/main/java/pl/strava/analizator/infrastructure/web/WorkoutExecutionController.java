package pl.strava.analizator.infrastructure.web;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.WorkoutExecutionService;
import pl.strava.analizator.application.WorkoutActivityMatchingService;
import pl.strava.analizator.application.WorkoutExportService;
import pl.strava.analizator.application.dto.FinishWorkoutExecutionRequest;
import pl.strava.analizator.application.dto.StartWorkoutExecutionRequest;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.application.dto.WorkoutActivityLinkRequest;
import pl.strava.analizator.application.dto.WorkoutActivityCandidateDto;
import pl.strava.analizator.application.dto.WorkoutDeliveryCapabilityDto;
import pl.strava.analizator.application.dto.WorkoutExecutionDto;
import pl.strava.analizator.application.dto.WorkoutExecutionEventRequest;
import pl.strava.analizator.application.dto.WorkoutFeedbackRequest;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutDeliveryPort;

@RestController
@RequestMapping("/api/v2/workouts")
@RequiredArgsConstructor
public class WorkoutExecutionController {
    private final WorkoutExecutionService executionService;
    private final WorkoutActivityMatchingService matchingService;
    private final WorkoutExportService exportService;
    private final TrainingPlanRepository trainingPlanRepository;
    private final WorkoutDeliveryPort deliveryPort;
    private final Clock clock;

    @GetMapping("/today")
    public List<TrainingPlanDto> today() {
        LocalDate today = LocalDate.now(clock);
        return trainingPlanRepository.findByDateRange(today, today).stream()
                .map(plan -> TrainingPlanDto.fromDomain(plan, plan.getWorkoutNameSnapshot(), null)).toList();
    }

    @GetMapping("/scheduled/{id}")
    public TrainingPlanDto scheduled(@PathVariable UUID id) {
        var plan = trainingPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled workout not found: " + id));
        return TrainingPlanDto.fromDomain(plan, plan.getWorkoutNameSnapshot(), null);
    }

    @PostMapping("/scheduled/{id}/executions/start")
    public WorkoutExecutionDto start(@PathVariable UUID id, @RequestBody StartWorkoutExecutionRequest request) {
        return WorkoutExecutionDto.fromDomain(executionService.start(id, request.getIdempotencyKey(),
                request.getOccurredAt(), request.getDeliveryMethod()));
    }

    @GetMapping("/executions/active")
    public ResponseEntity<WorkoutExecutionDto> active() {
        var active = executionService.active();
        return active == null ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(WorkoutExecutionDto.fromDomain(active));
    }

    @GetMapping("/executions/{id}")
    public WorkoutExecutionDto execution(@PathVariable UUID id) {
        return WorkoutExecutionDto.fromDomain(executionService.get(id));
    }

    @PostMapping("/executions/{id}/events")
    public WorkoutExecutionDto event(@PathVariable UUID id, @RequestBody WorkoutExecutionEventRequest request) {
        return WorkoutExecutionDto.fromDomain(executionService.applyEvent(id, request));
    }

    @PostMapping("/executions/{id}/complete")
    public WorkoutExecutionDto complete(@PathVariable UUID id, @RequestBody FinishWorkoutExecutionRequest request) {
        return WorkoutExecutionDto.fromDomain(executionService.finish(id, request.getIdempotencyKey(),
                request.getOccurredAt(), false));
    }

    @PostMapping("/executions/{id}/abort")
    public WorkoutExecutionDto abort(@PathVariable UUID id, @RequestBody FinishWorkoutExecutionRequest request) {
        return WorkoutExecutionDto.fromDomain(executionService.finish(id, request.getIdempotencyKey(),
                request.getOccurredAt(), true));
    }

    @PutMapping("/executions/{id}/feedback")
    public WorkoutExecutionDto feedback(@PathVariable UUID id, @RequestBody WorkoutFeedbackRequest request) {
        return WorkoutExecutionDto.fromDomain(executionService.feedback(id, request.getRpe(),
                request.getFeeling(), request.getNotes()));
    }

    @PutMapping("/executions/{id}/activity-link")
    public WorkoutExecutionDto link(@PathVariable UUID id, @RequestBody WorkoutActivityLinkRequest request) {
        return WorkoutExecutionDto.fromDomain(matchingService.linkManually(id, request.getActivityId()));
    }

    @GetMapping("/executions/{id}/activity-candidates")
    public List<WorkoutActivityCandidateDto> candidates(@PathVariable UUID id) {
        return matchingService.candidates(id).stream().map(WorkoutActivityCandidateDto::fromDomain).toList();
    }

    @GetMapping("/scheduled/{id}/export/fit")
    public ResponseEntity<byte[]> exportFit(@PathVariable UUID id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"scheduled-workout.fit\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(exportService.exportScheduledAsFit(id));
    }

    @GetMapping("/scheduled/{id}/export/zwo")
    public ResponseEntity<byte[]> exportZwo(@PathVariable UUID id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"scheduled-workout.zwo\"")
                .contentType(MediaType.APPLICATION_XML)
                .body(exportService.exportScheduledAsZwo(id));
    }

    @GetMapping("/delivery-capabilities")
    public List<WorkoutDeliveryCapabilityDto> capabilities() {
        return deliveryPort.capabilities().stream().map(WorkoutDeliveryCapabilityDto::fromDomain).toList();
    }
}
