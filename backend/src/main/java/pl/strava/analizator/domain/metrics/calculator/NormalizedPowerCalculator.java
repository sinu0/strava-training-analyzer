package pl.strava.analizator.domain.metrics.calculator;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Normalized Power (NP) calculator.
 * Algorithm: 30s rolling average → raise to 4th power → average → 4th root.
 */
public class NormalizedPowerCalculator implements ActivityMetricCalculator<Double> {

    private static final int ROLLING_WINDOW = 30;

    @Override
    public String metricName() {
        return "normalized_power";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData();
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        int[] powerStream = activity.getPowerStream();

        if (powerStream.length < ROLLING_WINDOW) {
            return averagePower(powerStream);
        }

        // Step 1: Calculate 30-second rolling averages
        double[] rollingAvg = new double[powerStream.length - ROLLING_WINDOW + 1];
        double windowSum = 0;
        for (int i = 0; i < ROLLING_WINDOW; i++) {
            windowSum += powerStream[i];
        }
        rollingAvg[0] = windowSum / ROLLING_WINDOW;

        for (int i = 1; i < rollingAvg.length; i++) {
            windowSum += powerStream[i + ROLLING_WINDOW - 1] - powerStream[i - 1];
            rollingAvg[i] = windowSum / ROLLING_WINDOW;
        }

        // Step 2: Raise each rolling average to the 4th power, then average
        double sumFourthPower = 0;
        for (double avg : rollingAvg) {
            double v = avg * avg;
            sumFourthPower += v * v;
        }
        double avgFourthPower = sumFourthPower / rollingAvg.length;

        // Step 3: Take the 4th root
        return Math.pow(avgFourthPower, 0.25);
    }

    private double averagePower(int[] powerStream) {
        double sum = 0;
        for (int w : powerStream) {
            sum += w;
        }
        return sum / powerStream.length;
    }
}
