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
 * LLM adapter for Azure OpenAI Service.
 * Uses Azure-specific endpoint format: {base-url}/openai/deployments/{deployment}/chat/completions?api-version={version}
 * Activated when ai.azure-openai.enabled=true.
 */
@Component
@ConditionalOnProperty(name = "ai.azure-openai.enabled", havingValue = "true", matchIfMissing = false)
public class AzureOpenAiAdapter implements LlmPort {

    private static final Logger log = LoggerFactory.getLogger(AzureOpenAiAdapter.class);

    private final String baseUrl;
    private final String apiKey;
    private final String deployment;
    private final String apiVersion;
    private final RestTemplate restTemplate;

    public AzureOpenAiAdapter(
            @Value("${ai.azure-openai.base-url:}") String baseUrl,
            @Value("${ai.azure-openai.api-key:}") String apiKey,
            @Value("${ai.azure-openai.deployment:}") String deployment,
            @Value("${ai.azure-openai.api-version:2024-02-01}") String apiVersion,
            RestTemplate restTemplate) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.deployment = deployment;
        this.apiVersion = apiVersion;
        this.restTemplate = restTemplate;
    }

    @Override
    public String chat(String systemPrompt, String userPrompt, String modelId) {
        String url = baseUrl + "/openai/deployments/" + deployment + "/chat/completions?api-version=" + apiVersion;

        Map<String, Object> body = Map.of(
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
            headers.set("api-key", apiKey);
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

        throw new RuntimeException("Unexpected Azure OpenAI response format");
    }

    @Override
    public boolean isAvailable(String modelId) {
        try {
            String url = baseUrl + "/openai/deployments/" + deployment + "?api-version=" + apiVersion;
            HttpHeaders headers = new HttpHeaders();
            if (apiKey != null && !apiKey.isBlank()) {
                headers.set("api-key", apiKey);
            }
            ResponseEntity<Map> response = restTemplate.exchange(url,
                    org.springframework.http.HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Azure OpenAI API not reachable: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "azure-openai";
    }
}
