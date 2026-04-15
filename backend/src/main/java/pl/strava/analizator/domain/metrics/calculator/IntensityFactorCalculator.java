package pl.strava.analizator.domain.metrics.calculator;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.metrics.MetricCalculationException;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Intensity Factor: IF = NP / FTP
 */
@RequiredArgsConstructor
public class IntensityFactorCalculator implements ActivityMetricCalculator<Double> {

    private final NormalizedPowerCalculator npCalculator;

    @Override
    public String metricName() {
        return "intensity_factor";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData();
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        if (!profile.hasFtp()) {
            throw new MetricCalculationException("FTP required for IF calculation");
        }
        double np = npCalculator.calculate(activity, profile);
        return np / profile.getFtpWatts();
    }
}
