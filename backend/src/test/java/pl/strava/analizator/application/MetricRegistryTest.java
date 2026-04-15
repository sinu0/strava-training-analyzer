package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.metrics.calculator.HeartRateTssCalculator;
import pl.strava.analizator.domain.metrics.calculator.NormalizedPowerCalculator;
import pl.strava.analizator.domain.metrics.calculator.PowerCurveCalculator;
import pl.strava.analizator.domain.metrics.calculator.TimeInZonesCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;

class MetricRegistryTest {

    @Test
    void calculateAllActivityMetrics_skipsUnsupportedCalculators() {
        NormalizedPowerCalculator npCalc = new NormalizedPowerCalculator();
        HeartRateTssCalculator hrTssCalc = new HeartRateTssCalculator();

        MetricRegistry registry = new MetricRegistry(List.of(npCalc, hrTssCalc), new ObjectMapper());

        // Activity with power but no HR → NP supported, hrTSS not
        Activity activity = Activity.builder()
                .powerStream(new int[]{200, 210, 190, 200, 210, 190, 200, 210, 190, 200})
                .movingTimeSec(3600)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Map<String, MetricResult> results = registry.calculateAllActivityMetrics(activity, profile);

        assertThat(results).containsKey("normalized_power");
        assertThat(results).doesNotContainKey("hr_training_stress_score");
    }

    @Test
    void calculateAllActivityMetrics_handlesCalculationException() {
        NormalizedPowerCalculator npCalc = new NormalizedPowerCalculator();

        MetricRegistry registry = new MetricRegistry(List.of(npCalc), new ObjectMapper());

        // Activity without power → NP not supported, nothing calculated
        Activity activity = Activity.builder().build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Map<String, MetricResult> results = registry.calculateAllActivityMetrics(activity, profile);
        assertThat(results).isEmpty();
    }

    @Test
    void calculateAllActivityMetrics_serializesStructuredMetricResults() {
        PowerCurveCalculator powerCurveCalculator = new PowerCurveCalculator();
        MetricRegistry registry = new MetricRegistry(List.of(powerCurveCalculator), new ObjectMapper());

        Activity activity = Activity.builder()
                .powerStream(new int[]{200, 210, 400, 410, 420, 200, 210, 220, 230, 240})
                .movingTimeSec(10)
                .build();

        Map<String, MetricResult> results = registry.calculateAllActivityMetrics(activity, AthleteProfile.builder().build());

        assertThat(results).containsKey("power_curve");
        assertThat(results.get("power_curve").isNumeric()).isFalse();
        assertThat(results.get("power_curve").getJsonValue()).containsKey("efforts");
    }

    @Test
    void calculateAllActivityMetrics_catchesNonMetricCalculationException_andContinues() {
        // A calculator that throws a plain RuntimeException (not MetricCalculationException)
        ActivityMetricCalculator<Double> brokenCalculator = new ActivityMetricCalculator<>() {
            @Override public String metricName() { return "broken_metric"; }
            @Override public boolean supports(Activity a) { return true; }
            @Override public Double calculate(Activity a, AthleteProfile p) {
                throw new RuntimeException("unexpected failure");
            }
        };

        TimeInZonesCalculator zonesCalc = new TimeInZonesCalculator();
        MetricRegistry registry = new MetricRegistry(List.of(brokenCalculator, zonesCalc), new ObjectMapper());

        Activity activity = Activity.builder()
                .heartrateStream(new int[]{130, 140, 150, 145, 135, 140, 150, 145, 135, 140})
                .movingTimeSec(10)
                .build();

        // Should NOT propagate the exception; remaining calculators should still run
        assertThatCode(() -> registry.calculateAllActivityMetrics(activity, AthleteProfile.builder().build()))
                .doesNotThrowAnyException();

        Map<String, MetricResult> results = registry.calculateAllActivityMetrics(activity, AthleteProfile.builder().build());
        assertThat(results).doesNotContainKey("broken_metric");
        assertThat(results).containsKey("time_in_zones");
    }
}
