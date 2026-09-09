package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.ai.AiPrediction;
import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.port.AiPredictionRepository;

@ExtendWith(MockitoExtension.class)
class AiValidationReportServiceTest {

    private static final Instant CREATED = Instant.parse("2026-09-01T08:00:00Z");

    @Mock private AiPredictionRepository predictionRepository;

    @Test
    void reportsOnlyPostPredictionOutcomesAndRejectsTemporalLeakage() {
        when(predictionRepository.findVerified()).thenReturn(List.of(
                prediction(PredictionType.FTP_PREDICTION, 0.8, 0.9, CREATED.plusSeconds(3600)),
                prediction(PredictionType.FATIGUE_PREDICTION, 0.6, 0.5, CREATED.plusSeconds(7200)),
                prediction(PredictionType.FTP_PREDICTION, 0.95, 0.9, CREATED.minusSeconds(1))));
        AiValidationReportService service = new AiValidationReportService(predictionRepository, 3);

        var report = service.getReport();

        assertThat(report.getStatus()).isEqualTo("INSUFFICIENT_DATA");
        assertThat(report.getValidSamples()).isEqualTo(2);
        assertThat(report.getRejectedSamples()).isEqualTo(1);
        assertThat(report.getMinimumSamples()).isEqualTo(3);
        assertThat(report.getMeanAccuracy()).isEqualTo(0.7);
        assertThat(report.getMeanConfidence()).isEqualTo(0.7);
        assertThat(report.getSamplesByType()).containsEntry("FTP_PREDICTION", 1)
                .containsEntry("FATIGUE_PREDICTION", 1);
        assertThat(report.getProvenance()).isEqualTo("POST_PREDICTION_VERIFICATION");
    }

    @Test
    void reportsUnavailableInsteadOfInventingMetricsWithoutValidLabels() {
        when(predictionRepository.findVerified()).thenReturn(List.of());
        AiValidationReportService service = new AiValidationReportService(predictionRepository, 2);

        var report = service.getReport();

        assertThat(report.getStatus()).isEqualTo("UNAVAILABLE");
        assertThat(report.getValidSamples()).isZero();
        assertThat(report.getMeanAccuracy()).isNull();
        assertThat(report.getMeanConfidence()).isNull();
    }

    private AiPrediction prediction(PredictionType type, double accuracy, double confidence,
                                    Instant verifiedAt) {
        return AiPrediction.builder()
                .type(type).createdAt(CREATED).verifiedAt(verifiedAt)
                .actualData(Map.of("expertLabel", "accepted"))
                .accuracyScore(accuracy).confidence(confidence).build();
    }
}
