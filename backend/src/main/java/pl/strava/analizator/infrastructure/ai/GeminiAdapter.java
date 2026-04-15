package pl.strava.analizator.infrastructure.ai;

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
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import pl.strava.analizator.domain.ai.LlmPort;

/**
 * LLM adapter for Google Gemini API.
 * POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
 * Activated when ai.gemini.enabled=true.
 */
@Component
@ConditionalOnProperty(name = "ai.gemini.enabled", havingValue = "true", matchIfMissing = false)
public class GeminiAdapter implements LlmPort {

    private static final Logger log = LoggerFactory.getLogger(GeminiAdapter.class);
    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

    private final String apiKey;
    private final RestTemplate restTemplate;

    public GeminiAdapter(
            @Value("${ai.gemini.api-key:}") String apiKey,
            RestTemplate restTemplate) {
        this.apiKey = apiKey;
        this.restTemplate = restTemplate;
    }

    @Override
    public String chat(String systemPrompt, String userPrompt, String modelId) {
        String url = BASE_URL + "/models/" + modelId + ":generateContent?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("text", systemPrompt + "\n\n" + userPrompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 2048
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);

        if (response.getBody() != null && response.getBody().containsKey("candidates")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            if (!candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                if (content != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
        }

        throw new RuntimeException("Unexpected Gemini response format");
    }

    @Override
    public boolean isAvailable(String modelId) {
        try {
            String url = BASE_URL + "/models/" + modelId + "?key=" + apiKey;
            HttpHeaders headers = new HttpHeaders();
            ResponseEntity<Map> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Gemini API not reachable or model {} unavailable: {}", modelId, e.getMessage());
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "gemini";
    }
}
