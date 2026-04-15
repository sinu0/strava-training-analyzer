package pl.strava.analizator.infrastructure.ai;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.verify;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

class OllamaAdapterTest {

    private WireMockServer wireMock;
    private OllamaAdapter adapter;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
        com.github.tomakehurst.wiremock.client.WireMock.configureFor("localhost", wireMock.port());

        adapter = new OllamaAdapter(
                "http://localhost:" + wireMock.port(),
                "",
                new RestTemplate());
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void chat_success_returnsContent() {
        stubFor(post(urlEqualTo("/api/chat"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "message": {
                                    "role": "assistant",
                                    "content": "{\\"confidence\\": 0.85, \\"reasoning\\": \\"test\\"}"
                                  },
                                  "done": true
                                }
                                """)));

        String result = adapter.chat("You are a coach", "Analyze my data", "llama3");

        assertThat(result).contains("confidence");
        assertThat(result).contains("0.85");

        verify(postRequestedFor(urlEqualTo("/api/chat")));
    }

    @Test
    void chat_unexpectedFormat_throwsException() {
        stubFor(post(urlEqualTo("/api/chat"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"error\": \"model not found\"}")));

        assertThatThrownBy(() -> adapter.chat("system", "user", "unknown-model"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("message");
    }

    @Test
    void isAvailable_modelPresent_returnsTrue() {
        stubFor(get(urlEqualTo("/api/tags"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "models": [
                                    {"name": "llama3:latest", "size": 4000000000},
                                    {"name": "mistral:latest", "size": 3500000000}
                                  ]
                                }
                                """)));

        assertThat(adapter.isAvailable("llama3")).isTrue();
    }

    @Test
    void isAvailable_modelNotPresent_returnsFalse() {
        stubFor(get(urlEqualTo("/api/tags"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "models": [
                                    {"name": "mistral:latest", "size": 3500000000}
                                  ]
                                }
                                """)));

        assertThat(adapter.isAvailable("llama3")).isFalse();
    }

    @Test
    void isAvailable_serverDown_returnsFalse() {
        wireMock.stop();

        assertThat(adapter.isAvailable("llama3")).isFalse();
    }

    @Test
    void isAvailable_exactModelName_matchesExactly() {
        stubFor(get(urlEqualTo("/api/tags"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "models": [
                                    {"name": "llama3", "size": 4000000000}
                                  ]
                                }
                                """)));

        assertThat(adapter.isAvailable("llama3")).isTrue();
    }

    @Test
    void getProviderName_returnsOllama() {
        assertThat(adapter.getProviderName()).isEqualTo("ollama");
    }
}
