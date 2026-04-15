package pl.strava.analizator.domain.ai;

import java.util.List;

/**
 * Port for communicating with LLM providers.
 * Infrastructure layer implements this with Ollama, OpenAI, etc.
 */
public interface LlmPort {

    /**
     * Sends a prompt to the LLM and returns the raw response text.
     */
    String chat(String systemPrompt, String userPrompt, String modelId);

    /**
     * Multi-turn chat with optional tool calling support.
     * The LLM may respond with a text answer or a list of tool call requests.
     * Providers that do not support tool calling should return a Text response
     * using the last user message content.
     *
     * @param messages conversation history (system, user, assistant, tool turns)
     * @param tools    available tools the model may call (empty list = no tools)
     * @param modelId  the model identifier
     * @return Text with final answer, or ToolCalls requesting tool execution
     */
    default LlmChatResponse chatWithTools(List<LlmMessage> messages, List<AiTool> tools, String modelId) {
        // Default fallback: extract system + last user message and call plain chat()
        String systemPrompt = messages.stream()
                .filter(m -> m.role() == LlmMessage.Role.SYSTEM)
                .map(LlmMessage::content)
                .findFirst().orElse("");
        String userPrompt = messages.stream()
                .filter(m -> m.role() == LlmMessage.Role.USER)
                .map(LlmMessage::content)
                .reduce("", (a, b) -> b);
        return new LlmChatResponse.Text(chat(systemPrompt, userPrompt, modelId));
    }

    /**
     * Returns true if this provider supports native tool calling.
     */
    default boolean supportsToolCalling() {
        return false;
    }

    boolean isAvailable(String modelId);

    String getProviderName();
}
