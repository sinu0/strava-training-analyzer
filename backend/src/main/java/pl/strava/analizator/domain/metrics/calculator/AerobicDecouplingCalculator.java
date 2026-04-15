package pl.strava.analizator.domain.metrics.calculator;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Aerobic Decoupling: measures cardiac drift by comparing NP:HR ratio
 * between first and second half of activity.
 * Decoupling% = ((Pa:HRa - Pb:HRb) / Pa:HRa) × 100
 * > 5% = poor aerobic endurance, < 5% = good aerobic base.
 */
public class AerobicDecouplingCalculator implements ActivityMetricCalculator<Double> {

    private static final int MIN_DURATION_SEC = 1800; // 30 minutes minimum

    @Override
    public String metricName() {
        return "aerobic_decoupling";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData() && activity.hasHeartrateData()
                && activity.getMovingTimeSec() != null
                && activity.getMovingTimeSec() >= MIN_DURATION_SEC;
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        int[] powerStream = activity.getPowerStream();
        int[] hrStream = activity.getHeartrateStream();

        int len = Math.min(powerStream.length, hrStream.length);
        int half = len / 2;

        double firstHalfPower = average(powerStream, 0, half);
        double firstHalfHr = average(hrStream, 0, half);
        double secondHalfPower = average(powerStream, half, len);
        double secondHalfHr = average(hrStream, half, len);

        if (firstHalfHr == 0 || secondHalfHr == 0) {
            return 0.0;
        }

        double ratioFirst = firstHalfPower / firstHalfHr;
        double ratioSecond = secondHalfPower / secondHalfHr;

        if (ratioFirst == 0) {
            return 0.0;
        }

        return ((ratioFirst - ratioSecond) / ratioFirst) * 100.0;
    }

    private double average(int[] data, int from, int to) {
        double sum = 0;
        for (int i = from; i < to; i++) {
            sum += data[i];
        }
        return sum / (to - from);
    }
}
