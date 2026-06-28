package pl.strava.analizator.infrastructure.ai;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import pl.strava.analizator.domain.ai.AiTool;
import pl.strava.analizator.domain.ai.LlmChatResponse;
import pl.strava.analizator.domain.ai.LlmMessage;
import pl.strava.analizator.domain.ai.LlmPort;
import pl.strava.analizator.domain.ai.ToolCall;

/**
 * LLM adapter for Ollama (local inference server) — V1.
 * Activated when ai.provider=ollama or ai.ollama.enabled=true.
 * Ollama API: POST /api/chat with {model, messages, stream:false}
 * Supports tool calling when the loaded model has that capability.
 *
 * @deprecated Use {@link pl.strava.analizator.infrastructure.ai.v2.OllamaAdapterV2} instead.
 */
@Component
@ConditionalOnProperty(name = "ai.ollama.enabled", havingValue = "true", matchIfMissing = false)
@Deprecated
public class OllamaAdapter implements LlmPort {

    private static final Logger log = LoggerFactory.getLogger(OllamaAdapter.class);

    @Deprecated(forRemoval = true)
    private static final List<String> MODEL_PREFERENCE = List.of(
            "qwen3.6:27b", "qwen3.6:35b",
            "qwen3.5:27b", "qwen3.5:35b",
            "deepseek-r1:32b", "deepseek-r1:14b", "deepseek-r1:8b",
            "qwen2.5:72b", "qwen2.5:32b", "qwen2.5:14b", "qwen2.5:7b",
            "qwen3.5:14b", "qwen3.5:9b",
            "llama3.3:70b", "llama3.1:8b",
            "mistral:7b", "gemma2:9b"
    );

    private final String baseUrl;
    private final String configuredModel;
    private final RestTemplate restTemplate;

    /** Resolved lazily on first use; null = not yet resolved. */
    private volatile String resolvedModel;

    public OllamaAdapter(
            @Value("${ai.ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ai.model:}") String configuredModel,
            RestTemplate restTemplate) {
        this.baseUrl = baseUrl;
        this.configuredModel = configuredModel;
        this.restTemplate = createLongTimeoutRestTemplate();
    }

    private static RestTemplate createLongTimeoutRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30_000);
        factory.setReadTimeout(600_000);
        return new RestTemplate(factory);
    }

    private String effectiveModel(String modelId) {
        if (modelId != null && !modelId.isBlank()) return modelId;
        if (resolvedModel == null) resolveModel();
        return resolvedModel;
    }

    private synchronized void resolveModel() {
        if (resolvedModel != null) return; // already resolved by another thread
        if (!configuredModel.isBlank()) {
            resolvedModel = configuredModel;
            log.info("AI model: using configured model '{}'", resolvedModel);
            return;
        }
        try {
            List<String> available = fetchAvailableModels();
            resolvedModel = MODEL_PREFERENCE.stream()
                    .filter(preferred -> available.stream().anyMatch(a -> a.equals(preferred)))
                    .findFirst()
                    .orElse(available.isEmpty() ? "llama3" : available.get(0));
            log.info("AI model: auto-selected '{}' from available: {}", resolvedModel, available);
        } catch (Exception e) {
            resolvedModel = "llama3";
            log.warn("AI model: Ollama not reachable, defaulting to '{}': {}", resolvedModel, e.getMessage());
        }
    }

    @Override
    public String chat(String systemPrompt, String userPrompt, String modelId) {
        String model = effectiveModel(modelId);
        String url = baseUrl + "/api/chat";

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "stream", false,
                "options", Map.of(
                        "temperature", 0.3,
                        "num_predict", 2048
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
        return extractContent(response.getBody());
    }

    @Override
    @SuppressWarnings("unchecked")
    public LlmChatResponse chatWithTools(List<LlmMessage> messages, List<AiTool> tools, String modelId) {
        String model = effectiveModel(modelId);
        String url = baseUrl + "/api/chat";

        List<Map<String, Object>> ollamaMessages = messages.stream()
                .map(this::toLlamaMessage)
                .toList();

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", ollamaMessages);
        body.put("stream", false);
        body.put("options", Map.of("temperature", 0.3, "num_predict", 2048));
        if (!tools.isEmpty()) {
            body.put("tools", tools.stream().map(this::toOllamaTool).toList());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
        if (response.getBody() == null) throw new RuntimeException("Empty Ollama response");

        Map<String, Object> message = (Map<String, Object>) response.getBody().get("message");
        if (message == null) throw new RuntimeException("No message in Ollama response");

        // Check for tool calls
        List<Map<String, Object>> toolCalls = (List<Map<String, Object>>) message.get("tool_calls");
        if (toolCalls != null && !toolCalls.isEmpty()) {
            List<ToolCall> calls = toolCalls.stream()
                    .map(tc -> {
                        Map<String, Object> fn = (Map<String, Object>) tc.get("function");
                        String name = (String) fn.get("name");
                        Object rawArgs = fn.get("arguments");
                        Map<String, Object> args = rawArgs instanceof Map ? (Map<String, Object>) rawArgs : Map.of();
                        String id = (String) tc.getOrDefault("id", UUID.randomUUID().toString());
                        return new ToolCall(id, name, args);
                    })
                    .toList();
            return new LlmChatResponse.ToolCalls(calls);
        }

        String content = (String) message.get("content");
        return new LlmChatResponse.Text(content != null ? content : "");
    }

    @Override
    public boolean supportsToolCalling() {
        return true;
    }

    @Override
    public boolean isAvailable(String modelId) {
        try {
            String target = effectiveModel(modelId);
            return fetchAvailableModels().stream()
                    .anyMatch(m -> m.equals(target) || m.startsWith(target.split(":")[0] + ":"));
        } catch (Exception e) {
            log.warn("Ollama not reachable: {}", e.getMessage());
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> fetchAvailableModels() {
        ResponseEntity<Map> response = restTemplate.getForEntity(baseUrl + "/api/tags", Map.class);
        if (response.getBody() == null || !response.getBody().containsKey("models")) return List.of();
        List<Map<String, Object>> models = (List<Map<String, Object>>) response.getBody().get("models");
        return models.stream().map(m -> (String) m.get("name")).toList();
    }

    @Override
    public String getProviderName() {
        return "ollama";
    }

    // ---- Serialisation helpers ----

    @SuppressWarnings("unchecked")
    private Map<String, Object> toLlamaMessage(LlmMessage msg) {
        return switch (msg.role()) {
            case SYSTEM -> Map.of("role", "system", "content", msg.content());
            case USER -> Map.of("role", "user", "content", msg.content());
            case ASSISTANT -> {
                if (msg.hasToolCalls()) {
                    List<Map<String, Object>> calls = msg.toolCalls().stream()
                            .map(tc -> {
                                Map<String, Object> fn = new HashMap<>();
                                fn.put("name", tc.name());
                                fn.put("arguments", tc.arguments());
                                Map<String, Object> callMap = new HashMap<>();
                                callMap.put("id", tc.id());
                                callMap.put("function", fn);
                                return callMap;
                            })
                            .toList();
                    Map<String, Object> m = new HashMap<>();
                    m.put("role", "assistant");
                    m.put("content", "");
                    m.put("tool_calls", calls);
                    yield m;
                }
                yield Map.of("role", "assistant", "content", msg.content() != null ? msg.content() : "");
            }
            case TOOL -> {
                Map<String, Object> m = new HashMap<>();
                m.put("role", "tool");
                m.put("content", msg.toolResult().content());
                m.put("name", msg.toolResult().name());
                yield m;
            }
        };
    }

    private Map<String, Object> toOllamaTool(AiTool tool) {
        return Map.of(
                "type", "function",
                "function", Map.of(
                        "name", tool.name(),
                        "description", tool.description(),
                        "parameters", tool.parameters()
                )
        );
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<?, ?> body) {
        if (body == null) throw new RuntimeException("Empty Ollama response");
        Map<String, Object> message = (Map<String, Object>) body.get("message");
        if (message == null) throw new RuntimeException("No message in Ollama response");
        String content = (String) message.get("content");
        return content != null ? content : "";
    }
}
