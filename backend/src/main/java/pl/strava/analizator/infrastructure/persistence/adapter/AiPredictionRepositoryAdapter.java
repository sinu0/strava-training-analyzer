package pl.strava.analizator.infrastructure.persistence.adapter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.port.AiPredictionRepository;
import pl.strava.analizator.infrastructure.persistence.entity.AiPredictionEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AiPredictionJpaRepository;

@Component
@RequiredArgsConstructor
public class AiPredictionRepositoryAdapter implements AiPredictionRepository {

    private final AiPredictionJpaRepository jpaRepository;

    @Override
    public AiPrediction save(AiPrediction prediction, String providerName) {
        AiPredictionEntity entity = AiPredictionEntity.builder()
                .predictionType(prediction.getType().name())
                .modelId(prediction.getModelId())
                .providerName(providerName)
                .summary(prediction.getSummary())
                .detail(prediction.getDetail())
                .structuredData(prediction.getStructuredData())
                .confidence(BigDecimal.valueOf(prediction.getConfidence()))
                .createdAt(prediction.getCreatedAt())
                .build();

        AiPredictionEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<AiPrediction> findByType(String predictionType, int limit) {
        return jpaRepository.findByPredictionTypeOrderByCreatedAtDesc(predictionType, PageRequest.of(0, limit))
                .stream().map(this::toDomain).toList();
    }

    @Override
    public List<AiPrediction> findRecent(int limit) {
        return jpaRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .stream().map(this::toDomain).toList();
    }

    @Override
    public List<AiPrediction> findByCreatedAtBetween(Instant from, Instant to) {
        return jpaRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to)
                .stream().map(this::toDomain).toList();
    }

    @Override
    public List<AiPrediction> findByTypeAndCreatedAtBetween(String type, Instant from, Instant to) {
        return jpaRepository.findByPredictionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(type, from, to)
                .stream().map(this::toDomain).toList();
    }

    @Override
    public boolean existsTodayForType(String type) {
        Instant startOfDay = java.time.LocalDate.now().atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        Instant endOfDay = startOfDay.plus(1, java.time.temporal.ChronoUnit.DAYS);
        return jpaRepository.existsByPredictionTypeAndCreatedAtBetween(type, startOfDay, endOfDay);
    }

    @Override
    public AiPrediction findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain).orElse(null);
    }

    @Override
    public AiPrediction updateAccuracy(UUID id, Map<String, Object> actualData, double accuracyScore) {
        AiPredictionEntity entity = jpaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Prediction not found: " + id));
        entity.setActualData(actualData);
        entity.setAccuracyScore(BigDecimal.valueOf(accuracyScore));
        entity.setVerifiedAt(Instant.now());
        return toDomain(jpaRepository.save(entity));
    }

    @SuppressWarnings("unchecked")
    private AiPrediction toDomain(AiPredictionEntity entity) {
        Map<String, Object> structuredData = entity.getStructuredData() != null ? entity.getStructuredData() : Map.of();

        Map<String, Object> actualData = entity.getActualData() != null ? entity.getActualData() : Map.of();

        PredictionType type;
        try {
            type = PredictionType.valueOf(entity.getPredictionType());
        } catch (IllegalArgumentException e) {
            type = PredictionType.FTP_PREDICTION;
        }

        return AiPrediction.builder()
                .id(entity.getId())
                .type(type)
                .modelId(entity.getModelId())
                .summary(entity.getSummary())
                .detail(entity.getDetail())
                .structuredData(structuredData)
                .confidence(entity.getConfidence() != null ? entity.getConfidence().doubleValue() : 0.5)
                .createdAt(entity.getCreatedAt())
                .actualData(actualData.isEmpty() ? null : actualData)
                .accuracyScore(entity.getAccuracyScore() != null ? entity.getAccuracyScore().doubleValue() : null)
                .verifiedAt(entity.getVerifiedAt())
                .build();
    }
}
