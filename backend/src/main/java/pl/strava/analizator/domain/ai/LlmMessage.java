package pl.strava.analizator.domain.ai;

import java.util.List;

/**
 * A message in an LLM conversation (multi-turn chat).
 */
public record LlmMessage(
        Role role,
        String content,
        List<ToolCall> toolCalls,
        ToolResult toolResult
) {

    public enum Role { SYSTEM, USER, ASSISTANT, TOOL }

    public static LlmMessage system(String content) {
        return new LlmMessage(Role.SYSTEM, content, null, null);
    }

    public static LlmMessage user(String content) {
        return new LlmMessage(Role.USER, content, null, null);
    }

    public static LlmMessage assistant(String content) {
        return new LlmMessage(Role.ASSISTANT, content, null, null);
    }

    public static LlmMessage assistantWithToolCalls(List<ToolCall> calls) {
        return new LlmMessage(Role.ASSISTANT, null, List.copyOf(calls), null);
    }

    public static LlmMessage toolResult(ToolResult result) {
        return new LlmMessage(Role.TOOL, null, null, result);
    }

    public boolean hasToolCalls() {
        return toolCalls != null && !toolCalls.isEmpty();
    }
}
