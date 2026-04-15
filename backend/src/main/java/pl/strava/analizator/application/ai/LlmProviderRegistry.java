package pl.strava.analizator.application.ai;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.LlmPort;

/**
 * Registry that manages multiple LLM providers (Ollama, OpenAI, etc.)
 * and allows switching between them at runtime.
 */
@Component
public class LlmProviderRegistry {

    private final Map<String, LlmPort> providers = new ConcurrentHashMap<>();

    public LlmProviderRegistry(List<LlmPort> llmPorts) {
        for (LlmPort port : llmPorts) {
            providers.put(port.getProviderName(), port);
        }
    }

    public LlmPort getProvider(String providerName) {
        LlmPort provider = providers.get(providerName);
        if (provider == null) {
            throw new IllegalArgumentException(
                "LLM provider not found: " + providerName + ". Available: " + providers.keySet());
        }
        return provider;
    }

    public List<String> getAvailableProviders() {
        return List.copyOf(providers.keySet());
    }

    public boolean hasProvider(String providerName) {
        return providers.containsKey(providerName);
    }
}
