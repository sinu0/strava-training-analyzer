package pl.strava.analizator.domain.metrics.calculator;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Banister exponential TRIMP (TRaining IMPulse) calculator.
 *
 * Formula: TRIMPexp = D × HRr × 0.64 × e^(GENDER_FACTOR × HRr)
 *   D          = duration in minutes
 *   HRr        = (avgHR - HRrest) / (HRmax - HRrest)  — Heart Rate Reserve ratio
 *   GENDER_FACTOR = 1.92 (men) / 1.67 (women); using 1.92 as default
 *
 * This is the basis for Strava's "Relative Effort" metric.
 * Requires AthleteProfile.maxHrBpm and AthleteProfile.restingHrBpm.
 */
public class TRIMPCalculator implements ActivityMetricCalculator<Double> {

    private static final double GENDER_FACTOR = 1.92;
    private static final double SCALING_CONSTANT = 0.64;

    @Override
    public String metricName() {
        return "trimp";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasHeartrateData()
                && activity.getAvgHeartrate() != null
                && activity.getAvgHeartrate() > 0
                && activity.getMovingTimeSec() != null
                && activity.getMovingTimeSec() > 0;
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        validateProfile(profile);

        double durationMinutes = activity.getMovingTimeSec() / 60.0;
        double hrr = computeHeartRateReserveRatio(
                activity.getAvgHeartrate(),
                profile.getRestingHrBpm(),
                profile.getMaxHrBpm()
        );

        return durationMinutes * hrr * SCALING_CONSTANT * Math.exp(GENDER_FACTOR * hrr);
    }

    private void validateProfile(AthleteProfile profile) {
        if (profile.getMaxHrBpm() == null || profile.getMaxHrBpm() <= 0) {
            throw new MetricCalculationException("maxHrBpm required for TRIMP calculation");
        }
        if (profile.getRestingHrBpm() == null || profile.getRestingHrBpm() <= 0) {
            throw new MetricCalculationException("restingHrBpm required for TRIMP calculation");
        }
    }

    private double computeHeartRateReserveRatio(short avgHr, short restingHr, short maxHr) {
        double hrReserve = maxHr - restingHr;
        if (hrReserve <= 0) {
            return 0.0;
        }
        double raw = (avgHr - restingHr) / hrReserve;
        return Math.max(0.0, Math.min(1.0, raw));
    }
}
