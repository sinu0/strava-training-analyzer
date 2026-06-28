package pl.strava.analizator.domain.ai;

public record PromptSet(
        String systemPrompt,
        String userTemplate,
        String fewShot,
        String responseFormat
) {}
