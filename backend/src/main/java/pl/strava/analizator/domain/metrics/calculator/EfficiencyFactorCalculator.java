package pl.strava.analizator.domain.metrics.calculator;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.metrics.ActivityMetricCalculator;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;

/**
 * Efficiency Factor: EF = NP / avg_HR
 * Rising EF trend = improving aerobic fitness.
 */
@RequiredArgsConstructor
public class EfficiencyFactorCalculator implements ActivityMetricCalculator<Double> {

    private final NormalizedPowerCalculator npCalculator;

    @Override
    public String metricName() {
        return "efficiency_factor";
    }

    @Override
    public boolean supports(Activity activity) {
        return activity.hasPowerData() && activity.hasHeartrateData()
                && activity.getAvgHeartrate() != null && activity.getAvgHeartrate() > 0;
    }

    @Override
    public Double calculate(Activity activity, AthleteProfile profile) {
        double np = npCalculator.calculate(activity, profile);
        return np / activity.getAvgHeartrate();
    }
}
