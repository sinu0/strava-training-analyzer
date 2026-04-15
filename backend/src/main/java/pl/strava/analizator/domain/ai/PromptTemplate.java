package pl.strava.analizator.domain.ai;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Domain model representing a predefined prompt template.
 * Templates contain placeholders (e.g. {{recentActivities}}) that are populated
 * with real training data before being sent to the LLM.
 */
@Getter
@Builder
@AllArgsConstructor
public class PromptTemplate {

    private PredictionType type;
    private String systemPrompt;
    private String userPromptTemplate;
    private String responseFormat;

    /**
     * Resolves the user prompt by replacing placeholders with actual data.
     */
    public String resolveUserPrompt(Map<String, String> variables) {
        String resolved = userPromptTemplate;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            resolved = resolved.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return resolved;
    }
}
