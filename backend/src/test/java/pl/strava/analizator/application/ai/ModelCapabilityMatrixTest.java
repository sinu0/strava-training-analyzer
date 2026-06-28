package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.ai.ModelCapability;
import pl.strava.analizator.domain.ai.ModelTier;

class ModelCapabilityMatrixTest {

    private final ModelCapabilityMatrix matrix = new ModelCapabilityMatrix();

    @Test
    void resolve_knownModel_returnsCapability() {
        Optional<ModelCapability> result = matrix.resolve("qwen3.6:27b");

        assertThat(result).isPresent();
        assertThat(result.get().tier()).isEqualTo(ModelTier.PRIMARY);
        assertThat(result.get().supportsToolCalling()).isTrue();
        assertThat(result.get().supportsThinking()).isTrue();
        assertThat(result.get().contextWindow()).isEqualTo(262144);
    }

    @Test
    void resolve_unknownModel_returnsEmpty() {
        Optional<ModelCapability> result = matrix.resolve("unknown:model");

        assertThat(result).isEmpty();
    }

    @Test
    void resolve_nullOrBlank_returnsEmpty() {
        assertThat(matrix.resolve(null)).isEmpty();
        assertThat(matrix.resolve("")).isEmpty();
    }

    @Test
    void findBestAvailable_hasPreferredModels_returnsHighestPriority() {
        List<String> available = List.of("qwen2.5:7b", "qwen3.6:27b", "deepseek-r1:8b");

        Optional<ModelCapability> result = matrix.findBestAvailable(available);

        assertThat(result).isPresent();
        assertThat(result.get().modelName()).isEqualTo("qwen3.6:27b");
    }

    @Test
    void findBestAvailable_noMatches_returnsEmpty() {
        List<String> available = List.of("unknown:1", "unknown:2");

        Optional<ModelCapability> result = matrix.findBestAvailable(available);

        assertThat(result).isEmpty();
    }

    @Test
    void findBestAvailable_emptyList_returnsEmpty() {
        Optional<ModelCapability> result = matrix.findBestAvailable(List.of());

        assertThat(result).isEmpty();
    }

    @Test
    void tierFor_knownModel_returnsCorrectTier() {
        assertThat(matrix.tierFor("qwen3.6:27b")).isEqualTo(ModelTier.PRIMARY);
        assertThat(matrix.tierFor("qwen2.5:7b")).isEqualTo(ModelTier.LIGHTWEIGHT);
        assertThat(matrix.tierFor("mistral:7b")).isEqualTo(ModelTier.LEGACY);
    }

    @Test
    void supportsToolCalling_variousModels() {
        assertThat(matrix.supportsToolCalling("qwen3.6:27b")).isTrue();
        assertThat(matrix.supportsToolCalling("deepseek-r1:14b")).isFalse();
    }

    @Test
    void supportsThinking_variousModels() {
        assertThat(matrix.supportsThinking("qwen3.6:27b")).isTrue();
        assertThat(matrix.supportsThinking("qwen2.5:14b")).isFalse();
    }

    @Test
    void contextWindow_knownModel_returnsValue() {
        assertThat(matrix.contextWindow("qwen3.6:27b")).isEqualTo(262144);
    }

    @Test
    void contextWindow_unknownModel_returnsDefault4096() {
        assertThat(matrix.contextWindow("unknown:model")).isEqualTo(4096);
    }

    @Test
    void getPreferredModels_returnsOrderedByPriority() {
        List<String> models = matrix.getPreferredModels();

        assertThat(models).isNotEmpty();
        assertThat(models.get(0)).isEqualTo("qwen3.6:27b");
    }
}
