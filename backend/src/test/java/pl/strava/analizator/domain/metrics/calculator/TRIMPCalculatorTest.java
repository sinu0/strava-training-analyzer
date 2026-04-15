package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class TRIMPCalculatorTest {

    private final TRIMPCalculator calculator = new TRIMPCalculator();

    @Test
    void supports_trueWhenActivityHasHeartrateAndDuration() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140, 145, 150})
                .avgHeartrate((short) 145)
                .movingTimeSec(3600)
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supports_falseWhenNoHeartrate() {
        Activity activity = Activity.builder()
                .movingTimeSec(3600)
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void supports_falseWhenZeroDuration() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .movingTimeSec(0)
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void calculate_knownValues_correctTrimp() {
        // TRIMPexp = D × HRr × 0.64 × e^(1.92 × HRr)
        // D = 3600s → 60 min
        // HRrest=60, HRmax=200, avgHR=140
        // HRr = (140-60)/(200-60) = 80/140 ≈ 0.5714
        // TRIMP = 60 × 0.5714 × 0.64 × e^(1.92×0.5714)
        //       = 60 × 0.5714 × 0.64 × e^1.0971
        //       ≈ 60 × 0.5714 × 0.64 × 2.9961
        //       ≈ 65.75
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder()
                .maxHrBpm((short) 200)
                .restingHrBpm((short) 60)
                .build();

        double trimp = calculator.calculate(activity, profile);

        assertThat(trimp).isCloseTo(65.75, within(1.0));
    }

    @Test
    void calculate_missingMaxHr_throwsException() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder()
                .restingHrBpm((short) 60)
                .build();

        assertThatThrownBy(() -> calculator.calculate(activity, profile))
                .isInstanceOf(MetricCalculationException.class)
                .hasMessageContaining("maxHrBpm");
    }

    @Test
    void calculate_missingRestingHr_throwsException() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder()
                .maxHrBpm((short) 200)
                .build();

        assertThatThrownBy(() -> calculator.calculate(activity, profile))
                .isInstanceOf(MetricCalculationException.class)
                .hasMessageContaining("restingHrBpm");
    }

    @Test
    void calculate_hrrClampedTo1_whenAvgHrExceedsMax() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{210})
                .avgHeartrate((short) 210)
                .movingTimeSec(600)
                .build();
        AthleteProfile profile = AthleteProfile.builder()
                .maxHrBpm((short) 200)
                .restingHrBpm((short) 60)
                .build();

        // HRr clamped to 1.0 → TRIMP = 10 × 1.0 × 0.64 × e^1.92 ≈ 10 × 0.64 × 6.821 ≈ 43.65
        double trimp = calculator.calculate(activity, profile);
        assertThat(trimp).isGreaterThan(0);
        assertThat(trimp).isCloseTo(43.65, within(1.0));
    }
}
