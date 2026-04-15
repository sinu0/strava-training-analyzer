package pl.strava.analizator.infrastructure.ai;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
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

class AnthropicClaudeAdapterTest {

    private WireMockServer wireMock;
    private AnthropicClaudeAdapter adapter;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
        com.github.tomakehurst.wiremock.client.WireMock.configureFor("localhost", wireMock.port());

        adapter = new AnthropicClaudeAdapter(
                "http://localhost:" + wireMock.port(),
                "test-anthropic-key",
                new RestTemplate());
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void chat_success_returnsContent() {
        stubFor(post(urlEqualTo("/v1/messages"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "id": "msg_01",
                                  "type": "message",
                                  "role": "assistant",
                                  "content": [
                                    {
                                      "type": "text",
                                      "text": "{\\"confidence\\": 0.92, \\"ftp\\": 275}"
                                    }
                                  ],
                                  "stop_reason": "end_turn"
                                }
                                """)));

        String result = adapter.chat("You are a coach", "Analyze data", "claude-sonnet-4-20250514");

        assertThat(result).contains("confidence");
        assertThat(result).contains("0.92");

        verify(postRequestedFor(urlEqualTo("/v1/messages"))
                .withHeader("x-api-key", equalTo("test-anthropic-key"))
                .withHeader("anthropic-version", equalTo("2023-06-01")));
    }

    @Test
    void chat_emptyContent_throwsException() {
        stubFor(post(urlEqualTo("/v1/messages"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "id": "msg_02",
                                  "type": "message",
                                  "content": []
                                }
                                """)));

        assertThatThrownBy(() -> adapter.chat("system", "user", "claude-sonnet-4-20250514"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unexpected Anthropic response");
    }

    @Test
    void chat_noContentKey_throwsException() {
        stubFor(post(urlEqualTo("/v1/messages"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "error": {"type": "invalid_request_error", "message": "bad model"}
                                }
                                """)));

        assertThatThrownBy(() -> adapter.chat("system", "user", "bad-model"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void isAvailable_success_returnsTrue() {
        stubFor(post(urlEqualTo("/v1/messages"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "id": "msg_03",
                                  "content": [{"type": "text", "text": "p"}],
                                  "stop_reason": "max_tokens"
                                }
                                """)));

        assertThat(adapter.isAvailable("claude-sonnet-4-20250514")).isTrue();
    }

    @Test
    void isAvailable_serverDown_returnsFalse() {
        wireMock.stop();

        assertThat(adapter.isAvailable("claude-sonnet-4-20250514")).isFalse();
    }

    @Test
    void getProviderName_returnsAnthropic() {
        assertThat(adapter.getProviderName()).isEqualTo("anthropic");
    }
}
