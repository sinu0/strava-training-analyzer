package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class NormalizedPowerCalculatorTest {

    private final NormalizedPowerCalculator calculator = new NormalizedPowerCalculator();

    @Test
    void supports_returnsTrueWhenPowerDataPresent() {
        Activity activity = Activity.builder()
                .powerStream(new int[]{200, 210, 190})
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supports_returnsFalseWhenNoPowerData() {
        Activity activity = Activity.builder().build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void calculate_shortRide_returnsAveragePower() {
        // Less than 30 samples → returns simple average
        int[] power = new int[20];
        for (int i = 0; i < 20; i++) power[i] = 200;
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double np = calculator.calculate(activity, profile);
        assertThat(np).isCloseTo(200.0, within(0.5));
    }

    @Test
    void calculate_constantPower_npEqualsAvg() {
        // Constant 200W for 120 seconds → NP should be ≈ 200W
        int[] power = new int[120];
        for (int i = 0; i < 120; i++) power[i] = 200;
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double np = calculator.calculate(activity, profile);
        assertThat(np).isCloseTo(200.0, within(0.5));
    }

    @Test
    void calculate_variablePower_npHigherThanAvg() {
        // Variable power with distinct blocks → NP should be higher than simple average
        int[] power = new int[120];
        // First 60s at 100W, second 60s at 300W → avg = 200, NP > 200
        for (int i = 0; i < 60; i++) power[i] = 100;
        for (int i = 60; i < 120; i++) power[i] = 300;
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double np = calculator.calculate(activity, profile);
        double avg = 200.0;
        assertThat(np).isGreaterThan(avg);
    }

    @Test
    void calculate_powerWithZeros_handlesFreewheeling() {
        // Mix of power and zeros (freewheeling)
        int[] power = new int[120];
        for (int i = 0; i < 120; i++) {
            power[i] = (i % 3 == 0) ? 0 : 250;
        }
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double np = calculator.calculate(activity, profile);
        assertThat(np).isGreaterThan(0).isLessThan(250);
    }

    @Test
    void calculate_typicalRide_correctNP() {
        // Known power data: 60 seconds at 200W, 60 seconds at 300W
        int[] power = new int[120];
        for (int i = 0; i < 60; i++) power[i] = 200;
        for (int i = 60; i < 120; i++) power[i] = 300;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        double np = calculator.calculate(activity, profile);
        // NP should be between 200 (all low) and 300 (all high), higher than avg (250) due to ^4
        assertThat(np).isBetween(250.0, 300.0);
    }
}
