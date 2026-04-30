package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class PowerFadeCalculatorTest {

    private final PowerFadeCalculator calculator = new PowerFadeCalculator();

    @Test
    void supports_falseWhenTooShort() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200, 200, 200, 200})
                .movingTimeSec(1200)
                .build();

        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void calculate_steadyRide_returnsNearZero() {
        int[] power = new int[120];
        for (int i = 0; i < power.length; i++) {
            power[i] = 220;
        }
        Activity activity = Activity.builder()
                .powerStream(power)
                .movingTimeSec(3600)
                .build();

        double fade = calculator.calculate(activity, AthleteProfile.builder().build());

        assertThat(fade).isCloseTo(0.0, within(0.1));
    }

    @Test
    void calculate_lastQuarterDropsPower_returnsPositiveFade() {
        int[] power = new int[120];
        for (int i = 0; i < 90; i++) {
            power[i] = 240;
        }
        for (int i = 90; i < 120; i++) {
            power[i] = 195;
        }
        Activity activity = Activity.builder()
                .powerStream(power)
                .movingTimeSec(3600)
                .build();

        double fade = calculator.calculate(activity, AthleteProfile.builder().build());

        assertThat(fade).isGreaterThan(15.0);
    }
}
