package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.vo.TimeInZones;

class TimeInZonesCalculatorTest {

    private final TimeInZonesCalculator calculator = new TimeInZonesCalculator();

    @Test
    void supports_trueWithPowerStream() {
        Activity activity = Activity.builder().powerStream(new int[]{200}).build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supports_trueWithHrStream() {
        Activity activity = Activity.builder().heartrateStream(new int[]{140}).build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void supports_falseWithNoStreams() {
        Activity activity = Activity.builder().build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void calculate_powerStream_allZonesPopulated() {
        // Create a stream where max value is 400, so zones are relative to 400
        int[] power = {100, 200, 250, 300, 350, 380, 400};
        Activity activity = Activity.builder().powerStream(power).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        TimeInZones result = calculator.calculate(activity, profile);
        assertThat(result.getPowerZoneSeconds()).isNotNull();
        assertThat(result.totalPowerSeconds()).isEqualTo(7);
    }

    @Test
    void calculate_hrStream_allZonesPopulated() {
        int[] hr = {80, 100, 120, 140, 160, 170, 180};
        Activity activity = Activity.builder().heartrateStream(hr).build();
        AthleteProfile profile = AthleteProfile.builder().build();

        TimeInZones result = calculator.calculate(activity, profile);
        assertThat(result.getHrZoneSeconds()).isNotNull();
        assertThat(result.totalHrSeconds()).isEqualTo(7);
    }

    @Test
    void calculate_bothStreams_bothPopulated() {
        int[] power = {200, 250, 300};
        int[] hr = {120, 140, 160};
        Activity activity = Activity.builder()
                .powerStream(power)
                .heartrateStream(hr)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        TimeInZones result = calculator.calculate(activity, profile);
        assertThat(result.getPowerZoneSeconds()).isNotNull();
        assertThat(result.getHrZoneSeconds()).isNotNull();
    }
}
