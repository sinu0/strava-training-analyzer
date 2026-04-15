package pl.strava.analizator.domain.ai;

/**
 * Result of executing a tool call.
 */
public record ToolResult(
        String toolCallId,
        String name,
        String content
) {}
