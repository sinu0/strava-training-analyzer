package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class EfficiencyFactorCalculatorTest {

    private final NormalizedPowerCalculator npCalc = new NormalizedPowerCalculator();
    private final EfficiencyFactorCalculator calculator = new EfficiencyFactorCalculator(npCalc);

    @Test
    void calculate_knownNpAndHr_correctEF() {
        // Constant 250W, avgHR 150 → EF = 250/150 = 1.667
        int[] power = new int[120];
        for (int i = 0; i < 120; i++) power[i] = 250;
        Activity activity = Activity.builder()
                .powerStream(power)
                .heartrateStream(new int[]{150})
                .avgHeartrate((short) 150)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double ef = calculator.calculate(activity, profile);
        assertThat(ef).isCloseTo(1.667, within(0.01));
    }

    @Test
    void supports_falseWithoutHR() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200})
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void supports_falseWithoutPower() {
        Activity activity = Activity.builder()
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void supports_trueWithBothPowerAndHR() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200})
                .heartrateStream(new int[]{140})
                .avgHeartrate((short) 140)
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }
}
