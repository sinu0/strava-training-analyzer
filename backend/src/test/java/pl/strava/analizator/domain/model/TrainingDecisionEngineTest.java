package pl.strava.analizator.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class TrainingDecisionEngineTest {
    private final TrainingDecisionEngine engine = new TrainingDecisionEngine();

    @Test void missingRecoveryAndLoadCannotRecommendThreshold() {
        var snapshot = AthleteSnapshot.builder().date(LocalDate.of(2026,9,5)).availableMinutes(90)
                .ftpWatts(230).plannedType("THRESHOLD").plannedDurationMinutes(90)
                .dataGaps(List.of("Brak obciążenia", "Brak regeneracji")).build();
        var result = engine.decide(snapshot);
        assertThat(result.getSessionType()).isEqualTo("ENDURANCE");
        assertThat(result.getDurationMinutes()).isLessThanOrEqualTo(45);
        assertThat(result.getTargetTss()).isNull();
        assertThat(result.getConfidence()).isEqualTo("LOW");
    }

    @Test void unspecifiedAvailabilityRequiresInputInsteadOfInventingNinetyMinutes() {
        var result = engine.decide(AthleteSnapshot.builder().date(LocalDate.of(2026,9,5)).dataGaps(List.of()).build());
        assertThat(result.getDecision()).isEqualTo("NEEDS_INPUT");
        assertThat(result.getDurationMinutes()).isNull();
    }

    @Test void userConstraintWinsOverGoodNumbersAndPlannedIntervals() {
        var result = engine.decide(AthleteSnapshot.builder().date(LocalDate.of(2026,9,5)).availableMinutes(90)
                .blocked(true).plannedType("THRESHOLD").dataGaps(List.of()).build());
        assertThat(result.getDecision()).isEqualTo("REST");
        assertThat(result.getSessionType()).isNull();
    }

    @Test void recentDifficultFeedbackAndReturnModeLimitIntensity() {
        var result = engine.decide(AthleteSnapshot.builder().date(LocalDate.of(2026,9,5)).availableMinutes(90)
                .ftpWatts(230).returnToTraining(true).recentAverageRpe(9.0)
                .plannedType("THRESHOLD").plannedDurationMinutes(90).dataGaps(List.of()).build());
        assertThat(result.getSessionType()).isEqualTo("ENDURANCE");
        assertThat(result.getDurationMinutes()).isLessThanOrEqualTo(45);
    }
}
