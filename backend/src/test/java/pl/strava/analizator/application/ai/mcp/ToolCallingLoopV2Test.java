package pl.strava.analizator.application.ai.mcp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.ai.LlmProviderRegistry;
import pl.strava.analizator.application.ai.McpToolService;
import pl.strava.analizator.domain.ai.AiTool;
import pl.strava.analizator.domain.ai.LlmChatResponse;
import pl.strava.analizator.domain.ai.LlmPort;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.ToolCall;
import pl.strava.analizator.domain.ai.ToolResult;

@ExtendWith(MockitoExtension.class)
class ToolCallingLoopV2Test {

    @Mock private McpToolService toolService;
    @Mock private McpClientService mcpClientService;
    @Mock private LlmProviderRegistry providerRegistry;
    @Mock private LlmPort llmPort;

    private ToolCallingLoopV2 loop;

    @BeforeEach
    void setUp() {
        when(providerRegistry.getProvider("ollama-v2")).thenReturn(llmPort);
        when(toolService.getToolDefinitions()).thenReturn(List.of(
                AiTool.of("get_athlete_profile", "Returns profile", Map.of())
        ));
        loop = new ToolCallingLoopV2(toolService, mcpClientService, providerRegistry);
    }

    @Test
    void run_returnsTextImmediately_producesResult() {
        when(llmPort.chatWithTools(anyList(), anyList(), eq("qwen3.6:27b")))
                .thenReturn(new LlmChatResponse.Text("Analysis done"));

        ToolCallingLoopV2.ToolLoopResult result = loop.run(
                "sys prompt", "user prompt", null, "ollama-v2", "qwen3.6:27b",
                PredictionType.FTP_PREDICTION);

        assertThat(result.finalResponse()).isEqualTo("Analysis done");
        assertThat(result.toolLog()).isEmpty();
        assertThat(result.hasError()).isFalse();
    }

    @Test
    void run_withToolCalls_executesAndReturnsFinalText() {
        ToolCall tc = new ToolCall("id1", "get_athlete_profile", Map.of());
        when(llmPort.chatWithTools(anyList(), anyList(), eq("qwen3.6:27b")))
                .thenReturn(new LlmChatResponse.ToolCalls(List.of(tc)))
                .thenReturn(new LlmChatResponse.Text("Final result"));

        when(toolService.execute(any(ToolCall.class), eq(null)))
                .thenReturn(new ToolResult("id1", "get_athlete_profile", "FTP: 300W"));

        ToolCallingLoopV2.ToolLoopResult result = loop.run(
                "sys", "user", null, "ollama-v2", "qwen3.6:27b",
                PredictionType.FTP_PREDICTION);

        assertThat(result.finalResponse()).isEqualTo("Final result");
        assertThat(result.toolLog()).hasSize(1);
        assertThat(result.toolLog().get(0).toolName()).isEqualTo("get_athlete_profile");
    }

    @Test
    void run_toolError_fallsBackToChat() {
        ToolCall tc = new ToolCall("id1", "unknown_tool", Map.of());
        when(llmPort.chatWithTools(anyList(), anyList(), eq("qwen3.6:27b")))
                .thenReturn(new LlmChatResponse.ToolCalls(List.of(tc)));

        when(toolService.execute(any(ToolCall.class), eq(null)))
                .thenReturn(new ToolResult("id1", "unknown_tool", "Unknown tool: unknown_tool"));
        when(llmPort.chat(anyString(), anyString(), anyString()))
                .thenReturn("fallback response");

        ToolCallingLoopV2.ToolLoopResult result = loop.run(
                "sys", "user", null, "ollama-v2", "qwen3.6:27b",
                PredictionType.FTP_PREDICTION);

        assertThat(result.finalResponse()).contains("fallback");
        assertThat(result.toolLog()).isNotEmpty();
    }

    @Test
    void run_chatException_returnsErrorResponse() {
        when(llmPort.chatWithTools(anyList(), anyList(), eq("qwen3.6:27b")))
                .thenThrow(new RuntimeException("Model offline"));
        when(llmPort.chat(anyString(), anyString(), anyString()))
                .thenReturn("recovery response");

        ToolCallingLoopV2.ToolLoopResult result = loop.run(
                "sys", "user", null, "ollama-v2", "qwen3.6:27b",
                PredictionType.FTP_PREDICTION);

        assertThat(result.hasError()).isTrue();
        assertThat(result.finalResponse()).isEqualTo("recovery response");
    }

    @Test
    void run_includesMcpTools_whenMcpAvailable() {
        when(mcpClientService.isAvailable()).thenReturn(true);
        when(mcpClientService.getToolDefinitions()).thenReturn(List.of(
                AiTool.of("external_weather", "Weather data", Map.of("city", Map.of("type", "string")))
        ));

        when(llmPort.chatWithTools(anyList(), anyList(), eq("qwen3.6:27b")))
                .thenReturn(new LlmChatResponse.Text("done"));

        loop.run("sys", "user", null, "ollama-v2", "qwen3.6:27b",
                PredictionType.FTP_PREDICTION);

        verify(mcpClientService).getToolDefinitions();
    }
}
