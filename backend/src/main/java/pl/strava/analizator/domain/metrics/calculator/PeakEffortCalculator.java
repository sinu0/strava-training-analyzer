package pl.strava.analizator.domain.metrics.calculator;

import java.util.LinkedHashMap;
import java.util.Map;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Peak effort detection using a sliding-window algorithm.
 * Finds the best average for durations: 1s, 5s, 30s, 1min, 5min, 20min, 60min
 * across power, heart rate, and speed streams.
 */
public class PeakEffortCalculator implements ActivityMetricCalculator<Map<String, Object>> {

    private static final int[] DURATIONS_SEC = {1, 5, 30, 60, 300, 1200, 3600};
    private static final String[] DURATION_LABELS = {"1s", "5s", "30s", "1min", "5min", "20min", "60min"};

    @Override
    public String metricName() {
        return "peak_efforts";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData() || activity.hasHeartrateData() || activity.hasVelocityData();
    }

    @Override
    public Map<String, Object> calculate(Activity activity, AthleteProfile profile) {
        Map<String, Object> result = new LinkedHashMap<>();

        if (activity.hasPowerData()) {
            result.put("power", computePeaks(toDoubleArray(activity.getPowerStream())));
        }
        if (activity.hasHeartrateData()) {
            result.put("heartrate", computePeaks(toDoubleArray(activity.getHeartrateStream())));
        }
        if (activity.hasVelocityData()) {
            result.put("speed", computePeaks(activity.getVelocityStream()));
        }

        return result;
    }

    private Map<String, Double> computePeaks(double[] stream) {
        Map<String, Double> peaks = new LinkedHashMap<>();
        int len = stream.length;

        for (int i = 0; i < DURATIONS_SEC.length; i++) {
            int window = DURATIONS_SEC[i];
            if (window > len) break;

            double best = slidingWindowMax(stream, window);
            peaks.put(DURATION_LABELS[i], Math.round(best * 100.0) / 100.0);
        }

        return peaks;
    }

    /**
     * Sliding window maximum average over the given stream.
     */
    private double slidingWindowMax(double[] data, int windowSize) {
        double windowSum = 0;
        for (int i = 0; i < windowSize; i++) {
            windowSum += data[i];
        }
        double maxAvg = windowSum / windowSize;

        for (int i = windowSize; i < data.length; i++) {
            windowSum += data[i] - data[i - windowSize];
            double avg = windowSum / windowSize;
            if (avg > maxAvg) {
                maxAvg = avg;
            }
        }
        return maxAvg;
    }

    private double[] toDoubleArray(int[] intArray) {
        double[] result = new double[intArray.length];
        for (int i = 0; i < intArray.length; i++) {
            result[i] = intArray[i];
        }
        return result;
    }
}
