package pl.strava.analizator.application.ai.mcp;

import java.util.List;

import pl.strava.analizator.domain.ai.AiTool;

public interface McpToolProvider {

    List<AiTool> getToolDefinitions();

    String executeTool(String toolName, java.util.Map<String, Object> arguments, java.util.UUID contextActivityId);

    boolean hasTool(String toolName);
}
