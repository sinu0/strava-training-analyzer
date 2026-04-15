package pl.strava.analizator.domain.ai;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Domain model representing an AI prediction result.
 */
@Getter
@Builder
@AllArgsConstructor
public class AiPrediction {

    private UUID id;
    private PredictionType type;
    private String modelId;
    private String summary;
    private String detail;
    private Map<String, Object> structuredData;
    private double confidence;
    private Instant createdAt;
    private Map<String, Object> actualData;
    private Double accuracyScore;
    private Instant verifiedAt;
}
