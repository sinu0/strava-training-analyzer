package pl.strava.analizator.domain.ai;

import java.util.List;

/**
 * Sealed response from an LLM: either a final text answer or a list of tool calls.
 */
public sealed interface LlmChatResponse permits LlmChatResponse.Text, LlmChatResponse.ToolCalls {

    record Text(String content) implements LlmChatResponse {}

    record ToolCalls(List<ToolCall> calls) implements LlmChatResponse {}
}
