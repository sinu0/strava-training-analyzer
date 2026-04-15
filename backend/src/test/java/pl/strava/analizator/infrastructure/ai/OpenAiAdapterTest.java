package pl.strava.analizator.infrastructure.ai;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.matching;
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

class OpenAiAdapterTest {

    private WireMockServer wireMock;
    private OpenAiAdapter adapter;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
        com.github.tomakehurst.wiremock.client.WireMock.configureFor("localhost", wireMock.port());

        adapter = new OpenAiAdapter(
                "http://localhost:" + wireMock.port() + "/v1",
                "test-api-key",
                new RestTemplate());
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void chat_success_returnsContent() {
        stubFor(post(urlEqualTo("/v1/chat/completions"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "id": "chatcmpl-123",
                                  "choices": [{
                                    "index": 0,
                                    "message": {
                                      "role": "assistant",
                                      "content": "{\\"confidence\\": 0.90}"
                                    },
                                    "finish_reason": "stop"
                                  }]
                                }
                                """)));

        String result = adapter.chat("You are a coach", "Analyze data", "gpt-4o-mini");

        assertThat(result).contains("confidence");
        assertThat(result).contains("0.90");

        verify(postRequestedFor(urlEqualTo("/v1/chat/completions"))
                .withHeader("Authorization", equalTo("Bearer test-api-key")));
    }

    @Test
    void chat_emptyChoices_throwsException() {
        stubFor(post(urlEqualTo("/v1/chat/completions"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "id": "chatcmpl-123",
                                  "choices": []
                                }
                                """)));

        assertThatThrownBy(() -> adapter.chat("system", "user", "gpt-4o-mini"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unexpected OpenAI response");
    }

    @Test
    void chat_noChoicesField_throwsException() {
        stubFor(post(urlEqualTo("/v1/chat/completions"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"error\": {\"message\": \"rate limit\"}}")));

        assertThatThrownBy(() -> adapter.chat("system", "user", "gpt-4o-mini"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void isAvailable_modelPresent_returnsTrue() {
        stubFor(get(urlEqualTo("/v1/models"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "data": [
                                    {"id": "gpt-4o-mini", "object": "model"},
                                    {"id": "gpt-4o", "object": "model"}
                                  ]
                                }
                                """)));

        assertThat(adapter.isAvailable("gpt-4o-mini")).isTrue();
    }

    @Test
    void isAvailable_modelNotPresent_returnsFalse() {
        stubFor(get(urlEqualTo("/v1/models"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "data": [
                                    {"id": "gpt-4o", "object": "model"}
                                  ]
                                }
                                """)));

        assertThat(adapter.isAvailable("gpt-4o-mini")).isFalse();
    }

    @Test
    void isAvailable_serverDown_returnsFalse() {
        wireMock.stop();

        assertThat(adapter.isAvailable("gpt-4o-mini")).isFalse();
    }

    @Test
    void isAvailable_unauthorized_returnsFalse() {
        stubFor(get(urlEqualTo("/v1/models"))
                .willReturn(aResponse()
                        .withStatus(401)
                        .withBody("{\"error\": {\"message\": \"Invalid API key\"}}")));

        assertThat(adapter.isAvailable("gpt-4o-mini")).isFalse();
    }

    @Test
    void chat_withoutApiKey_noAuthHeader() {
        OpenAiAdapter noKeyAdapter = new OpenAiAdapter(
                "http://localhost:" + wireMock.port() + "/v1",
                "",
                new RestTemplate());

        stubFor(post(urlEqualTo("/v1/chat/completions"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "choices": [{
                                    "message": {
                                      "role": "assistant",
                                      "content": "response"
                                    }
                                  }]
                                }
                                """)));

        String result = noKeyAdapter.chat("system", "user", "local-model");
        assertThat(result).isEqualTo("response");
    }

    @Test
    void getProviderName_returnsOpenai() {
        assertThat(adapter.getProviderName()).isEqualTo("openai");
    }
}
