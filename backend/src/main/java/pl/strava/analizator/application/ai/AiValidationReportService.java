package pl.strava.analizator.application.ai;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import pl.strava.analizator.application.dto.AiValidationReportDto;
import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.port.AiPredictionRepository;

@Service
public class AiValidationReportService {

    private final AiPredictionRepository predictionRepository;
    private final int minimumSamples;

    public AiValidationReportService(
            AiPredictionRepository predictionRepository,
            @Value("${ai.validation.minimum-samples:20}") int minimumSamples) {
        this.predictionRepository = predictionRepository;
        this.minimumSamples = Math.max(1, minimumSamples);
    }

    public AiValidationReportDto getReport() {
        List<AiPrediction> candidates = predictionRepository.findVerified();
        List<AiPrediction> valid = candidates.stream().filter(this::isTemporallyValid).toList();
        int rejected = candidates.size() - valid.size();

        Double meanAccuracy = average(valid, true);
        Double meanConfidence = average(valid, false);
        Double calibrationGap = meanAccuracy != null && meanConfidence != null
                ? Math.abs(meanAccuracy - meanConfidence)
                : null;
        Map<String, Integer> samplesByType = valid.stream().collect(Collectors.toMap(
                prediction -> prediction.getType().name(),
                ignored -> 1,
                Integer::sum,
                TreeMap::new));

        String status = valid.isEmpty()
                ? "UNAVAILABLE"
                : valid.size() < minimumSamples ? "INSUFFICIENT_DATA" : "AVAILABLE";
        return AiValidationReportDto.builder()
                .status(status)
                .validSamples(valid.size())
                .rejectedSamples(rejected)
                .minimumSamples(minimumSamples)
                .meanAccuracy(meanAccuracy)
                .meanConfidence(meanConfidence)
                .calibrationGap(calibrationGap)
                .samplesByType(samplesByType)
                .provenance("POST_PREDICTION_VERIFICATION")
                .generatedAt(Instant.now())
                .build();
    }

    private boolean isTemporallyValid(AiPrediction prediction) {
        return prediction != null
                && prediction.getType() != null
                && prediction.getCreatedAt() != null
                && prediction.getVerifiedAt() != null
                && prediction.getVerifiedAt().isAfter(prediction.getCreatedAt())
                && prediction.getActualData() != null
                && !prediction.getActualData().isEmpty()
                && prediction.getAccuracyScore() != null
                && Double.isFinite(prediction.getAccuracyScore())
                && prediction.getAccuracyScore() >= 0
                && prediction.getAccuracyScore() <= 1
                && Double.isFinite(prediction.getConfidence())
                && prediction.getConfidence() >= 0
                && prediction.getConfidence() <= 1;
    }

    private Double average(List<AiPrediction> predictions, boolean accuracy) {
        if (predictions.isEmpty()) return null;
        return predictions.stream().mapToDouble(prediction -> accuracy
                ? prediction.getAccuracyScore()
                : prediction.getConfidence()).average().orElseThrow();
    }
}
