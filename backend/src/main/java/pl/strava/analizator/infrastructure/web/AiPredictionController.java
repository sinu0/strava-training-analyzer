package pl.strava.analizator.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.AiPredictionService;
import pl.strava.analizator.application.dto.AiModuleStatusDto;
import pl.strava.analizator.application.dto.BatchRunResultDto;
import pl.strava.analizator.application.dto.PredictionRequestDto;
import pl.strava.analizator.application.dto.PredictionResponseDto;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiPredictionController {

    private final AiPredictionService aiPredictionService;

    @PostMapping("/predict")
    public ResponseEntity<PredictionResponseDto> predict(@RequestBody PredictionRequestDto request) {
        return ResponseEntity.ok(aiPredictionService.predict(request));
    }

    @GetMapping("/status")
    public ResponseEntity<AiModuleStatusDto> getStatus() {
        return ResponseEntity.ok(aiPredictionService.getStatus());
    }

    @PostMapping("/batch/run")
    public ResponseEntity<BatchRunResultDto> runBatch(
            @RequestParam(defaultValue = "false") boolean skipExisting) {
        return ResponseEntity.ok(aiPredictionService.runBatch(skipExisting));
    }

    @GetMapping("/today-tips")
    public ResponseEntity<List<PredictionResponseDto>> getTodayTips() {
        return ResponseEntity.ok(aiPredictionService.getTodayTips());
    }
}
