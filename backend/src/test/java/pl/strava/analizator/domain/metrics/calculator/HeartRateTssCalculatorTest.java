package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class HeartRateTssCalculatorTest {

    private final HeartRateTssCalculator calculator = new HeartRateTssCalculator();

    @Test
    void supports_trueWhenNoPoweButHasHR() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140, 145, 150})
                .avgHeartrate((short) 145)
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supports_falseWhenHasPower() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200})
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void supports_falseWhenNoHR() {
        Activity activity = Activity.builder().build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void calculate_knownValues_correctHrTss() {
        // hrTSS = (moving_time × avg_HR × IF_hr) / (LTHR × 3600) × 100
        // IF_hr = avg_HR / LTHR = 150 / 170 ≈ 0.882
        // hrTSS = (3600 × 150 × 0.882) / (170 × 3600) × 100 ≈ 77.72
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{150})
                .avgHeartrate((short) 150)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().lthrBpm((short) 170).build();

        double hrTss = calculator.calculate(activity, profile);
        assertThat(hrTss).isCloseTo(77.72, within(1.0));
    }

    @Test
    void calculate_noLthrButHasMaxHr_usesEstimatedLthr() {
        // LTHR estimated as 87% of maxHR = 0.87 × 200 = 174 bpm
        // hrTSS = (3600 × 150 × (150/174)) / (174 × 3600) × 100 ≈ 74.36
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{150})
                .avgHeartrate((short) 150)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().maxHrBpm((short) 200).build();

        double hrTss = calculator.calculate(activity, profile);
        double estimatedLthr = 200 * 0.87;
        double expected = (3600.0 * 150 * (150.0 / estimatedLthr)) / (estimatedLthr * 3600.0) * 100.0;
        assertThat(hrTss).isCloseTo(expected, within(0.01));
    }

    @Test
    void calculate_noLthrNoMaxHr_throwsException() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        assertThatThrownBy(() -> calculator.calculate(activity, profile))
                .isInstanceOf(MetricCalculationException.class)
                .hasMessageContaining("LTHR or max HR required");
    }
}
