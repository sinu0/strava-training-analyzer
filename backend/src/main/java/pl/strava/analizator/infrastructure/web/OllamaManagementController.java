package pl.strava.analizator.infrastructure.web;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

/**
 * REST controller for managing Ollama models (list, pull, delete).
 * Only active when Ollama is enabled.
 */
@RestController
@RequestMapping("/api/ai/ollama")
@ConditionalOnProperty(name = "ai.ollama.enabled", havingValue = "true", matchIfMissing = false)
public class OllamaManagementController {

    private static final Logger log = LoggerFactory.getLogger(OllamaManagementController.class);

    private final String baseUrl;
    private final RestTemplate restTemplate;

    public OllamaManagementController(
            @Value("${ai.ollama.base-url:http://localhost:11434}") String baseUrl,
            RestTemplate restTemplate) {
        this.baseUrl = baseUrl;
        this.restTemplate = restTemplate;
    }

    @GetMapping("/models")
    public ResponseEntity<Map> listModels() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(baseUrl + "/api/tags", Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            log.error("Failed to list Ollama models: {}", e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", "Ollama not reachable"));
        }
    }

    @PostMapping("/pull")
    public ResponseEntity<Map> pullModel(@RequestBody Map<String, String> request) {
        String modelName = request.get("name");
        if (modelName == null || modelName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Model name is required"));
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of("name", modelName, "stream", false);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/api/pull", new HttpEntity<>(body, headers), Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            log.error("Failed to pull model {}: {}", modelName, e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", "Failed to pull model: " + e.getMessage()));
        }
    }

    @DeleteMapping("/models")
    public ResponseEntity<Map> deleteModel(@RequestBody Map<String, String> request) {
        String modelName = request.get("name");
        if (modelName == null || modelName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Model name is required"));
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            Map<String, Object> body = Map.of("name", modelName);
            restTemplate.exchange(baseUrl + "/api/delete",
                    org.springframework.http.HttpMethod.DELETE,
                    new HttpEntity<>(body, headers), Map.class);
            return ResponseEntity.ok(Map.of("status", "deleted", "model", modelName));
        } catch (Exception e) {
            log.error("Failed to delete model {}: {}", modelName, e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", "Failed to delete model: " + e.getMessage()));
        }
    }
}
