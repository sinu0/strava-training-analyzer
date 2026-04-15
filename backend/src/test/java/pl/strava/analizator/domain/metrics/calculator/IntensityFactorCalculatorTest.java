package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class IntensityFactorCalculatorTest {

    private final NormalizedPowerCalculator npCalc = new NormalizedPowerCalculator();
    private final IntensityFactorCalculator calculator = new IntensityFactorCalculator(npCalc);

    @Test
    void calculate_knownNpAndFtp_returnsCorrectIF() {
        // Constant 280W → NP=280, FTP=300 → IF=0.933
        int[] power = new int[120];
        for (int i = 0; i < 120; i++) power[i] = 280;
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().ftpWatts((short) 300).build();

        double result = calculator.calculate(activity, profile);
        assertThat(result).isCloseTo(0.933, within(0.01));
    }

    @Test
    void calculate_noFtp_throwsException() {
        int[] power = new int[]{200, 200, 200};
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        assertThatThrownBy(() -> calculator.calculate(activity, profile))
                .isInstanceOf(MetricCalculationException.class)
                .hasMessageContaining("FTP required");
    }

    @Test
    void supports_returnsTrueWithPower() {
        Activity activity = Activity.builder().powerStream(new int[]{200}).build();
        assertThat(calculator.supports(activity)).isTrue();
    }
}
