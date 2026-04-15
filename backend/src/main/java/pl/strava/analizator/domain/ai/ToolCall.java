package pl.strava.analizator.domain.ai;

import java.util.Map;

/**
 * A tool call request returned by the LLM.
 */
public record ToolCall(
        String id,
        String name,
        Map<String, Object> arguments
) {}
