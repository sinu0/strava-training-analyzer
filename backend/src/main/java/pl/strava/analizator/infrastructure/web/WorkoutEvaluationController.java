package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.WorkoutEvaluationService;
import pl.strava.analizator.application.dto.WorkoutEvaluationRequest;
import pl.strava.analizator.application.dto.WorkoutEvaluationResponse;

@RestController
@RequestMapping("/api/evaluation")
@RequiredArgsConstructor
public class WorkoutEvaluationController {

    private final WorkoutEvaluationService workoutEvaluationService;

    @PostMapping("/workout")
    public ResponseEntity<WorkoutEvaluationResponse> evaluateWorkout(
            @RequestBody WorkoutEvaluationRequest request) {
        return ResponseEntity.ok(workoutEvaluationService.evaluate(request));
    }
}
