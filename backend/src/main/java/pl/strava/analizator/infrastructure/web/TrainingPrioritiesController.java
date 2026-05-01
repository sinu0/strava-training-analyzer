package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.TrainingPrioritiesService;
import pl.strava.analizator.application.dto.TrainingPrioritiesDto;

@RestController
@RequestMapping("/api/training-priorities")
@RequiredArgsConstructor
public class TrainingPrioritiesController {

    private final TrainingPrioritiesService trainingPrioritiesService;

    @GetMapping
    public ResponseEntity<TrainingPrioritiesDto> getPriorities() {
        return ResponseEntity.ok(trainingPrioritiesService.getPriorities());
    }
}
