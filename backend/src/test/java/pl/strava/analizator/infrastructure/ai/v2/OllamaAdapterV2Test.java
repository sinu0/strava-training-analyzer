package pl.strava.analizator.infrastructure.ai.v2;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.equalToJson;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.verify;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

import pl.strava.analizator.application.ai.ModelCapabilityMatrix;
import pl.strava.analizator.domain.ai.LlmChatResponse;
import pl.strava.analizator.domain.ai.LlmMessage;
import pl.strava.analizator.domain.ai.ModelCapability;
import pl.strava.analizator.domain.ai.ModelTier;

@ExtendWith(MockitoExtension.class)
class OllamaAdapterV2Test {

    private WireMockServer wireMock;
    private RestTemplate restTemplate;

    @Mock
    private ModelCapabilityMatrix capabilityMatrix;

    private OllamaAdapterV2 adapter;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
        com.github.tomakehurst.wiremock.client.WireMock.configureFor("localhost", wireMock.port());

        restTemplate = new RestTemplate();
        adapter = new OllamaAdapterV2(
                "http://localhost:" + wireMock.port(),
                "qwen3.6:27b",
                restTemplate,
                capabilityMatrix);

        var cap = new ModelCapability("qwen3.6:27b", ModelTier.PRIMARY,
                true, true, true, 262144, 1);
        lenient().when(capabilityMatrix.resolve("qwen3.6:27b")).thenReturn(Optional.of(cap));
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void chat_basicRequest_returnsContent() {
        stubFor(post(urlEqualTo("/api/chat"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "message": {
                                    "role": "assistant",
                                    "content": "Hello"
                                  }
                                }
                                """)));

        String result = adapter.chat("sys", "user", null);

        assertThat(result).isEqualTo("Hello");
    }

    @Test
    void chat_usesConfiguredModel() {
        stubFor(post(urlEqualTo("/api/chat"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "message": {
                                    "role": "assistant",
                                    "content": "ok"
                                  }
                                }
                                """)));

        adapter.chat("sys", "user", null);

        verify(postRequestedFor(urlEqualTo("/api/chat"))
                .withRequestBody(equalToJson("""
                        {
                          "model": "qwen3.6:27b"
                        }
                        """, true, true)));
    }

    @Test
    void chat_passesCorrectOptions() {
        stubFor(post(urlEqualTo("/api/chat"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "message": {
                                    "role": "assistant",
                                    "content": "ok"
                                  }
                                }
                                """)));

        adapter.chat("sys", "user", null);

        verify(postRequestedFor(urlEqualTo("/api/chat"))
                .withRequestBody(equalToJson("""
                        {
                          "options": {
                            "temperature": 0.2,
                            "num_predict": 4096,
                            "repeat_penalty": 1.05
                          }
                        }
                        """, true, true)));
    }

    @Test
    void chatWithTools_returnsToolCalls() {
        stubFor(post(urlEqualTo("/api/chat"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "message": {
                                    "role": "assistant",
                                    "content": "",
                                    "tool_calls": [
                                      {
                                        "id": "call_1",
                                        "function": {
                                          "name": "get_weather",
                                          "arguments": {"location": "Warsaw"}
                                        }
                                      }
                                    ]
                                  }
                                }
                                """)));

        LlmChatResponse response = adapter.chatWithTools(
                List.of(LlmMessage.user("What's the weather?")),
                List.of(),
                null);

        assertThat(response).isInstanceOf(LlmChatResponse.ToolCalls.class);
    }

    @Test
    void chatWithTools_returnsText() {
        stubFor(post(urlEqualTo("/api/chat"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "message": {
                                    "role": "assistant",
                                    "content": "Here is my analysis"
                                  }
                                }
                                """)));

        LlmChatResponse response = adapter.chatWithTools(
                List.of(LlmMessage.user("Analyze this")),
                List.of(),
                null);

        assertThat(response).isInstanceOf(LlmChatResponse.Text.class);
        assertThat(((LlmChatResponse.Text) response).content()).isEqualTo("Here is my analysis");
    }

    @Test
    void isAvailable_returnsTrue_whenModelExists() {
        stubFor(get(urlEqualTo("/api/tags"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "models": [
                                    {"name": "qwen3.6:27b", "size": 4000000000}
                                  ]
                                }
                                """)));

        assertThat(adapter.isAvailable(null)).isTrue();
    }

    @Test
    void isAvailable_returnsFalse_whenNotReachable() {
        wireMock.stop();

        assertThat(adapter.isAvailable(null)).isFalse();
    }

    @Test
    void getProviderName_returnsOllamaV2() {
        assertThat(adapter.getProviderName()).isEqualTo("ollama-v2");
    }

    @Test
    void supportsToolCalling_delegatesToCapabilityMatrix() {
        when(capabilityMatrix.supportsToolCalling("qwen3.6:27b")).thenReturn(false);

        assertThat(adapter.supportsToolCalling()).isFalse();
    }

    @Test
    void effectiveModel_usesFallbackWhenPrimaryMissing() {
        var fallbackAdapter = new OllamaAdapterV2(
                "http://localhost:" + wireMock.port(),
                "",
                restTemplate,
                capabilityMatrix);

        stubFor(get(urlEqualTo("/api/tags"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "models": [
                                    {"name": "deepseek-r1:14b", "size": 4000000000}
                                  ]
                                }
                                """)));

        var dsCap = new ModelCapability("deepseek-r1:14b", ModelTier.FALLBACK,
                false, true, false, 131072, 11);
        when(capabilityMatrix.findBestAvailable(List.of("deepseek-r1:14b")))
                .thenReturn(Optional.of(dsCap));
        when(capabilityMatrix.supportsToolCalling("deepseek-r1:14b")).thenReturn(false);

        assertThat(fallbackAdapter.supportsToolCalling()).isFalse();
        verify(capabilityMatrix).findBestAvailable(List.of("deepseek-r1:14b"));
    }
}
