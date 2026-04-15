package pl.strava.analizator.application.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponseDto {

    private UUID id;
    private String predictionType;
    private String modelId;
    private String providerName;
    private String summary;
    private String detail;
    private Map<String, Object> structuredData;
    private double confidence;
    private Instant createdAt;
    private Map<String, Object> actualData;
    private Double accuracyScore;
    private Instant verifiedAt;
}
