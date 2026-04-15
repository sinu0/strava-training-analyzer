package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class VariabilityIndexCalculatorTest {

    private final NormalizedPowerCalculator npCalc = new NormalizedPowerCalculator();
    private final VariabilityIndexCalculator calculator = new VariabilityIndexCalculator(npCalc);

    @Test
    void supportsActivityWithPowerAndAvgPower() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200, 210})
                .avgPowerW((short) 205)
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void doesNotSupportWithoutPower() {
        Activity activity = Activity.builder().avgPowerW((short) 200).build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void doesNotSupportWithZeroAvgPower() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200, 210})
                .avgPowerW((short) 0)
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void steadyPowerReturnsCloseToOne() {
        // Constant power = NP equals avg power → VI ≈ 1.0
        int[] power = new int[60];
        for (int i = 0; i < 60; i++) {
            power[i] = 200;
        }
        Activity activity = Activity.builder()
                .powerStream(power)
                .avgPowerW((short) 200)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Double vi = calculator.calculate(activity, profile);
        assertThat(vi).isEqualTo(1.0);
    }

    @Test
    void variablePowerReturnsAboveOne() {
        // 30s high then 30s low → NP > avg → VI > 1
        int[] power = new int[120];
        int sum = 0;
        for (int i = 0; i < 120; i++) {
            power[i] = (i < 60) ? 300 : 100;
            sum += power[i];
        }
        short avg = (short) (sum / 120);
        Activity activity = Activity.builder()
                .powerStream(power)
                .avgPowerW(avg)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Double vi = calculator.calculate(activity, profile);
        assertThat(vi).isGreaterThan(1.0);
    }
}
