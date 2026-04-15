package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class AerobicDecouplingCalculatorTest {

    private final AerobicDecouplingCalculator calculator = new AerobicDecouplingCalculator();

    @Test
    void supports_falseWhenTooShort() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200})
                .heartrateStream(new int[]{140})
                .movingTimeSec(900) // 15 min < 30 min minimum
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void supports_trueWhenLongEnough() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200})
                .heartrateStream(new int[]{140})
                .movingTimeSec(3600)
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void calculate_steadyRide_decouplingNearZero() {
        // Same power and HR throughout → decoupling ≈ 0%
        int[] power = new int[200];
        int[] hr = new int[200];
        for (int i = 0; i < 200; i++) {
            power[i] = 200;
            hr[i] = 140;
        }
        Activity activity = Activity.builder()
                .powerStream(power)
                .heartrateStream(hr)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double decoupling = calculator.calculate(activity, profile);
        assertThat(decoupling).isCloseTo(0.0, within(0.1));
    }

    @Test
    void calculate_fadingRide_positiveDecoupling() {
        // Same power but HR drifts up in second half → positive decoupling
        int[] power = new int[200];
        int[] hr = new int[200];
        for (int i = 0; i < 100; i++) {
            power[i] = 200;
            hr[i] = 140;
        }
        for (int i = 100; i < 200; i++) {
            power[i] = 200;
            hr[i] = 155; // HR drift up
        }
        Activity activity = Activity.builder()
                .powerStream(power)
                .heartrateStream(hr)
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double decoupling = calculator.calculate(activity, profile);
        assertThat(decoupling).isGreaterThan(5.0); // > 5% = poor aerobic endurance
    }
}
