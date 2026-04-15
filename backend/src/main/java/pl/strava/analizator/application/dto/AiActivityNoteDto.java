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
public class AiActivityNoteDto {

    private UUID id;
    private UUID activityId;
    private String summary;
    private String detail;
    private String modelId;
    private String providerName;
    private Instant generatedAt;
    private String queueStatus;
}
