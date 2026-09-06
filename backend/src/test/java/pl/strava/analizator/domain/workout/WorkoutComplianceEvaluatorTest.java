package pl.strava.analizator.domain.workout;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.WorkoutStep;

class WorkoutComplianceEvaluatorTest {
    private final WorkoutComplianceEvaluator evaluator = new WorkoutComplianceEvaluator();
    private final List<WorkoutStep> steps = List.of(WorkoutStep.builder().type("steady").durationSec(10).powerPctFtpLow(50).powerPctFtpHigh(75).build());

    @Test void weightsTimeInsteadOfCountingIrregularSamples() {
        var result = evaluator.evaluate(steps, 200, Activity.builder().deviceWatts(true)
                .timeStream(new int[]{0, 1, 10}).powerStream(new int[]{120, 200, 200}).build());
        assertThat(result.getScore()).isEqualTo(10);
        assertThat(result.getAvailability()).isEqualTo("AVAILABLE");
    }
    @Test void missingOrEstimatedPowerNeverProducesAComplianceScore() {
        var result = evaluator.evaluate(steps, 200, Activity.builder().deviceWatts(false)
                .timeStream(new int[]{0,10}).powerStream(new int[]{120,120}).build());
        assertThat(result.getAvailability()).isEqualTo("UNKNOWN");
        assertThat(result.getScore()).isNull();
    }
    @Test void shortRecordingCannotLookLikePerfectExecution() {
        var result = evaluator.evaluate(steps, 200, Activity.builder().deviceWatts(true)
                .timeStream(new int[]{0,2}).powerStream(new int[]{120,120}).build());
        assertThat(result.getAvailability()).isEqualTo("PARTIAL");
        assertThat(result.getScore()).isNull();
    }
}
