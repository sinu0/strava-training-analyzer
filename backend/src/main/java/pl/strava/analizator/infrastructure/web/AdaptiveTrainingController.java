package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AdaptiveTrainingService;
import pl.strava.analizator.application.dto.AdaptiveTrainingRequest;
import pl.strava.analizator.application.dto.AdaptiveTrainingResponse;

@RestController
@RequestMapping("/api/training")
@RequiredArgsConstructor
public class AdaptiveTrainingController {

    private final AdaptiveTrainingService adaptiveTrainingService;

    @PostMapping("/adapt")
    public ResponseEntity<AdaptiveTrainingResponse> adapt(@RequestBody AdaptiveTrainingRequest request) {
        return ResponseEntity.ok(adaptiveTrainingService.adapt(request));
    }
}
