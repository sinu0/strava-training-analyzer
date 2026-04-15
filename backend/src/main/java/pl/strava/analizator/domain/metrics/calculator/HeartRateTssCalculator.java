package pl.strava.analizator.domain.metrics.calculator;

import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Heart Rate based TSS (fallback when no power meter).
 * hrTSS = (moving_time_sec × avg_HR × IF_hr) / (LTHR × 3600) × 100
 * where IF_hr = avg_HR / LTHR
 */
public class HeartRateTssCalculator implements ActivityMetricCalculator<Double> {

    @Override
    public String metricName() {
        return "hr_training_stress_score";
    }

    @Override
    public boolean supports(Activity activity) {
        return !activity.hasPowerData() && activity.hasHeartrateData()
                && activity.getAvgHeartrate() != null && activity.getAvgHeartrate() > 0;
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        double lthr = resolveEffectiveLthr(profile);
        double avgHr = activity.getAvgHeartrate();
        double ifHr = avgHr / lthr;
        int movingTimeSec = activity.getMovingTimeSec();
        return (movingTimeSec * avgHr * ifHr) / (lthr * 3600.0) * 100.0;
    }

    /**
     * Resolves effective LTHR from the profile.
     * Priority: explicit LTHR > 87% of max HR > exception.
     * The 0.87 factor is a standard estimate for LTHR from maxHR
     * (typical range is 85–90%, midpoint used here).
     */
    private double resolveEffectiveLthr(AthleteProfile profile) {
        if (profile != null && profile.hasLthr()) {
            return profile.getLthrBpm();
        }
        if (profile != null && profile.getMaxHrBpm() != null && profile.getMaxHrBpm() > 0) {
            return profile.getMaxHrBpm() * 0.87;
        }
        throw new MetricCalculationException("LTHR or max HR required for hrTSS calculation");
    }
}
