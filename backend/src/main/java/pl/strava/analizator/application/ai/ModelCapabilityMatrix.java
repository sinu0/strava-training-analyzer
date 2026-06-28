package pl.strava.analizator.application.ai;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.ModelCapability;
import pl.strava.analizator.domain.ai.ModelTier;

@Component
public class ModelCapabilityMatrix {

    private static final Map<String, ModelCapability> MATRIX = Map.ofEntries(
            Map.entry("qwen3.6:27b", new ModelCapability("qwen3.6:27b", ModelTier.PRIMARY,
                    true, true, true, 262144, 1)),
            Map.entry("qwen3.6:35b", new ModelCapability("qwen3.6:35b", ModelTier.PRIMARY,
                    true, true, true, 262144, 2)),
            Map.entry("qwen3.5:27b", new ModelCapability("qwen3.5:27b", ModelTier.PRIMARY,
                    true, true, true, 32768, 3)),
            Map.entry("qwen3.5:35b", new ModelCapability("qwen3.5:35b", ModelTier.PRIMARY,
                    true, true, true, 32768, 4)),
            Map.entry("deepseek-r1:32b", new ModelCapability("deepseek-r1:32b", ModelTier.FALLBACK,
                    false, true, false, 131072, 10)),
            Map.entry("deepseek-r1:14b", new ModelCapability("deepseek-r1:14b", ModelTier.FALLBACK,
                    false, true, false, 131072, 11)),
            Map.entry("deepseek-r1:8b", new ModelCapability("deepseek-r1:8b", ModelTier.FALLBACK,
                    false, true, false, 131072, 12)),
            Map.entry("qwen2.5:72b", new ModelCapability("qwen2.5:72b", ModelTier.FALLBACK,
                    true, false, false, 32768, 15)),
            Map.entry("qwen2.5:32b", new ModelCapability("qwen2.5:32b", ModelTier.FALLBACK,
                    true, false, false, 32768, 16)),
            Map.entry("qwen3.5:14b", new ModelCapability("qwen3.5:14b", ModelTier.LIGHTWEIGHT,
                    true, true, false, 32768, 20)),
            Map.entry("qwen3.5:9b", new ModelCapability("qwen3.5:9b", ModelTier.LIGHTWEIGHT,
                    true, true, false, 32768, 21)),
            Map.entry("qwen2.5:14b", new ModelCapability("qwen2.5:14b", ModelTier.LIGHTWEIGHT,
                    true, false, false, 32768, 25)),
            Map.entry("qwen2.5:7b", new ModelCapability("qwen2.5:7b", ModelTier.LIGHTWEIGHT,
                    true, false, false, 32768, 26)),
            Map.entry("llama3.3:70b", new ModelCapability("llama3.3:70b", ModelTier.LIGHTWEIGHT,
                    true, false, false, 131072, 30)),
            Map.entry("mistral:7b", new ModelCapability("mistral:7b", ModelTier.LEGACY,
                    false, false, false, 32768, 40)),
            Map.entry("gemma2:9b", new ModelCapability("gemma2:9b", ModelTier.LEGACY,
                    false, false, false, 8192, 41))
    );

    public Optional<ModelCapability> resolve(String modelName) {
        if (modelName == null || modelName.isBlank()) return Optional.empty();
        return Optional.ofNullable(MATRIX.get(modelName));
    }

    public Optional<ModelCapability> findBestAvailable(List<String> availableModels) {
        return availableModels.stream()
                .map(this::resolve)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .min(Comparator.comparingInt(ModelCapability::priority));
    }

    public ModelTier tierFor(String modelName) {
        return resolve(modelName).map(ModelCapability::tier).orElse(ModelTier.LEGACY);
    }

    public boolean supportsToolCalling(String modelName) {
        return resolve(modelName).map(ModelCapability::supportsToolCalling).orElse(false);
    }

    public boolean supportsThinking(String modelName) {
        return resolve(modelName).map(ModelCapability::supportsThinking).orElse(false);
    }

    public int contextWindow(String modelName) {
        return resolve(modelName).map(ModelCapability::contextWindow).orElse(4096);
    }

    public List<String> getPreferredModels() {
        return MATRIX.values().stream()
                .sorted(Comparator.comparingInt(ModelCapability::priority))
                .map(ModelCapability::modelName)
                .toList();
    }
}
