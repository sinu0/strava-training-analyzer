package pl.strava.analizator.application.ai.mcp;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import pl.strava.analizator.application.ai.LlmProviderRegistry;
import pl.strava.analizator.application.ai.McpToolService;
import pl.strava.analizator.domain.ai.AiTool;
import pl.strava.analizator.domain.ai.LlmChatResponse;
import pl.strava.analizator.domain.ai.LlmMessage;
import pl.strava.analizator.domain.ai.LlmPort;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.ToolCall;
import pl.strava.analizator.domain.ai.ToolResult;

@Service
public class ToolCallingLoopV2 {

    private static final Logger log = LoggerFactory.getLogger(ToolCallingLoopV2.class);
    private static final int MAX_ITERATIONS = 10;
    private static final int MAX_CONSECUTIVE_ERRORS = 3;

    private final McpToolService toolService;
    private final McpClientService mcpClientService;
    private final LlmProviderRegistry providerRegistry;
    private final Map<PredictionType, List<AiTool>> perTypeTools = new EnumMap<>(PredictionType.class);

    public ToolCallingLoopV2(McpToolService toolService,
                              McpClientService mcpClientService,
                              LlmProviderRegistry providerRegistry) {
        this.toolService = toolService;
        this.mcpClientService = mcpClientService;
        this.providerRegistry = providerRegistry;
    }

    public ToolLoopResult run(String systemPrompt, String userPrompt,
                               UUID contextActivityId, String providerName,
                               String modelId, PredictionType type) {
        LlmPort provider = providerRegistry.getProvider(providerName);
        List<AiTool> tools = buildToolList(type);

        List<LlmMessage> messages = new ArrayList<>();
        messages.add(LlmMessage.system(systemPrompt));
        messages.add(LlmMessage.user(userPrompt));

        List<ToolCallLogEntry> toolLog = new ArrayList<>();
        int consecutiveErrors = 0;

        for (int iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            LlmChatResponse response;
            try {
                response = provider.chatWithTools(messages, tools, modelId);
            } catch (Exception e) {
                log.error("Chat failed at iteration {}: {}", iteration + 1, e.getMessage());
                String enrichedPrompt = buildEnrichedFallbackPrompt(systemPrompt, messages, toolLog);
                return new ToolLoopResult("Error: " + e.getMessage(), toolLog,
                        provider.chat(systemPrompt, enrichedPrompt, modelId));
            }

            if (response instanceof LlmChatResponse.Text text) {
                log.debug("Tool loop finished after {} iteration(s)", iteration + 1);
                return new ToolLoopResult(null, toolLog, text.content());
            }

            if (response instanceof LlmChatResponse.ToolCalls tc) {
                log.debug("Iteration {}: model requested {} tool call(s): {}",
                        iteration + 1, tc.calls().size(),
                        tc.calls().stream().map(ToolCall::name).toList());

                messages.add(LlmMessage.assistantWithToolCalls(tc.calls()));

                for (ToolCall call : tc.calls()) {
                    long startMs = System.currentTimeMillis();
                    ToolResult result = executeTool(call, contextActivityId);
                    long durationMs = System.currentTimeMillis() - startMs;

                    if (result.content().startsWith("Error") || result.content().startsWith("Tool not found")) {
                        consecutiveErrors++;
                    } else {
                        consecutiveErrors = 0;
                    }

                    log.debug("Tool [{}] returned {} chars in {}ms", call.name(), result.content().length(), durationMs);
                    messages.add(LlmMessage.toolResult(result));

                    toolLog.add(new ToolCallLogEntry(call.name(), call.arguments(),
                            result.content().length() > 200 ? result.content().substring(0, 200) + "..." : result.content(),
                            durationMs, result.content().startsWith("Error")));
                }

                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    log.warn("{} consecutive tool errors, returning partial result", consecutiveErrors);
                    String enrichedPrompt = buildEnrichedFallbackPrompt(systemPrompt, messages, toolLog);
                    return new ToolLoopResult("Tool execution repeatedly failed after " + consecutiveErrors + " errors",
                            toolLog, provider.chat(systemPrompt, enrichedPrompt, modelId));
                }
            }
        }

        log.warn("Tool calling loop hit max iterations ({}), falling back to plain chat", MAX_ITERATIONS);
        String enrichedPrompt = buildEnrichedFallbackPrompt(systemPrompt, messages, toolLog);
        return new ToolLoopResult("Hit max iterations", toolLog,
                provider.chat(systemPrompt, enrichedPrompt, modelId));
    }

    private String buildEnrichedFallbackPrompt(String systemPrompt, List<LlmMessage> messages,
                                                List<ToolCallLogEntry> toolLog) {
        StringBuilder sb = new StringBuilder();
        sb.append("INSTRUCTIONS: You were previously given the system prompt and tools. ");
        sb.append("The following tool calls were executed before a fallback was necessary. ");
        sb.append("Use these results to produce your analysis.\n\n");
        sb.append("TOOL RESULTS (already retrieved):\n");

        for (ToolCallLogEntry entry : toolLog) {
            sb.append("- ").append(entry.toolName()).append(": ");
            sb.append(entry.resultSummary()).append("\n");
        }

        sb.append("\nEND OF TOOL RESULTS\n");
        sb.append("Produce the final JSON analysis using the data above and the original system prompt.");
        return sb.toString();
    }

    private List<AiTool> buildToolList(PredictionType type) {
        List<AiTool> all = new ArrayList<>(toolService.getToolDefinitions());

        if (mcpClientService.isAvailable()) {
            all.addAll(mcpClientService.getToolDefinitions());
        }

        return all;
    }

    private ToolResult executeTool(ToolCall call, UUID contextActivityId) {
        try {
            // Try internal tool service first
            String content;
            try {
                content = toolService.execute(call, contextActivityId).content();
                if (content != null && !content.startsWith("Unknown tool:")) {
                    return new ToolResult(call.id(), call.name(), content);
                }
            } catch (Exception ignored) {
            }

            // Try external MCP client
            if (mcpClientService.hasTool(call.name())) {
                content = mcpClientService.executeTool(call.name(), call.arguments(), contextActivityId);
                return new ToolResult(call.id(), call.name(), content);
            }

            return new ToolResult(call.id(), call.name(), "Unknown tool: " + call.name());
        } catch (Exception e) {
            log.warn("Tool execution failed [{}]: {}", call.name(), e.getMessage());
            return new ToolResult(call.id(), call.name(), "Error executing tool: " + e.getMessage());
        }
    }

    public record ToolLoopResult(String error, List<ToolCallLogEntry> toolLog, String finalResponse) {
        public boolean hasError() { return error != null; }
    }

    public record ToolCallLogEntry(String toolName, Map<String, Object> arguments,
                                    String resultSummary, long durationMs, boolean isError) {}
}
