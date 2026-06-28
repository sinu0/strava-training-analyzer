package pl.strava.analizator.application.ai.mcp;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

import pl.strava.analizator.domain.ai.AiTool;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

class McpClientServiceTest {

    private WireMockServer wireMock;
    private McpClientService service;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
        configureFor("localhost", wireMock.port());

        service = new McpClientService();
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void getToolDefinitions_noConnections_returnsEmpty() {
        assertThat(service.getToolDefinitions()).isEmpty();
    }

    @Test
    void discoverAndConnect_noConfig_doesNothing() {
        service.discoverAndConnect();
        assertThat(service.getToolDefinitions()).isEmpty();
    }

    @Test
    void discoverAndConnect_withValidServer_addsTools() {
        stubFor(post(urlPathEqualTo("/message"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "jsonrpc": "2.0",
                                  "result": {
                                    "tools": [
                                      {
                                        "name": "get_weather",
                                        "description": "Get weather data",
                                        "inputSchema": {"type": "object"}
                                      }
                                    ],
                                    "sessionId": "s1"
                                  },
                                  "id": 1
                                }
                                """)));

        service = new McpClientService();
        setField(service, "externalServersConfig", "weather@http://localhost:" + wireMock.port());
        service.discoverAndConnect();

        List<AiTool> tools = service.getToolDefinitions();
        assertThat(tools).hasSize(1);
        assertThat(tools.get(0).name()).isEqualTo("get_weather");
        assertThat(service.hasTool("get_weather")).isTrue();
    }

    @Test
    void hasTool_unknownTool_returnsFalse() {
        assertThat(service.hasTool("nonexistent")).isFalse();
    }

    @Test
    void executeTool_notConnected_returnsError() {
        String result = service.executeTool("get_weather", Map.of(), null);
        assertThat(result).isEqualTo("Tool not found: get_weather");
    }

    @Test
    void isAvailable_noConnections_returnsFalse() {
        assertThat(service.isAvailable()).isFalse();
    }

    // Helper for injecting private field
    private void setField(Object target, String fieldName, String value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
