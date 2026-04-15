package pl.strava.analizator.infrastructure.ai;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.stubFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.client.WireMock.verify;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

class AzureOpenAiAdapterTest {

    private WireMockServer wireMock;
    private AzureOpenAiAdapter adapter;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
        com.github.tomakehurst.wiremock.client.WireMock.configureFor("localhost", wireMock.port());

        adapter = new AzureOpenAiAdapter(
                "http://localhost:" + wireMock.port(),
                "test-azure-key",
                "gpt-4o-deployment",
                "2024-02-01",
                new RestTemplate());
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void chat_success_returnsContent() {
        stubFor(post(urlPathEqualTo("/openai/deployments/gpt-4o-deployment/chat/completions"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "choices": [
                                    {
                                      "index": 0,
                                      "message": {
                                        "role": "assistant",
                                        "content": "{\\"confidence\\": 0.85, \\"ftp\\": 290}"
                                      }
                                    }
                                  ]
                                }
                                """)));

        String result = adapter.chat("You are a coach", "Analyze data", "gpt-4o");

        assertThat(result).contains("confidence");
        assertThat(result).contains("0.85");

        verify(postRequestedFor(urlPathEqualTo("/openai/deployments/gpt-4o-deployment/chat/completions"))
                .withHeader("api-key", equalTo("test-azure-key")));
    }

    @Test
    void chat_emptyChoices_throwsException() {
        stubFor(post(urlPathEqualTo("/openai/deployments/gpt-4o-deployment/chat/completions"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                { "choices": [] }
                                """)));

        assertThatThrownBy(() -> adapter.chat("system", "user", "gpt-4o"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unexpected Azure OpenAI response");
    }

    @Test
    void isAvailable_success_returnsTrue() {
        stubFor(get(urlPathEqualTo("/openai/deployments/gpt-4o-deployment"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                { "id": "gpt-4o-deployment", "status": "succeeded" }
                                """)));

        assertThat(adapter.isAvailable("gpt-4o")).isTrue();
    }

    @Test
    void isAvailable_serverDown_returnsFalse() {
        wireMock.stop();

        assertThat(adapter.isAvailable("gpt-4o")).isFalse();
    }

    @Test
    void getProviderName_returnsAzureOpenai() {
        assertThat(adapter.getProviderName()).isEqualTo("azure-openai");
    }
}
