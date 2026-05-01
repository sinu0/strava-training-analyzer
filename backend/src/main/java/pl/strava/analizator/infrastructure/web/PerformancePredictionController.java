package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.PerformancePredictionService;
import pl.strava.analizator.application.dto.CurrentPerformanceStateDto;
import pl.strava.analizator.application.dto.PerformancePredictionRequest;
import pl.strava.analizator.application.dto.PerformancePredictionResponse;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class PerformancePredictionController {

    private final PerformancePredictionService performancePredictionService;

    @GetMapping("/current-state")
    public ResponseEntity<CurrentPerformanceStateDto> getCurrentState() {
        return ResponseEntity.ok(performancePredictionService.getCurrentState());
    }

    @PostMapping("/predict")
    public ResponseEntity<PerformancePredictionResponse> predict(@RequestBody PerformancePredictionRequest request) {
        return ResponseEntity.ok(performancePredictionService.predict(request));
    }
}
