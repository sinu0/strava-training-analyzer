package pl.strava.analizator.application.ai;

import pl.strava.analizator.domain.ai.PredictionType;

public record PromptResult(
        String systemPrompt,
        String userPrompt,
        PredictionType type,
        String modelRecommendation
) {

    public PromptResult(String systemPrompt, String userPrompt, PredictionType type) {
        this(systemPrompt, userPrompt, type, null);
    }
}
