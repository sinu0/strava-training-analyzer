package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.vo.BestEfforts;

class PowerCurveCalculatorTest {

    private final PowerCurveCalculator calculator = new PowerCurveCalculator();

    @Test
    void supports_trueWithPower() {
        Activity activity = Activity.builder().powerStream(new int[]{200}).build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supports_falseWithoutPower() {
        Activity activity = Activity.builder().build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void calculate_constantPower_effortsEqualPower() {
        // 120 seconds of constant 250W
        int[] power = new int[120];
        for (int i = 0; i < 120; i++) power[i] = 250;
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        BestEfforts result = calculator.calculate(activity, profile);
        assertThat(result.getEffort(1)).isCloseTo(250.0, within(0.1));
        assertThat(result.getEffort(5)).isCloseTo(250.0, within(0.1));
        assertThat(result.getEffort(60)).isCloseTo(250.0, within(0.1));
    }

    @Test
    void calculate_shortActivity_noLongEfforts() {
        // Only 10 seconds → no efforts for 30s, 60s etc.
        int[] power = new int[10];
        for (int i = 0; i < 10; i++) power[i] = 300;
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        BestEfforts result = calculator.calculate(activity, profile);
        assertThat(result.getEffort(1)).isNotNull();
        assertThat(result.getEffort(5)).isNotNull();
        assertThat(result.getEffort(10)).isNotNull();
        assertThat(result.getEffort(30)).isNull(); // Activity too short
    }

    @Test
    void calculate_spikePower_best5sReflectsSpike() {
        // 120 seconds mostly 200W, but 5-second burst of 800W
        int[] power = new int[120];
        for (int i = 0; i < 120; i++) power[i] = 200;
        for (int i = 50; i < 55; i++) power[i] = 800;
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        BestEfforts result = calculator.calculate(activity, profile);
        assertThat(result.getEffort(5)).isCloseTo(800.0, within(1.0));
        // 1-minute best should include the spike but be much lower
        assertThat(result.getEffort(60)).isLessThan(300);
    }

    @Test
    void calculate_multipleActivities_correctBestEfforts() {
        // Verify best efforts reflect the maximum power found
        int[] power = new int[3600]; // 1 hour
        for (int i = 0; i < 3600; i++) power[i] = 200;
        // Insert a 5-minute peak at 350W
        for (int i = 1000; i < 1300; i++) power[i] = 350;

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        BestEfforts result = calculator.calculate(activity, profile);
        assertThat(result.getEffort(300)).isCloseTo(350.0, within(0.1)); // 5min best = 350W
        assertThat(result.getEffort(3600)).isGreaterThan(200); // 60min includes peak
    }
}
