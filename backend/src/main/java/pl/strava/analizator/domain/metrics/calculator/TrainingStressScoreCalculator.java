package pl.strava.analizator.domain.metrics.calculator;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Training Stress Score: TSS = (moving_time_sec × NP × IF) / (FTP × 3600) × 100
 */
@RequiredArgsConstructor
public class TrainingStressScoreCalculator implements ActivityMetricCalculator<Double> {

    private final NormalizedPowerCalculator npCalculator;

    @Override
    public String metricName() {
        return "training_stress_score";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData();
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        if (!profile.hasFtp()) {
            throw new MetricCalculationException("FTP required for TSS calculation");
        }
        double np = npCalculator.calculate(activity, profile);
        double ftp = profile.getFtpWatts();
        double intensityFactor = np / ftp;
        int movingTimeSec = activity.getMovingTimeSec();
        return (movingTimeSec * np * intensityFactor) / (ftp * 3600.0) * 100.0;
    }
}
