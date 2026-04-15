package pl.strava.analizator.domain.port;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import pl.strava.analizator.domain.ai.AiPrediction;

public interface AiPredictionRepository {

    AiPrediction save(AiPrediction prediction, String providerName);

    List<AiPrediction> findByType(String predictionType, int limit);

    List<AiPrediction> findRecent(int limit);

    List<AiPrediction> findByCreatedAtBetween(Instant from, Instant to);

    List<AiPrediction> findByTypeAndCreatedAtBetween(String type, Instant from, Instant to);

    boolean existsTodayForType(String type);

    AiPrediction findById(UUID id);

    AiPrediction updateAccuracy(UUID id, Map<String, Object> actualData, double accuracyScore);
}
