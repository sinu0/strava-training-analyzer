package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.ai.LlmPort;

class LlmProviderRegistryTest {

    @Test
    void getProvider_returnsRegisteredProvider() {
        LlmPort ollamaPort = stubPort("ollama");
        LlmProviderRegistry registry = new LlmProviderRegistry(List.of(ollamaPort));

        assertThat(registry.getProvider("ollama")).isSameAs(ollamaPort);
    }

    @Test
    void getProvider_unknownProvider_throwsWithAvailableList() {
        LlmPort ollamaPort = stubPort("ollama");
        LlmProviderRegistry registry = new LlmProviderRegistry(List.of(ollamaPort));

        assertThatThrownBy(() -> registry.getProvider("openai"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("openai")
                .hasMessageContaining("ollama");
    }

    @Test
    void getAvailableProviders_returnsAllRegistered() {
        LlmProviderRegistry registry = new LlmProviderRegistry(
                List.of(stubPort("ollama"), stubPort("openai"))
        );

        assertThat(registry.getAvailableProviders())
                .containsExactlyInAnyOrder("ollama", "openai");
    }

    @Test
    void hasProvider_trueForRegistered() {
        LlmProviderRegistry registry = new LlmProviderRegistry(List.of(stubPort("ollama")));

        assertThat(registry.hasProvider("ollama")).isTrue();
        assertThat(registry.hasProvider("openai")).isFalse();
    }

    @Test
    void emptyRegistry_noProviders() {
        LlmProviderRegistry registry = new LlmProviderRegistry(List.of());

        assertThat(registry.getAvailableProviders()).isEmpty();
    }

    private LlmPort stubPort(String name) {
        return new LlmPort() {
            @Override
            public String chat(String systemPrompt, String userPrompt, String modelId) {
                return "response";
            }

            @Override
            public boolean isAvailable(String modelId) {
                return true;
            }

            @Override
            public String getProviderName() {
                return name;
            }
        };
    }
}
