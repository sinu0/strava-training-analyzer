package pl.strava.analizator.domain.metrics.calculator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

class GradeAdjustedPaceCalculatorTest {

    private final GradeAdjustedPaceCalculator calculator = new GradeAdjustedPaceCalculator();

    @Test
    void supportsRunningWithRequiredStreams() {
        Activity activity = Activity.builder()
                .sportType("running")
                .velocityStream(new double[]{3.0, 3.1})
                .altitudeStream(new double[]{100.0, 100.5})
                .distanceStream(new double[]{0, 10})
                .build();
        assertThat(calculator.supports(activity)).isTrue();
    }

    @Test
    void doesNotSupportCycling() {
        Activity activity = Activity.builder()
                .sportType("cycling")
                .velocityStream(new double[]{8.0})
                .altitudeStream(new double[]{100.0})
                .distanceStream(new double[]{0})
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void doesNotSupportWithoutVelocity() {
        Activity activity = Activity.builder()
                .sportType("running")
                .altitudeStream(new double[]{100.0})
                .distanceStream(new double[]{0})
                .build();
        assertThat(calculator.supports(activity)).isFalse();
    }

    @Test
    void flatRunReturnsGapCloseToActualSpeed() {
        // Flat terrain: altitude constant → GAP should ≈ actual speed
        double[] velocity = new double[100];
        double[] altitude = new double[100];
        double[] distance = new double[100];
        for (int i = 0; i < 100; i++) {
            velocity[i] = 3.5; // ~4:46 min/km
            altitude[i] = 100.0; // flat
            distance[i] = i * 3.5;
        }

        Activity activity = Activity.builder()
                .sportType("running")
                .velocityStream(velocity)
                .altitudeStream(altitude)
                .distanceStream(distance)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Map<String, Object> result = calculator.calculate(activity, profile);
        double gapSpeed = ((Number) result.get("gap_avg_speed_ms")).doubleValue();

        // On flat terrain, GAP should be very close to actual speed
        assertThat(gapSpeed).isBetween(3.0, 4.0);
    }

    @Test
    void uphillRunProducesHigherGap() {
        // Running uphill: actual speed lower but GAP should be higher (equivalent flat effort)
        double[] velocity = new double[100];
        double[] altitude = new double[100];
        double[] distance = new double[100];
        for (int i = 0; i < 100; i++) {
            velocity[i] = 2.5; // slower due to uphill
            altitude[i] = 100.0 + i * 0.5; // 50m over ~250m distance = ~20% grade
            distance[i] = i * 2.5;
        }

        Activity activity = Activity.builder()
                .sportType("running")
                .velocityStream(velocity)
                .altitudeStream(altitude)
                .distanceStream(distance)
                .build();
        AthleteProfile profile = AthleteProfile.builder().build();

        Map<String, Object> result = calculator.calculate(activity, profile);
        double gapSpeed = ((Number) result.get("gap_avg_speed_ms")).doubleValue();

        // GAP should be higher than actual speed (uphill effort = faster flat equivalent)
        assertThat(gapSpeed).isGreaterThan(2.5);
    }
}
