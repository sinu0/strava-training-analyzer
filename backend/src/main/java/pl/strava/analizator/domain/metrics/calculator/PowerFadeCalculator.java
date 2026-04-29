package pl.strava.analizator.domain.metrics.calculator;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Power fade between the first and last quarter of the activity.
 * Positive values mean power dropped late in the session.
 */
public class PowerFadeCalculator implements ActivityMetricCalculator<Double> {

    private static final int MIN_DURATION_SEC = 2700;

    @Override
    public String metricName() {
        return "power_fade";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData()
                && activity.getMovingTimeSec() != null
                && activity.getMovingTimeSec() >= MIN_DURATION_SEC;
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        int[] powerStream = activity.getPowerStream();
        if (powerStream == null || powerStream.length < 4) {
            return 0.0;
        }

        int quarter = powerStream.length / 4;
        double firstQuarter = average(powerStream, 0, quarter);
        double lastQuarter = average(powerStream, powerStream.length - quarter, powerStream.length);
        if (firstQuarter <= 0) {
            return 0.0;
        }
        return ((firstQuarter - lastQuarter) / firstQuarter) * 100.0;
    }

    private double average(int[] data, int from, int to) {
        double sum = 0;
        for (int i = from; i < to; i++) {
            sum += data[i];
        }
        return sum / Math.max(1, to - from);
    }
}
