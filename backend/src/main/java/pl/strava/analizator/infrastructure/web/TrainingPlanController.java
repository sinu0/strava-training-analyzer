package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.TrainingPlanService;
import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.CreateTrainingPlanRequest;
import pl.strava.analizator.application.dto.GeneratePlanRequest;
import pl.strava.analizator.application.dto.RecordAdjustmentFeedbackRequest;
import pl.strava.analizator.application.dto.TrainingPlanDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.domain.model.TrainingPlanStatus;

@RestController
@RequestMapping("/api/training")
@RequiredArgsConstructor
public class TrainingPlanController {

    private final TrainingPlanService trainingPlanService;

    @GetMapping("/plans")
    public ResponseEntity<List<TrainingPlanDto>> getPlans(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(trainingPlanService.getPlans(from, to));
    }

    @PostMapping("/plans")
    public ResponseEntity<TrainingPlanDto> createPlan(@RequestBody CreateTrainingPlanRequest request) {
        TrainingPlanDto created = trainingPlanService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/plans/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        trainingPlanService.updateStatus(id, TrainingPlanStatus.valueOf(status));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/plans/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable UUID id) {
        trainingPlanService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<CalendarDayDto>> getCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(trainingPlanService.getCalendarView(from, to));
    }

    @PostMapping("/adjustments/feedback")
    public ResponseEntity<Void> recordAdjustmentFeedback(@RequestBody RecordAdjustmentFeedbackRequest request) {
        trainingPlanService.recordAdjustmentFeedback(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/programs")
    public ResponseEntity<List<TrainingPlanProgramDto>> getPrograms() {
        return ResponseEntity.ok(trainingPlanService.getPrograms());
    }

    @PostMapping("/programs/generate")
    public ResponseEntity<TrainingPlanProgramDto> generatePlan(@RequestBody GeneratePlanRequest request) {
        TrainingPlanProgramDto program = trainingPlanService.generatePlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(program);
    }

    @DeleteMapping("/programs/{id}")
    public ResponseEntity<Void> deleteProgram(@PathVariable UUID id) {
        trainingPlanService.deleteProgram(id);
        return ResponseEntity.noContent().build();
    }
}
