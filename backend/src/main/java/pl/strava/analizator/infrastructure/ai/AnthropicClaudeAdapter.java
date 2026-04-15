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
 * LLM adapter for Anthropic Claude API.
 * Activated when ai.anthropic.enabled=true.
 * API: POST /v1/messages (Anthropic Messages API)
 */
@Component
@ConditionalOnProperty(name = "ai.anthropic.enabled", havingValue = "true", matchIfMissing = false)
public class AnthropicClaudeAdapter implements LlmPort {

    private static final Logger log = LoggerFactory.getLogger(AnthropicClaudeAdapter.class);
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private final String baseUrl;
    private final String apiKey;
    private final RestTemplate restTemplate;

    public AnthropicClaudeAdapter(
            @Value("${ai.anthropic.base-url:https://api.anthropic.com}") String baseUrl,
            @Value("${ai.anthropic.api-key:}") String apiKey,
            RestTemplate restTemplate) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.restTemplate = restTemplate;
    }

    @Override
    public String chat(String systemPrompt, String userPrompt, String modelId) {
        String url = baseUrl + "/v1/messages";

        Map<String, Object> body = Map.of(
                "model", modelId,
                "system", systemPrompt,
                "messages", List.of(
                        Map.of("role", "user", "content", userPrompt)
                ),
                "max_tokens", 2048,
                "temperature", 0.3
        );

        HttpHeaders headers = buildHeaders();
        ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);

        if (response.getBody() != null && response.getBody().containsKey("content")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> content = (List<Map<String, Object>>) response.getBody().get("content");
            if (!content.isEmpty()) {
                return (String) content.get(0).get("text");
            }
        }

        throw new RuntimeException("Unexpected Anthropic response format");
    }

    @Override
    public boolean isAvailable(String modelId) {
        try {
            // Anthropic doesn't have a models list endpoint; probe with a minimal request
            String url = baseUrl + "/v1/messages";
            Map<String, Object> body = Map.of(
                    "model", modelId,
                    "messages", List.of(Map.of("role", "user", "content", "ping")),
                    "max_tokens", 1
            );
            HttpHeaders headers = buildHeaders();
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
            return true;
        } catch (Exception e) {
            log.warn("Anthropic API not reachable or model {} unavailable: {}", modelId, e.getMessage());
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "anthropic";
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (apiKey != null && !apiKey.isBlank()) {
            headers.set("x-api-key", apiKey);
        }
        headers.set("anthropic-version", ANTHROPIC_VERSION);
        return headers;
    }
}
