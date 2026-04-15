package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomPromptDto {

    private UUID id;
    private String predictionType;
    private String name;
    private String systemPrompt;
    private String userPromptTemplate;
    private String responseFormat;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
