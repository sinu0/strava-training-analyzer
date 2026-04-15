package pl.strava.analizator.domain.ai;

import java.util.List;
import java.util.Map;

/**
 * Definition of a tool that the LLM can call.
 * Parameters follow the JSON Schema object format.
 */
public record AiTool(
        String name,
        String description,
        Map<String, Object> parameters
) {

    /** Builds a tool with no required parameters. */
    public static AiTool of(String name, String description, Map<String, Object> properties) {
        return new AiTool(name, description, Map.of(
                "type", "object",
                "properties", properties,
                "required", List.of()
        ));
    }

    /** Builds a tool with required parameters. */
    public static AiTool of(String name, String description,
                             Map<String, Object> properties, List<String> required) {
        return new AiTool(name, description, Map.of(
                "type", "object",
                "properties", properties,
                "required", required
        ));
    }
}
