package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class PeakEffortCalculatorTest {

    private final PeakEffortCalculator calculator = new PeakEffortCalculator();

    @Test
    void supportsPowerActivity() {
        Activity activity = Activity.builder().powerStream(new int[]{200, 210}).build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supportsHeartrateActivity() {
        Activity activity = Activity.builder().heartrateStream(new int[]{140, 150}).build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void doesNotSupportEmptyActivity() {
        Activity activity = Activity.builder().build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    @SuppressWarnings("unchecked")
    void computesPowerPeaks() {
        // 10 seconds of data: ramp from 200 to 290
        int[] power = new int[10];
        for (int i = 0; i < 10; i++) {
            power[i] = 200 + i * 10;
        }

        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Map<String, Object> result = calculator.calculate(activity, profile);

        assertThat(result).containsKey("power");
        Map<String, Double> peaks = (Map<String, Double>) result.get("power");
        assertThat(peaks).containsKey("1s");
        assertThat(peaks.get("1s")).isEqualTo(290.0); // max single value
        assertThat(peaks).containsKey("5s");
        assertThat(peaks.get("5s")).isGreaterThan(240.0); // avg of last 5
    }

    @Test
    @SuppressWarnings("unchecked")
    void skipsWindowsTooLargeForData() {
        int[] power = new int[]{200, 210, 220};
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Map<String, Object> result = calculator.calculate(activity, profile);
        Map<String, Double> peaks = (Map<String, Double>) result.get("power");

        assertThat(peaks).containsKey("1s");
        assertThat(peaks).doesNotContainKey("5s"); // only 3 data points
    }

    @Test
    @SuppressWarnings("unchecked")
    void computesMultipleStreamPeaks() {
        int[] power = new int[]{200, 250, 300, 280, 260};
        int[] hr = new int[]{140, 150, 160, 155, 145};
        double[] velocity = new double[]{5.0, 5.5, 6.0, 5.8, 5.2};

        Activity activity = Activity.builder()
                .powerStream(power)
                .heartrateStream(hr)
                .velocityStream(velocity)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Map<String, Object> result = calculator.calculate(activity, profile);

        assertThat(result).containsKeys("power", "heartrate", "speed");
    }
}
