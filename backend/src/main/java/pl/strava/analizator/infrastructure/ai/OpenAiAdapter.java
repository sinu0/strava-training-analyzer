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
 * LLM adapter for OpenAI-compatible APIs (OpenAI, Azure OpenAI, local servers with OpenAI-compatible endpoints).
 * Activated when ai.openai.enabled=true.
 */
@Component
@ConditionalOnProperty(name = "ai.openai.enabled", havingValue = "true", matchIfMissing = false)
public class OpenAiAdapter implements LlmPort {

    private static final Logger log = LoggerFactory.getLogger(OpenAiAdapter.class);

    private final String baseUrl;
    private final String apiKey;
    private final RestTemplate restTemplate;

    public OpenAiAdapter(
            @Value("${ai.openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${ai.openai.api-key:}") String apiKey,
            RestTemplate restTemplate) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.restTemplate = restTemplate;
    }

    @Override
    public String chat(String systemPrompt, String userPrompt, String modelId) {
        String url = baseUrl + "/chat/completions";

        Map<String, Object> body = Map.of(
                "model", modelId,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.3,
                "max_tokens", 2048
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (apiKey != null && !apiKey.isBlank()) {
            headers.setBearerAuth(apiKey);
        }

        ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);

        if (response.getBody() != null && response.getBody().containsKey("choices")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            if (!choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }

        throw new RuntimeException("Unexpected OpenAI response format");
    }

    @Override
    public boolean isAvailable(String modelId) {
        try {
            String url = baseUrl + "/models";
            HttpHeaders headers = new HttpHeaders();
            if (apiKey != null && !apiKey.isBlank()) {
                headers.setBearerAuth(apiKey);
            }
            ResponseEntity<Map> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);

            if (response.getBody() != null && response.getBody().containsKey("data")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> models = (List<Map<String, Object>>) response.getBody().get("data");
                return models.stream()
                        .anyMatch(m -> modelId.equals(m.get("id")));
            }
            return false;
        } catch (Exception e) {
            log.warn("OpenAI API not reachable: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "openai";
    }
}
