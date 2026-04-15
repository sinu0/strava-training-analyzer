package pl.strava.analizator.domain.metrics.calculator;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.vo.BestEfforts;

/**
 * Power Curve calculator — finds best (max average) power for standard durations.
 * Standard durations: 1s, 5s, 10s, 30s, 1min, 2min, 5min, 10min, 20min, 30min, 60min, 90min, 120min
 */
public class PowerCurveCalculator implements ActivityMetricCalculator<BestEfforts> {

    private static final int[] STANDARD_DURATIONS = {
            1, 5, 10, 30, 60, 120, 300, 600, 1200, 1800, 3600, 5400, 7200
    };

    @Override
    public String metricName() {
        return "power_curve";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData();
    }

    @Override
    public BestEfforts calculate(Activity activity, AthleteProfile profile) {
        int[] powerStream = activity.getPowerStream();
        Map<Integer, Double> efforts = new LinkedHashMap<>();

        for (int duration : STANDARD_DURATIONS) {
            if (duration > powerStream.length) {
                break;
            }
            efforts.put(duration, bestAverageForDuration(powerStream, duration));
        }

        return BestEfforts.builder()
                .efforts(efforts)
                .build();
    }

    /**
     * Find the maximum average power over a sliding window of the given duration.
     */
    private double bestAverageForDuration(int[] powerStream, int duration) {
        double windowSum = 0;
        for (int i = 0; i < duration; i++) {
            windowSum += powerStream[i];
        }
        double maxAvg = windowSum / duration;

        for (int i = 1; i <= powerStream.length - duration; i++) {
            windowSum += powerStream[i + duration - 1] - powerStream[i - 1];
            double avg = windowSum / duration;
            if (avg > maxAvg) {
                maxAvg = avg;
            }
        }
        return maxAvg;
    }
}
