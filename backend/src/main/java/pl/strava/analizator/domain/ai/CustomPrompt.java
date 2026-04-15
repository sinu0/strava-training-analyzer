package pl.strava.analizator.domain.ai;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CustomPrompt {

    private final UUID id;
    private final String predictionType;
    private final String name;
    private final String systemPrompt;
    private final String userPromptTemplate;
    private final String responseFormat;
    private final boolean active;
    private final Instant createdAt;
    private final Instant updatedAt;
}
