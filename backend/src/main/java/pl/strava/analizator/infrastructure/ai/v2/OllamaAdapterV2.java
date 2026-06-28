package pl.strava.analizator.infrastructure.ai.v2;

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

import pl.strava.analizator.application.ai.ModelCapabilityMatrix;
import pl.strava.analizator.domain.ai.AiTool;
import pl.strava.analizator.domain.ai.LlmChatResponse;
import pl.strava.analizator.domain.ai.LlmMessage;
import pl.strava.analizator.domain.ai.LlmPort;
import pl.strava.analizator.domain.ai.ModelCapability;
import pl.strava.analizator.domain.ai.ModelTier;
import pl.strava.analizator.domain.ai.ToolCall;

@Component("ollamaAdapterV2")
@ConditionalOnProperty(name = "ai.ollama.enabled", havingValue = "true", matchIfMissing = false)
public class OllamaAdapterV2 implements LlmPort {

    private static final Logger log = LoggerFactory.getLogger(OllamaAdapterV2.class);

    private final String baseUrl;
    private final String configuredModel;
    private final RestTemplate restTemplate;
    private final ModelCapabilityMatrix capabilityMatrix;

    private volatile String resolvedModel;

    public OllamaAdapterV2(
            @Value("${ai.ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ai.model:qwen3.6:27b}") String configuredModel,
            RestTemplate restTemplate,
            ModelCapabilityMatrix capabilityMatrix) {
        this.baseUrl = baseUrl;
        this.configuredModel = configuredModel;
        this.restTemplate = createLongTimeoutRestTemplate();
        this.capabilityMatrix = capabilityMatrix;
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
        if (resolvedModel != null) return;
        if (!configuredModel.isBlank()) {
            resolvedModel = configuredModel;
            ModelCapability cap = capabilityMatrix.resolve(configuredModel).orElse(null);
            log.info("AI V2 model: using configured model '{}' (tier={}, tools={}, thinking={})",
                    resolvedModel,
                    cap != null ? cap.tier() : "unknown",
                    cap != null ? cap.supportsToolCalling() : false,
                    cap != null ? cap.supportsThinking() : false);
            return;
        }
        try {
            List<String> available = fetchAvailableModels();
            ModelCapability best = capabilityMatrix.findBestAvailable(available).orElse(null);
            if (best != null) {
                resolvedModel = best.modelName();
                log.info("AI V2 model: auto-selected '{}' (tier={}) from available: {}",
                        resolvedModel, best.tier(), available);
            } else {
                resolvedModel = available.isEmpty() ? "qwen3.6:27b" : available.get(0);
                log.info("AI V2 model: no preferred model found, using '{}' from available: {}",
                        resolvedModel, available);
            }
        } catch (Exception e) {
            resolvedModel = "qwen3.6:27b";
            log.warn("AI V2 model: Ollama not reachable, defaulting to '{}': {}", resolvedModel, e.getMessage());
        }
    }

    @Override
    public String chat(String systemPrompt, String userPrompt, String modelId) {
        String model = effectiveModel(modelId);
        ModelCapability cap = capabilityMatrix.resolve(model).orElse(null);

        Map<String, Object> options = new HashMap<>();
        options.put("temperature", 0.2);
        options.put("num_predict", 4096);
        options.put("num_ctx", cap != null ? Math.min(cap.contextWindow(), 32768) : 32768);
        options.put("repeat_penalty", 1.05);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
        ));
        body.put("stream", false);
        body.put("options", options);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                baseUrl + "/api/chat", new HttpEntity<>(body, headers), Map.class);
        return extractContent(response.getBody());
    }

    @Override
    @SuppressWarnings("unchecked")
    public LlmChatResponse chatWithTools(List<LlmMessage> messages, List<AiTool> tools, String modelId) {
        String model = effectiveModel(modelId);
        ModelCapability cap = capabilityMatrix.resolve(model).orElse(null);
        String url = baseUrl + "/api/chat";

        List<Map<String, Object>> ollamaMessages = messages.stream()
                .map(this::toLlamaMessage)
                .toList();

        Map<String, Object> options = new HashMap<>();
        options.put("temperature", 0.2);
        options.put("num_predict", 4096);
        options.put("num_ctx", cap != null ? Math.min(cap.contextWindow(), 32768) : 32768);
        options.put("repeat_penalty", 1.05);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", ollamaMessages);
        body.put("stream", false);
        body.put("options", options);
        if (!tools.isEmpty()) {
            body.put("tools", tools.stream().map(this::toOllamaTool).toList());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
        if (response.getBody() == null) throw new RuntimeException("Empty Ollama response");

        Map<String, Object> message = (Map<String, Object>) response.getBody().get("message");
        if (message == null) throw new RuntimeException("No message in Ollama response");

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
        return capabilityMatrix.supportsToolCalling(effectiveModel(null));
    }

    @Override
    public boolean isAvailable(String modelId) {
        try {
            String target = effectiveModel(modelId);
            return fetchAvailableModels().stream()
                    .anyMatch(m -> m.equals(target) || m.startsWith(target.split(":")[0] + ":"));
        } catch (Exception e) {
            log.warn("Ollama V2 not reachable: {}", e.getMessage());
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
        return "ollama-v2";
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<?, ?> body) {
        if (body == null) throw new RuntimeException("Empty Ollama response");
        Map<String, Object> message = (Map<String, Object>) body.get("message");
        if (message == null) throw new RuntimeException("No message in Ollama response");
        String content = (String) message.get("content");
        return content != null ? content : "";
    }

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
}
