package pl.strava.analizator.infrastructure.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.Stream;

import org.junit.jupiter.api.Named;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.web.client.RestTemplate;

class AiProviderConfigurationMatrixTest {

    @ParameterizedTest(name = "{0}")
    @MethodSource("providers")
    void providerRequiresBothTheMasterSwitchAndItsOwnSwitch(
            @SuppressWarnings("unused") String name,
            Class<?> adapterType,
            String providerProperty) {
        ApplicationContextRunner runner = new ApplicationContextRunner()
                .withBean(RestTemplate.class, RestTemplate::new)
                .withUserConfiguration(adapterType);

        runner.withPropertyValues("ai.enabled=false", providerProperty + "=true")
                .run(context -> assertThat(context.getBeanNamesForType(adapterType)).isEmpty());

        runner.withPropertyValues("ai.enabled=true", providerProperty + "=false")
                .run(context -> assertThat(context.getBeanNamesForType(adapterType)).isEmpty());

        runner.withPropertyValues("ai.enabled=true", providerProperty + "=true")
                .run(context -> assertThat(context.getBeanNamesForType(adapterType)).hasSize(1));
    }

    private static Stream<Arguments> providers() {
        return Stream.of(
                Arguments.of(Named.of("Ollama", "ollama"), OllamaAdapter.class, "ai.ollama.enabled"),
                Arguments.of(Named.of("OpenAI", "openai"), OpenAiAdapter.class, "ai.openai.enabled"),
                Arguments.of(Named.of("Anthropic", "anthropic"), AnthropicClaudeAdapter.class,
                        "ai.anthropic.enabled"),
                Arguments.of(Named.of("Gemini", "gemini"), GeminiAdapter.class, "ai.gemini.enabled"),
                Arguments.of(Named.of("Azure OpenAI", "azure-openai"), AzureOpenAiAdapter.class,
                        "ai.azure-openai.enabled"));
    }
}
