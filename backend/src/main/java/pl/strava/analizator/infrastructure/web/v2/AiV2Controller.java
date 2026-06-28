package pl.strava.analizator.infrastructure.web.v2;

import java.util.List;
import java.util.Map;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.AiPredictionServiceV2;
import pl.strava.analizator.application.dto.CompareRequestDto;
import pl.strava.analizator.application.dto.PredictionRequestV2Dto;
import pl.strava.analizator.application.dto.PredictionResponseV2Dto;

@RestController
@RequestMapping("/api/v2/ai")
@ConditionalOnProperty(name = "ai.enabled", havingValue = "true")
@RequiredArgsConstructor
public class AiV2Controller {

    private final AiPredictionServiceV2 predictionServiceV2;

    @PostMapping("/predict")
    public PredictionResponseV2Dto predict(@RequestBody PredictionRequestV2Dto request) {
        return predictionServiceV2.predict(request);
    }

    @PostMapping("/compare")
    public List<PredictionResponseV2Dto> compare(@RequestBody CompareRequestDto request) {
        return predictionServiceV2.compare(request);
    }

    @GetMapping("/models")
    public Map<String, Object> models() {
        return predictionServiceV2.getAvailableModels();
    }

    @GetMapping("/knowledge/status")
    public Map<String, Object> knowledgeStatus() {
        return predictionServiceV2.getKnowledgeStatus();
    }

    @PostMapping("/knowledge/refresh")
    public Map<String, Object> knowledgeRefresh() {
        return predictionServiceV2.refreshKnowledge();
    }

    @GetMapping("/history")
    public List<PredictionResponseV2Dto> history(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "20") int limit) {
        return predictionServiceV2.getHistory(type, limit);
    }
}
